from django.db.models import Count, Sum
from rest_framework import permissions, status
from rest_framework.response import Response
from rest_framework.views import APIView

from academics.models import Enrollment
from attendance.models import StudentAttendance
from examinations.models import SubjectResult

from .models import TeacherAssignment


def get_teacher_employee(request):
    employee = getattr(request.user, "employee", None)

    if not employee:
        return None, Response(
            {
                "detail": (
                    "This user account is not linked to an "
                    "employee record."
                )
            },
            status=status.HTTP_403_FORBIDDEN,
        )

    if not employee.is_teacher:
        return None, Response(
            {
                "detail": (
                    "The linked employee is not marked as a teacher."
                )
            },
            status=status.HTTP_403_FORBIDDEN,
        )

    if not employee.active:
        return None, Response(
            {
                "detail": "This teacher account is inactive."
            },
            status=status.HTTP_403_FORBIDDEN,
        )

    return employee, None


class TeacherDashboardView(APIView):
    permission_classes = [permissions.IsAuthenticated]

    def get(self, request):
        teacher, error_response = get_teacher_employee(
            request
        )

        if error_response:
            return error_response

        assignments = (
            TeacherAssignment.objects
            .select_related(
                "academic_year",
                "term",
                "class_section",
                "class_section__grade",
                "subject",
            )
            .filter(
                teacher=teacher,
                active=True,
            )
        )

        class_ids = assignments.values_list(
            "class_section_id",
            flat=True,
        ).distinct()

        subject_ids = assignments.values_list(
            "subject_id",
            flat=True,
        ).distinct()

        active_enrollments = Enrollment.objects.filter(
            class_section_id__in=class_ids,
            active=True,
        )

        attendance_today = (
            StudentAttendance.objects
            .filter(
                class_section_id__in=class_ids,
            )
            .values("date")
            .order_by("-date")
            .first()
        )

        pending_results = SubjectResult.objects.filter(
            subject_id__in=subject_ids,
            enrollment__class_section_id__in=class_ids,
            approved=False,
        ).count()

        workload = assignments.aggregate(
            total_periods=Sum("weekly_periods")
        )["total_periods"] or 0

        return Response(
            {
                "teacher": {
                    "id": teacher.id,
                    "employee_id": teacher.employee_id,
                    "full_name": teacher.full_name,
                    "photo": (
                        teacher.photo.url
                        if teacher.photo
                        else None
                    ),
                    "department": teacher.department.name,
                    "position": teacher.position.name,
                    "qualification": teacher.qualification,
                    "specialization": teacher.specialization,
                },
                "statistics": {
                    "classes": assignments.values(
                        "class_section"
                    ).distinct().count(),
                    "subjects": assignments.values(
                        "subject"
                    ).distinct().count(),
                    "students": active_enrollments.values(
                        "student"
                    ).distinct().count(),
                    "assignments": assignments.count(),
                    "weekly_periods": workload,
                    "pending_results": pending_results,
                },
                "latest_attendance_date": (
                    attendance_today["date"]
                    if attendance_today
                    else None
                ),
            }
        )


class MyAssignmentsView(APIView):
    permission_classes = [permissions.IsAuthenticated]

    def get(self, request):
        teacher, error_response = get_teacher_employee(
            request
        )

        if error_response:
            return error_response

        queryset = (
            TeacherAssignment.objects
            .select_related(
                "academic_year",
                "term",
                "class_section",
                "class_section__grade",
                "subject",
            )
            .filter(
                teacher=teacher,
                active=True,
            )
        )

        academic_year = request.query_params.get(
            "academic_year"
        )

        term = request.query_params.get("term")

        if academic_year:
            queryset = queryset.filter(
                academic_year_id=academic_year
            )

        if term:
            queryset = queryset.filter(term_id=term)

        results = []

        for assignment in queryset:
            student_count = Enrollment.objects.filter(
                class_section=assignment.class_section,
                academic_year=assignment.academic_year,
                active=True,
            ).count()

            results.append(
                {
                    "id": assignment.id,
                    "academic_year": (
                        assignment.academic_year.id
                    ),
                    "academic_year_name": (
                        assignment.academic_year.name
                    ),
                    "term": assignment.term.id,
                    "term_name": assignment.term.name,
                    "class_section": (
                        assignment.class_section.id
                    ),
                    "class_name": str(
                        assignment.class_section
                    ),
                    "grade_name": (
                        assignment.class_section.grade.name
                    ),
                    "subject": assignment.subject.id,
                    "subject_code": (
                        assignment.subject.code
                    ),
                    "subject_name": (
                        assignment.subject.name
                    ),
                    "weekly_periods": (
                        assignment.weekly_periods
                    ),
                    "is_class_teacher": (
                        assignment.is_class_teacher
                    ),
                    "student_count": student_count,
                }
            )

        return Response(results)


