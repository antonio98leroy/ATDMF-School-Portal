from django.db import transaction
from django.db.models import Sum

from rest_framework import filters, status, viewsets
from rest_framework.decorators import action
from rest_framework.permissions import IsAuthenticated
from rest_framework.response import Response
from rest_framework.views import APIView

from finance.models import Payment, StudentInvoice
from staff.models import StaffMember
from students.models import Student

from examinations.services import (
    average,
    get_subject_year_result,
)

from .models import (
    AcademicYear,
    ClassSection,
    Enrollment,
    GradeLevel,
    StudentPromotion,
    Subject,
    SubjectAssignment,
    Term,
    TimetableEntry,
)

from .serializers import (
    AcademicYearSerializer,
    ClassSectionSerializer,
    EnrollmentSerializer,
    GradeLevelSerializer,
    StudentPromotionSerializer,
    SubjectAssignmentSerializer,
    SubjectSerializer,
    TermSerializer,
    TimetableEntrySerializer,
)


class BaseAcademicViewSet(viewsets.ModelViewSet):
    permission_classes = [IsAuthenticated]
    filter_backends = [
        filters.SearchFilter,
        filters.OrderingFilter,
    ]


class AcademicYearViewSet(BaseAcademicViewSet):
    queryset = AcademicYear.objects.all().order_by(
        "-start_date"
    )
    serializer_class = AcademicYearSerializer
    search_fields = ["name"]
    ordering_fields = [
        "name",
        "start_date",
        "end_date",
        "active",
    ]


class TermViewSet(BaseAcademicViewSet):
    queryset = (
        Term.objects.select_related("academic_year")
        .all()
        .order_by("-start_date")
    )
    serializer_class = TermSerializer
    search_fields = [
        "name",
        "academic_year__name",
    ]


class GradeLevelViewSet(BaseAcademicViewSet):
    queryset = GradeLevel.objects.all().order_by(
        "order",
        "name",
    )
    serializer_class = GradeLevelSerializer
    search_fields = ["name"]
    ordering_fields = ["name", "order"]


class ClassSectionViewSet(BaseAcademicViewSet):
    queryset = (
        ClassSection.objects
        .select_related("grade", "class_teacher")
        .prefetch_related("enrollments")
        .all()
        .order_by("grade__order", "name")
    )
    serializer_class = ClassSectionSerializer
    search_fields = [
        "name",
        "grade__name",
    ]
    ordering_fields = [
        "name",
        "grade__name",
        "capacity",
    ]


class SubjectViewSet(BaseAcademicViewSet):
    queryset = Subject.objects.all().order_by("name")
    serializer_class = SubjectSerializer
    search_fields = ["code", "name"]
    ordering_fields = ["code", "name"]


class EnrollmentViewSet(BaseAcademicViewSet):
    queryset = (
        Enrollment.objects
        .select_related(
            "student",
            "class_section",
            "class_section__grade",
            "academic_year",
        )
        .all()
        .order_by(
            "-academic_year__start_date",
            "class_section__grade__order",
            "class_section__name",
            "roll_number",
        )
    )

    serializer_class = EnrollmentSerializer

    search_fields = [
        "student__admission_number",
        "student__first_name",
        "student__middle_name",
        "student__last_name",
        "class_section__name",
        "class_section__grade__name",
        "academic_year__name",
    ]

    ordering_fields = [
        "roll_number",
        "student__first_name",
        "student__last_name",
        "academic_year__name",
    ]

    def get_queryset(self):
        queryset = super().get_queryset()

        academic_year = self.request.query_params.get(
            "academic_year"
        )
        class_section = self.request.query_params.get(
            "class_section"
        )
        grade = self.request.query_params.get("grade")
        active = self.request.query_params.get("active")

        if academic_year:
            queryset = queryset.filter(
                academic_year_id=academic_year
            )

        if class_section:
            queryset = queryset.filter(
                class_section_id=class_section
            )

        if grade:
            queryset = queryset.filter(
                class_section__grade_id=grade
            )

        if active in ["true", "false"]:
            queryset = queryset.filter(
                active=active == "true"
            )

        return queryset

