from datetime import datetime
from decimal import Decimal

from django.db import transaction
from django.db.models import Count, Q
from django.utils import timezone

from rest_framework import (
    filters,
    permissions,
    status,
    viewsets,
)
from rest_framework.decorators import action
from rest_framework.response import Response

from academics.models import Enrollment
from employees.models import Employee

from .models import (
    EmployeeAttendance,
    StudentAttendance,
)
from .serializers import (
    EmployeeAttendanceSerializer,
    StudentAttendanceSerializer,
)


class AttendanceBaseViewSet(
    viewsets.ModelViewSet
):
    permission_classes = [
        permissions.IsAuthenticated,
    ]

    filter_backends = [
        filters.SearchFilter,
        filters.OrderingFilter,
    ]


class StudentAttendanceViewSet(
    AttendanceBaseViewSet
):
    serializer_class = (
        StudentAttendanceSerializer
    )

    search_fields = [
        "student__admission_number",
        "student__first_name",
        "student__middle_name",
        "student__last_name",
        "remarks",
    ]

    ordering_fields = [
        "date",
        "created_at",
        "status",
    ]

    ordering = [
        "-date",
        "student__last_name",
    ]

    def get_queryset(self):
        queryset = (
            StudentAttendance.objects
            .select_related(
                "student",
                "class_section",
                "class_section__grade",
                "term",
                "term__academic_year",
                "recorded_by",
                "corrected_by",
            )
            .all()
        )

        student = self.request.query_params.get(
            "student"
        )

        class_section = (
            self.request.query_params.get(
                "class_section"
            )
        )

        term = self.request.query_params.get(
            "term"
        )

        academic_year = (
            self.request.query_params.get(
                "academic_year"
            )
        )

        date_value = (
            self.request.query_params.get(
                "date"
            )
        )

        date_from = (
            self.request.query_params.get(
                "date_from"
            )
        )

        date_to = self.request.query_params.get(
            "date_to"
        )

        status_value = (
            self.request.query_params.get(
                "status"
            )
        )

        if student:
            queryset = queryset.filter(
                student_id=student
            )

        if class_section:
            queryset = queryset.filter(
                class_section_id=class_section
            )

        if term:
            queryset = queryset.filter(
                term_id=term
            )

        if academic_year:
            queryset = queryset.filter(
                term__academic_year_id=(
                    academic_year
                )
            )

        if date_value:
            queryset = queryset.filter(
                date=date_value
            )

        if date_from:
            queryset = queryset.filter(
                date__gte=date_from
            )

        if date_to:
            queryset = queryset.filter(
                date__lte=date_to
            )

        if status_value:
            queryset = queryset.filter(
                status=status_value
            )

        return queryset

    def perform_create(self, serializer):
        serializer.save(
            recorded_by=self.request.user
        )

    def perform_update(self, serializer):
        correction_reason = (
            self.request.data.get(
                "correction_reason",
                "",
            )
        )

        serializer.save(
            corrected=True,
            correction_reason=correction_reason,
            corrected_by=self.request.user,
            corrected_at=timezone.now(),
        )

    @action(
        detail=False,
        methods=["get"],
        url_path="class-register",
    )
    def class_register(self, request):
        class_section_id = (
            request.query_params.get(
                "class_section"
            )
        )

        term_id = request.query_params.get(
            "term"
        )

        date_value = request.query_params.get(
            "date",
            timezone.localdate(),
        )

        if not class_section_id or not term_id:
            return Response(
                {
                    "detail": (
                        "Class section and term are required."
                    )
                },
                status=status.HTTP_400_BAD_REQUEST,
            )

        enrollments = (
            Enrollment.objects
            .select_related("student")
            .filter(
                class_section_id=class_section_id,
                active=True,
            )
            .order_by(
                "student__last_name",
                "student__first_name",
            )
        )

        existing_records = {
            item.student_id: item
            for item in (
                StudentAttendance.objects
                .filter(
                    class_section_id=(
                        class_section_id
                    ),
                    term_id=term_id,
                    date=date_value,
                )
            )
        }

        records = []

        for enrollment in enrollments:
            student = enrollment.student

            existing = existing_records.get(
                student.id
            )

            records.append(
                {
                    "student": student.id,
                    "student_name": (
                        student.full_name
                    ),
                    "admission_number": (
                        student.admission_number
                    ),
                    "gender": student.gender,
                    "attendance_id": (
                        existing.id
                        if existing
                        else None
                    ),
                    "status": (
                        existing.status
                        if existing
                        else "P"
                    ),
                    "remarks": (
                        existing.remarks
                        if existing
                        else ""
                    ),
                    "time_in": (
                        existing.time_in
                        if existing
                        else None
                    ),
                }
            )

        return Response(
            {
                "class_section": int(
                    class_section_id
                ),
                "term": int(term_id),
                "date": date_value,
                "students": records,
            }
        )

    @action(
        detail=False,
        methods=["post"],
        url_path="bulk-save",
    )
    def bulk_save(self, request):
        class_section_id = request.data.get(
            "class_section"
        )

        term_id = request.data.get("term")

        date_value = request.data.get(
            "date"
        )

        records = request.data.get(
            "records",
            [],
        )

        if not all(
            [
                class_section_id,
                term_id,
                date_value,
            ]
        ):
            return Response(
                {
                    "detail": (
                        "Class section, term, and date "
                        "are required."
                    )
                },
                status=status.HTTP_400_BAD_REQUEST,
            )

        if not isinstance(records, list):
            return Response(
                {
                    "records": (
                        "Attendance records must be a list."
                    )
                },
                status=status.HTTP_400_BAD_REQUEST,
            )

        created_count = 0
        updated_count = 0

        with transaction.atomic():
            for record in records:
                student_id = record.get(
                    "student"
                )

                attendance_status = (
                    record.get("status", "P")
                )

                remarks = record.get(
                    "remarks",
                    "",
                )

                time_in = record.get(
                    "time_in"
                )

                attendance, created = (
                    StudentAttendance.objects
                    .update_or_create(
                        student_id=student_id,
                        date=date_value,
                        defaults={
                            "class_section_id": (
                                class_section_id
                            ),
                            "term_id": term_id,
                            "status": (
                                attendance_status
                            ),
                            "remarks": remarks,
                            "time_in": (
                                time_in or None
                            ),
                            "recorded_by": (
                                request.user
                            ),
                        },
                    )
                )

                if created:
                    created_count += 1
                else:
                    updated_count += 1

        return Response(
            {
                "created_count": created_count,
                "updated_count": updated_count,
                "total_count": len(records),
            }
        )

    @action(
        detail=False,
        methods=["get"],
        url_path="statistics",
    )
    def statistics(self, request):
        queryset = self.get_queryset()

        total = queryset.count()

        counts = {
            item["status"]: item["total"]
            for item in (
                queryset
                .values("status")
                .annotate(total=Count("id"))
            )
        }

        present = counts.get("P", 0)
        late = counts.get("L", 0)

        attendance_count = present + late

        attendance_rate = (
            round(
                attendance_count
                / total
                * 100,
                2,
            )
            if total
            else 0
        )

        return Response(
            {
                "total": total,
                "present": present,
                "absent": counts.get(
                    "A",
                    0,
                ),
                "late": late,
                "excused": counts.get(
                    "E",
                    0,
                ),
                "sick": counts.get(
                    "S",
                    0,
                ),
                "attendance_rate": (
                    attendance_rate
                ),
            }
        )

    @action(
        detail=False,
        methods=["get"],
        url_path="daily-summary",
    )
    def daily_summary(self, request):
        date_value = request.query_params.get(
            "date",
            timezone.localdate(),
        )

        queryset = (
            StudentAttendance.objects
            .filter(date=date_value)
        )

        academic_year = (
            request.query_params.get(
                "academic_year"
            )
        )

        if academic_year:
            queryset = queryset.filter(
                term__academic_year_id=(
                    academic_year
                )
            )

        rows = (
            queryset
            .values(
                "class_section__id",
                "class_section__name",
                "class_section__grade__name",
            )
            .annotate(
                total=Count("id"),
                present=Count(
                    "id",
                    filter=Q(status="P"),
                ),
                absent=Count(
                    "id",
                    filter=Q(status="A"),
                ),
                late=Count(
                    "id",
                    filter=Q(status="L"),
                ),
                excused=Count(
                    "id",
                    filter=Q(status="E"),
                ),
                sick=Count(
                    "id",
                    filter=Q(status="S"),
                ),
            )
            .order_by(
                "class_section__grade__name",
                "class_section__name",
            )
        )

        data = []

        for row in rows:
            total = row["total"] or 0

            attended = (
                row["present"]
                + row["late"]
            )

            data.append(
                {
                    **row,
                    "attendance_rate": (
                        round(
                            attended
                            / total
                            * 100,
                            2,
                        )
                        if total
                        else 0
                    ),
                }
            )

        return Response(
            {
                "date": date_value,
                "classes": data,
            }
        )

    @action(
        detail=False,
        methods=["get"],
        url_path="frequent-absentees",
    )
    def frequent_absentees(
        self,
        request,
    ):
        queryset = self.get_queryset().filter(
            status="A"
        )

        minimum_absences = int(
            request.query_params.get(
                "minimum_absences",
                3,
            )
        )

        rows = (
            queryset
            .values(
                "student__id",
                "student__admission_number",
                "student__first_name",
                "student__middle_name",
                "student__last_name",
                "class_section__name",
                "class_section__grade__name",
            )
            .annotate(
                absence_count=Count("id")
            )
            .filter(
                absence_count__gte=(
                    minimum_absences
                )
            )
            .order_by("-absence_count")
        )

        records = []

        for row in rows:
            full_name = " ".join(
                name
                for name in [
                    row[
                        "student__first_name"
                    ],
                    row[
                        "student__middle_name"
                    ],
                    row[
                        "student__last_name"
                    ],
                ]
                if name
            )

            records.append(
                {
                    "student_id": (
                        row["student__id"]
                    ),
                    "admission_number": (
                        row[
                            "student__admission_number"
                        ]
                    ),
                    "student_name": full_name,
                    "grade_name": (
                        row[
                            "class_section__grade__name"
                        ]
                    ),
                    "class_name": (
                        row[
                            "class_section__name"
                        ]
                    ),
                    "absence_count": (
                        row["absence_count"]
                    ),
                }
            )

        return Response(records)