class MyStudentsView(APIView):
    permission_classes = [permissions.IsAuthenticated]

    def get(self, request):
        teacher, error_response = get_teacher_employee(
            request
        )

        if error_response:
            return error_response

        class_section = request.query_params.get(
            "class_section"
        )

        academic_year = request.query_params.get(
            "academic_year"
        )

        if not class_section or not academic_year:
            return Response(
                {
                    "detail": (
                        "Class section and academic year "
                        "are required."
                    )
                },
                status=status.HTTP_400_BAD_REQUEST,
            )

        allowed = TeacherAssignment.objects.filter(
            teacher=teacher,
            class_section_id=class_section,
            academic_year_id=academic_year,
            active=True,
        ).exists()

        if not allowed:
            return Response(
                {
                    "detail": (
                        "You are not assigned to this class "
                        "for the selected academic year."
                    )
                },
                status=status.HTTP_403_FORBIDDEN,
            )

        enrollments = (
            Enrollment.objects
            .select_related(
                "student",
                "class_section",
                "academic_year",
            )
            .filter(
                class_section_id=class_section,
                academic_year_id=academic_year,
                active=True,
            )
            .order_by(
                "student__last_name",
                "student__first_name",
            )
        )

        results = []

        for enrollment in enrollments:
            student = enrollment.student

            results.append(
                {
                    "enrollment_id": enrollment.id,
                    "student_id": student.id,
                    "admission_number": (
                        student.admission_number
                    ),
                    "full_name": student.full_name,
                    "gender": student.gender,
                    "phone": student.phone,
                    "email": student.email,
                    "address": student.address,
                    "photo": (
                        student.photo.url
                        if student.photo
                        else None
                    ),
                    "roll_number": (
                        enrollment.roll_number
                    ),
                    "class_name": str(
                        enrollment.class_section
                    ),
                    "academic_year_name": (
                        enrollment.academic_year.name
                    ),
                }
            )

        return Response(results)


class TeacherAttendanceSummaryView(APIView):
    permission_classes = [permissions.IsAuthenticated]

    def get(self, request):
        teacher, error_response = get_teacher_employee(
            request
        )

        if error_response:
            return error_response

        class_section = request.query_params.get(
            "class_section"
        )

        term = request.query_params.get("term")

        if not class_section:
            return Response(
                {
                    "detail": "Class section is required."
                },
                status=status.HTTP_400_BAD_REQUEST,
            )

        allowed = TeacherAssignment.objects.filter(
            teacher=teacher,
            class_section_id=class_section,
            active=True,
        ).exists()

        if not allowed:
            return Response(
                {
                    "detail": (
                        "You are not assigned to this class."
                    )
                },
                status=status.HTTP_403_FORBIDDEN,
            )

        attendance = StudentAttendance.objects.filter(
            class_section_id=class_section
        )

        if term:
            attendance = attendance.filter(term_id=term)

        summary = (
            attendance.values("status")
            .annotate(total=Count("id"))
            .order_by("status")
        )

        totals = {
            "P": 0,
            "A": 0,
            "L": 0,
            "E": 0,
        }

        for item in summary:
            totals[item["status"]] = item["total"]

        totals["total_records"] = sum(
            totals.values()
        )

        return Response(totals)