class SubjectAssignmentViewSet(BaseAcademicViewSet):
    queryset = (
        SubjectAssignment.objects
        .select_related(
            "subject",
            "class_section",
            "class_section__grade",
            "teacher",
            "academic_year",
        )
        .all()
        .order_by("-id")
    )
    serializer_class = SubjectAssignmentSerializer
    search_fields = [
        "subject__name",
        "subject__code",
        "class_section__name",
        "class_section__grade__name",
        "academic_year__name",
    ]


class TimetableEntryViewSet(BaseAcademicViewSet):
    queryset = (
        TimetableEntry.objects
        .select_related(
            "class_section",
            "class_section__grade",
            "subject",
            "teacher",
        )
        .all()
        .order_by("day", "start_time")
    )
    serializer_class = TimetableEntrySerializer
    search_fields = [
        "subject__name",
        "class_section__name",
        "class_section__grade__name",
        "room",
    ]

class StudentPromotionViewSet(
    viewsets.ModelViewSet
):
    serializer_class = StudentPromotionSerializer

    permission_classes = [
        IsAuthenticated,
    ]

    filter_backends = [
        filters.SearchFilter,
        filters.OrderingFilter,
    ]

    search_fields = [
        "student__admission_number",
        "student__first_name",
        "student__middle_name",
        "student__last_name",
        "source_academic_year__name",
        "target_academic_year__name",
        "source_class__name",
        "target_class__name",
    ]

    ordering = ["-processed_at"]

    def get_queryset(self):
        queryset = (
            StudentPromotion.objects
            .select_related(
                "student",
                "source_enrollment",
                "source_academic_year",
                "source_class",
                "target_academic_year",
                "target_class",
                "target_enrollment",
                "promoted_by",
            )
            .all()
        )

        source_year = self.request.query_params.get(
            "source_academic_year"
        )

        target_year = self.request.query_params.get(
            "target_academic_year"
        )

        source_class = self.request.query_params.get(
            "source_class"
        )

        decision = self.request.query_params.get(
            "decision"
        )

        if source_year:
            queryset = queryset.filter(
                source_academic_year_id=source_year
            )

        if target_year:
            queryset = queryset.filter(
                target_academic_year_id=target_year
            )

        if source_class:
            queryset = queryset.filter(
                source_class_id=source_class
            )

        if decision:
            queryset = queryset.filter(
                decision=decision
            )

        return queryset

    @action(
        detail=False,
        methods=["get"],
        url_path="class-students",
    )
    def class_students(self, request):
        academic_year = request.query_params.get(
            "academic_year"
        )

        class_section = request.query_params.get(
            "class_section"
        )

        if not academic_year or not class_section:
            return Response(
                {
                    "detail": (
                        "Academic year and class section "
                        "are required."
                    )
                },
                status=status.HTTP_400_BAD_REQUEST,
            )

        enrollments = (
            Enrollment.objects
            .select_related(
                "student",
                "class_section",
                "class_section__grade",
                "academic_year",
            )
            .filter(
                academic_year_id=academic_year,
                class_section_id=class_section,
                active=True,
            )
            .order_by(
                "student__last_name",
                "student__first_name",
            )
        )

        rows = []

        for enrollment in enrollments:
            subject_ids = (
                enrollment.subject_results
                .values_list(
                    "subject_id",
                    flat=True,
                )
                .distinct()
            )

            scores = []

            for subject in Subject.objects.filter(
                id__in=subject_ids
            ):
                result = get_subject_year_result(
                    enrollment,
                    subject,
                )

                if (
                    result["yearly_average"]
                    is not None
                ):
                    scores.append(
                        result["yearly_average"]
                    )

            yearly_average = average(scores)

            existing_promotion = (
                StudentPromotion.objects
                .filter(
                    student=enrollment.student,
                    source_academic_year_id=academic_year,
                )
                .order_by("-processed_at")
                .first()
            )

            rows.append(
                {
                    "enrollment_id": enrollment.id,
                    "student_id": enrollment.student.id,
                    "admission_number": (
                        enrollment.student
                        .admission_number
                    ),
                    "student_name": (
                        enrollment.student.full_name
                    ),
                    "gender": enrollment.student.gender,
                    "yearly_average": yearly_average,
                    "already_processed": bool(
                        existing_promotion
                    ),
                    "previous_decision": (
                        existing_promotion.decision
                        if existing_promotion
                        else ""
                    ),
                }
            )

        return Response(rows)

    @action(
        detail=False,
        methods=["post"],
        url_path="bulk-process",
    )
    def bulk_process(self, request):
        source_academic_year_id = (
            request.data.get(
                "source_academic_year"
            )
        )

        target_academic_year_id = (
            request.data.get(
                "target_academic_year"
            )
        )

        source_class_id = request.data.get(
            "source_class"
        )

        target_class_id = request.data.get(
            "target_class"
        )

        records = request.data.get(
            "records",
            [],
        )

        if not all(
            [
                source_academic_year_id,
                target_academic_year_id,
                source_class_id,
            ]
        ):
            return Response(
                {
                    "detail": (
                        "Source year, target year, and "
                        "source class are required."
                    )
                },
                status=status.HTTP_400_BAD_REQUEST,
            )

        if (
            str(source_academic_year_id)
            == str(target_academic_year_id)
        ):
            return Response(
                {
                    "target_academic_year": (
                        "Target academic year must be "
                        "different from the source year."
                    )
                },
                status=status.HTTP_400_BAD_REQUEST,
            )

        if not isinstance(records, list) or not records:
            return Response(
                {
                    "records": (
                        "At least one student promotion "
                        "record is required."
                    )
                },
                status=status.HTTP_400_BAD_REQUEST,
            )

        source_year = AcademicYear.objects.get(
            pk=source_academic_year_id
        )

        target_year = AcademicYear.objects.get(
            pk=target_academic_year_id
        )

        source_class = ClassSection.objects.get(
            pk=source_class_id
        )

        target_class = None

        if target_class_id:
            target_class = ClassSection.objects.get(
                pk=target_class_id
            )

        created_records = []
        errors = []

        with transaction.atomic():
            for index, record in enumerate(records):
                enrollment_id = record.get(
                    "enrollment_id"
                )

                decision = record.get(
                    "decision"
                )

                remarks = record.get(
                    "remarks",
                    "",
                )

                yearly_average = record.get(
                    "yearly_average"
                )

                try:
                    enrollment = (
                        Enrollment.objects
                        .select_related(
                            "student",
                            "class_section",
                            "academic_year",
                        )
                        .get(
                            pk=enrollment_id,
                            academic_year=source_year,
                            class_section=source_class,
                        )
                    )
                except Enrollment.DoesNotExist:
                    errors.append(
                        {
                            "row": index + 1,
                            "detail": (
                                "Source enrollment was "
                                "not found."
                            ),
                        }
                    )
                    continue

                if decision not in (
                    StudentPromotion.Decision.values
                ):
                    errors.append(
                        {
                            "row": index + 1,
                            "detail": (
                                "Invalid promotion decision."
                            ),
                        }
                    )
                    continue

                selected_target_class = target_class

                if (
                    decision
                    == StudentPromotion.Decision.REPEATED
                ):
                    selected_target_class = source_class

                if decision in {
                    StudentPromotion.Decision.GRADUATED,
                    StudentPromotion.Decision.WITHDRAWN,
                }:
                    selected_target_class = None

                if (
                    decision
                    in {
                        StudentPromotion.Decision.PROMOTED,
                        StudentPromotion.Decision.REPEATED,
                    }
                    and not selected_target_class
                ):
                    errors.append(
                        {
                            "row": index + 1,
                            "detail": (
                                "A target class is required "
                                "for promoted or repeated "
                                "students."
                            ),
                        }
                    )
                    continue

                target_enrollment = None

                if selected_target_class:
                    target_enrollment, _ = (
                        Enrollment.objects
                        .get_or_create(
                            student=enrollment.student,
                            academic_year=target_year,
                            defaults={
                                "class_section": (
                                    selected_target_class
                                ),
                                "active": True,
                            },
                        )
                    )

                    if (
                        target_enrollment.class_section_id
                        != selected_target_class.id
                    ):
                        target_enrollment.class_section = (
                            selected_target_class
                        )
                        target_enrollment.active = True
                        target_enrollment.save(
                            update_fields=[
                                "class_section",
                                "active",
                            ]
                        )

                promotion, _ = (
                    StudentPromotion.objects
                    .update_or_create(
                        student=enrollment.student,
                        source_academic_year=source_year,
                        target_academic_year=target_year,
                        defaults={
                            "source_enrollment": (
                                enrollment
                            ),
                            "source_class": source_class,
                            "target_class": (
                                selected_target_class
                            ),
                            "target_enrollment": (
                                target_enrollment
                            ),
                            "decision": decision,
                            "yearly_average": (
                                yearly_average
                                if yearly_average
                                not in ("", None)
                                else None
                            ),
                            "remarks": remarks,
                            "promoted_by": request.user,
                        },
                    )
                )

                enrollment.active = False
                enrollment.save(
                    update_fields=["active"]
                )

                created_records.append(promotion)

            if errors:
                transaction.set_rollback(True)

                return Response(
                    {"errors": errors},
                    status=status.HTTP_400_BAD_REQUEST,
                )

        serializer = self.get_serializer(
            created_records,
            many=True,
        )

        return Response(
            {
                "processed_count": len(
                    created_records
                ),
                "records": serializer.data,
            },
            status=status.HTTP_201_CREATED,
        )

    @action(
        detail=False,
        methods=["get"],
        url_path="statistics",
    )
    def statistics(self, request):
        queryset = self.get_queryset()

        return Response(
            {
                "total": queryset.count(),
                "promoted": queryset.filter(
                    decision=(
                        StudentPromotion.Decision.PROMOTED
                    )
                ).count(),
                "repeated": queryset.filter(
                    decision=(
                        StudentPromotion.Decision.REPEATED
                    )
                ).count(),
                "graduated": queryset.filter(
                    decision=(
                        StudentPromotion.Decision.GRADUATED
                    )
                ).count(),
                "withdrawn": queryset.filter(
                    decision=(
                        StudentPromotion.Decision.WITHDRAWN
                    )
                ).count(),
            }
        )


class DashboardView(APIView):
    permission_classes = [IsAuthenticated]

    def get(self, request):
        fees_collected = (
            Payment.objects.aggregate(total=Sum("amount"))["total"]
            or 0
        )

        total_invoiced = (
            StudentInvoice.objects.aggregate(
                total=Sum("total_amount")
            )["total"]
            or 0
        )

        outstanding = total_invoiced - fees_collected

        if outstanding < 0:
            outstanding = 0

        return Response(
            {
                "students": Student.objects.filter(
                    is_active=True
                ).count(),
                "staff": StaffMember.objects.filter(
                    active=True
                ).count(),
                "classes": ClassSection.objects.count(),
                "subjects": Subject.objects.count(),
                "enrollments": Enrollment.objects.filter(
                    active=True
                ).count(),
                "fees": float(fees_collected),
                "fees_collected": float(fees_collected),
                "total_invoiced": float(total_invoiced),
                "outstanding": float(outstanding),
            }
        )