class EmployeeAttendanceViewSet(
    AttendanceBaseViewSet
):
    serializer_class = (
        EmployeeAttendanceSerializer
    )

    search_fields = [
        "employee__employee_id",
        "employee__first_name",
        "employee__middle_name",
        "employee__last_name",
        "employee__department__name",
        "remarks",
    ]

    ordering_fields = [
        "date",
        "created_at",
        "status",
    ]

    ordering = [
        "-date",
        "employee__last_name",
    ]

    def get_queryset(self):
        queryset = (
            EmployeeAttendance.objects
            .select_related(
                "employee",
                "employee__department",
                "employee__position",
                "recorded_by",
                "corrected_by",
            )
            .all()
        )

        employee = self.request.query_params.get(
            "employee"
        )

        department = (
            self.request.query_params.get(
                "department"
            )
        )

        date_value = (
            self.request.query_params.get(
                "date"
            )
        )

        date_from = (
            self.request.query_params.get(
                "date_from"
            )
        )

        date_to = self.request.query_params.get(
            "date_to"
        )

        status_value = (
            self.request.query_params.get(
                "status"
            )
        )

        if employee:
            queryset = queryset.filter(
                employee_id=employee
            )

        if department:
            queryset = queryset.filter(
                employee__department_id=(
                    department
                )
            )

        if date_value:
            queryset = queryset.filter(
                date=date_value
            )

        if date_from:
            queryset = queryset.filter(
                date__gte=date_from
            )

        if date_to:
            queryset = queryset.filter(
                date__lte=date_to
            )

        if status_value:
            queryset = queryset.filter(
                status=status_value
            )

        return queryset

    def perform_create(self, serializer):
        serializer.save(
            recorded_by=self.request.user
        )

    def perform_update(self, serializer):
        correction_reason = (
            self.request.data.get(
                "correction_reason",
                "",
            )
        )

        serializer.save(
            corrected=True,
            correction_reason=correction_reason,
            corrected_by=self.request.user,
            corrected_at=timezone.now(),
        )

    @action(
        detail=False,
        methods=["get"],
        url_path="daily-register",
    )
    def daily_register(self, request):
        date_value = request.query_params.get(
            "date",
            timezone.localdate(),
        )

        employees = (
            Employee.objects
            .select_related(
                "department",
                "position",
            )
            .filter(active=True)
            .order_by(
                "last_name",
                "first_name",
            )
        )

        existing_records = {
            item.employee_id: item
            for item in (
                EmployeeAttendance.objects
                .filter(date=date_value)
            )
        }

        records = []

        for employee in employees:
            existing = existing_records.get(
                employee.id
            )

            records.append(
                {
                    "employee": employee.id,
                    "employee_id": (
                        employee.employee_id
                    ),
                    "employee_name": (
                        employee.full_name
                    ),
                    "department_name": (
                        employee.department.name
                        if employee.department
                        else ""
                    ),
                    "position_name": (
                        employee.position.name
                        if employee.position
                        else ""
                    ),
                    "attendance_id": (
                        existing.id
                        if existing
                        else None
                    ),
                    "status": (
                        existing.status
                        if existing
                        else "P"
                    ),
                    "time_in": (
                        existing.time_in
                        if existing
                        else None
                    ),
                    "time_out": (
                        existing.time_out
                        if existing
                        else None
                    ),
                    "remarks": (
                        existing.remarks
                        if existing
                        else ""
                    ),
                }
            )

        return Response(
            {
                "date": date_value,
                "employees": records,
            }
        )

    @action(
        detail=False,
        methods=["post"],
        url_path="bulk-save",
    )
    def bulk_save(self, request):
        date_value = request.data.get(
            "date"
        )

        records = request.data.get(
            "records",
            [],
        )

        if not date_value:
            return Response(
                {
                    "date": (
                        "Attendance date is required."
                    )
                },
                status=status.HTTP_400_BAD_REQUEST,
            )

        created_count = 0
        updated_count = 0

        with transaction.atomic():
            for record in records:
                attendance, created = (
                    EmployeeAttendance.objects
                    .update_or_create(
                        employee_id=(
                            record.get(
                                "employee"
                            )
                        ),
                        date=date_value,
                        defaults={
                            "status": (
                                record.get(
                                    "status",
                                    "P",
                                )
                            ),
                            "time_in": (
                                record.get(
                                    "time_in"
                                )
                                or None
                            ),
                            "time_out": (
                                record.get(
                                    "time_out"
                                )
                                or None
                            ),
                            "remarks": (
                                record.get(
                                    "remarks",
                                    "",
                                )
                            ),
                            "recorded_by": (
                                request.user
                            ),
                        },
                    )
                )

                if created:
                    created_count += 1
                else:
                    updated_count += 1

        return Response(
            {
                "created_count": created_count,
                "updated_count": updated_count,
                "total_count": len(records),
            }
        )

    @action(
        detail=False,
        methods=["get"],
        url_path="statistics",
    )
    def statistics(self, request):
        queryset = self.get_queryset()

        total = queryset.count()

        counts = {
            item["status"]: item["total"]
            for item in (
                queryset
                .values("status")
                .annotate(total=Count("id"))
            )
        }

        present = counts.get("P", 0)
        late = counts.get("L", 0)

        attendance_rate = (
            round(
                (present + late)
                / total
                * 100,
                2,
            )
            if total
            else 0
        )

        return Response(
            {
                "total": total,
                "present": present,
                "absent": counts.get(
                    "A",
                    0,
                ),
                "late": late,
                "excused": counts.get(
                    "E",
                    0,
                ),
                "sick": counts.get(
                    "S",
                    0,
                ),
                "leave": counts.get(
                    "LV",
                    0,
                ),
                "attendance_rate": (
                    attendance_rate
                ),
            }
        )
