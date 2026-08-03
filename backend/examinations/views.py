from decimal import Decimal

from django.db import transaction
from django.db.models import Avg
from rest_framework import (
    filters,
    permissions,
    status,
    viewsets,
)
from rest_framework.decorators import action
from rest_framework.response import Response

from academics.models import Enrollment, Subject

from .models import (
    Assessment,
    CBTOption,
    CBTQuestion,
    GradeScale,
    ResultPeriod,
    Score,
    SubjectResult,
)
from .serializers import (
    AssessmentSerializer,
    CBTOptionSerializer,
    CBTQuestionSerializer,
    GradeScaleSerializer,
    ResultPeriodSerializer,
    ScoreSerializer,
    SubjectResultSerializer,
)
from .services import (
    average,
    get_subject_year_result,
    resolve_grade,
)


class AssessmentViewSet(viewsets.ModelViewSet):
    queryset = (
        Assessment.objects
        .select_related(
            "term",
            "class_section",
            "subject",
        )
        .all()
    )

    serializer_class = AssessmentSerializer
    permission_classes = [
        permissions.IsAuthenticated,
    ]


class ScoreViewSet(viewsets.ModelViewSet):
    queryset = (
        Score.objects
        .select_related(
            "assessment",
            "student",
        )
        .all()
    )

    serializer_class = ScoreSerializer
    permission_classes = [
        permissions.IsAuthenticated,
    ]


class GradeScaleViewSet(viewsets.ModelViewSet):
    queryset = GradeScale.objects.all()

    serializer_class = GradeScaleSerializer

    permission_classes = [
        permissions.IsAuthenticated,
    ]

    filter_backends = [
        filters.OrderingFilter,
    ]

    ordering = ["grading_system", "-min_score"]

    def get_queryset(self):
        queryset = super().get_queryset()

        grading_system = (
            self.request.query_params.get(
                "grading_system"
            )
        )

        active = self.request.query_params.get(
            "active"
        )

        if grading_system:
            queryset = queryset.filter(
                grading_system=grading_system
            )

        if active in {"true", "false"}:
            queryset = queryset.filter(
                active=active == "true"
            )

        return queryset


class ResultPeriodViewSet(
    viewsets.ModelViewSet
):
    queryset = (
        ResultPeriod.objects
        .select_related("academic_year")
        .all()
    )

    serializer_class = ResultPeriodSerializer

    permission_classes = [
        permissions.IsAuthenticated,
    ]

    filter_backends = [
        filters.SearchFilter,
        filters.OrderingFilter,
    ]

    search_fields = [
        "name",
        "academic_year__name",
    ]

    ordering = [
        "academic_year__start_date",
        "order",
    ]

    def get_queryset(self):
        queryset = super().get_queryset()

        academic_year = (
            self.request.query_params.get(
                "academic_year"
            )
        )

        active = self.request.query_params.get(
            "active"
        )

        published = self.request.query_params.get(
            "published"
        )

        if academic_year:
            queryset = queryset.filter(
                academic_year_id=academic_year
            )

        if active in {"true", "false"}:
            queryset = queryset.filter(
                active=active == "true"
            )

        if published in {"true", "false"}:
            queryset = queryset.filter(
                published=published == "true"
            )

        return queryset

    @action(
        detail=False,
        methods=["post"],
        url_path="create-year-periods",
    )
    def create_year_periods(self, request):
        academic_year_id = request.data.get(
            "academic_year"
        )

        if not academic_year_id:
            return Response(
                {
                    "academic_year": (
                        "Academic year is required."
                    )
                },
                status=status.HTTP_400_BAD_REQUEST,
            )

        created = []

        for code, name in ResultPeriod.Code.choices:
            period, was_created = (
                ResultPeriod.objects.get_or_create(
                    academic_year_id=academic_year_id,
                    code=code,
                    defaults={
                        "name": name,
                        "order": (
                            ResultPeriod.PERIOD_ORDER[
                                code
                            ]
                        ),
                    },
                )
            )

            if was_created:
                created.append(period)

        serializer = self.get_serializer(
            ResultPeriod.objects.filter(
                academic_year_id=academic_year_id
            ),
            many=True,
        )

        return Response(
            {
                "created_count": len(created),
                "periods": serializer.data,
            }
        )


class SubjectResultViewSet(
    viewsets.ModelViewSet
):
    serializer_class = SubjectResultSerializer

    permission_classes = [
        permissions.IsAuthenticated,
    ]

    filter_backends = [
        filters.SearchFilter,
        filters.OrderingFilter,
    ]

    search_fields = [
        "enrollment__student__admission_number",
        "enrollment__student__first_name",
        "enrollment__student__middle_name",
        "enrollment__student__last_name",
        "subject__name",
        "subject__code",
        "period__name",
        "enrollment__class_section__name",
        "enrollment__class_section__grade__name",
    ]

    ordering_fields = [
        "enrollment__student__first_name",
        "enrollment__student__last_name",
        "subject__name",
        "period__order",
        "updated_at",
    ]

    ordering = [
        "enrollment__student__last_name",
        "enrollment__student__first_name",
        "subject__name",
    ]

    def get_queryset(self):
        queryset = (
            SubjectResult.objects
            .select_related(
                "enrollment",
                "enrollment__student",
                "enrollment__class_section",
                "enrollment__class_section__grade",
                "enrollment__academic_year",
                "subject",
                "period",
                "entered_by",
                "approved_by",
            )
            .all()
        )

        academic_year = (
            self.request.query_params.get(
                "academic_year"
            )
        )

        period = self.request.query_params.get(
            "period"
        )

        class_section = (
            self.request.query_params.get(
                "class_section"
            )
        )

        student = self.request.query_params.get(
            "student"
        )

        subject = self.request.query_params.get(
            "subject"
        )

        approved = self.request.query_params.get(
            "approved"
        )

        published = self.request.query_params.get(
            "published"
        )

        if academic_year:
            queryset = queryset.filter(
                enrollment__academic_year_id=(
                    academic_year
                )
            )

        if period:
            queryset = queryset.filter(
                period_id=period
            )

        if class_section:
            queryset = queryset.filter(
                enrollment__class_section_id=(
                    class_section
                )
            )

        if student:
            queryset = queryset.filter(
                enrollment__student_id=student
            )

        if subject:
            queryset = queryset.filter(
                subject_id=subject
            )

        if approved in {"true", "false"}:
            queryset = queryset.filter(
                approved=approved == "true"
            )

        if published in {"true", "false"}:
            queryset = queryset.filter(
                published=published == "true"
            )

        return queryset

    @action(
        detail=False,
        methods=["post"],
        url_path="bulk-save",
    )
    def bulk_save(self, request):
        records = request.data.get("records")

        if not isinstance(records, list):
            return Response(
                {
                    "records": (
                        "A list of result records "
                        "is required."
                    )
                },
                status=status.HTTP_400_BAD_REQUEST,
            )

        saved_records = []
        errors = []

        with transaction.atomic():
            for index, record in enumerate(records):
                result_id = record.pop(
                    "id",
                    None,
                )

                if result_id:
                    instance = (
                        SubjectResult.objects
                        .filter(pk=result_id)
                        .first()
                    )

                    serializer = self.get_serializer(
                        instance,
                        data=record,
                        partial=True,
                    )
                else:
                    serializer = self.get_serializer(
                        data=record
                    )

                if serializer.is_valid():
                    saved_records.append(
                        serializer.save(
                            entered_by=request.user
                        )
                    )
                else:
                    errors.append(
                        {
                            "row": index + 1,
                            "errors": serializer.errors,
                        }
                    )

            if errors:
                transaction.set_rollback(True)

                return Response(
                    {"errors": errors},
                    status=(
                        status.HTTP_400_BAD_REQUEST
                    ),
                )

        return Response(
            self.get_serializer(
                saved_records,
                many=True,
            ).data
        )

    @action(
        detail=False,
        methods=["post"],
        url_path="approve",
    )
    def approve(self, request):
        result_ids = request.data.get(
            "result_ids",
            [],
        )

        updated = (
            SubjectResult.objects
            .filter(id__in=result_ids)
            .update(
                approved=True,
                approved_by=request.user,
            )
        )

        return Response(
            {
                "approved_count": updated,
            }
        )

    @action(
        detail=False,
        methods=["post"],
        url_path="publish",
    )
    def publish(self, request):
        result_ids = request.data.get(
            "result_ids",
            [],
        )

        updated = (
            SubjectResult.objects
            .filter(
                id__in=result_ids,
                approved=True,
            )
            .update(published=True)
        )

        return Response(
            {
                "published_count": updated,
            }
        )

    @action(
        detail=False,
        methods=["get"],
        url_path="report-card",
    )
    def report_card(self, request):
        student_id = request.query_params.get(
            "student"
        )

        academic_year_id = (
            request.query_params.get(
                "academic_year"
            )
        )

        if not student_id or not academic_year_id:
            return Response(
                {
                    "detail": (
                        "Student and academic year "
                        "are required."
                    )
                },
                status=status.HTTP_400_BAD_REQUEST,
            )

        enrollment = (
            Enrollment.objects
            .select_related(
                "student",
                "class_section",
                "class_section__grade",
                "academic_year",
            )
            .filter(
                student_id=student_id,
                academic_year_id=academic_year_id,
            )
            .first()
        )

        if not enrollment:
            return Response(
                {
                    "detail": (
                        "No enrollment record was found."
                    )
                },
                status=status.HTTP_404_NOT_FOUND,
            )

        subject_ids = (
            SubjectResult.objects
            .filter(enrollment=enrollment)
            .values_list(
                "subject_id",
                flat=True,
            )
            .distinct()
        )

        subjects = Subject.objects.filter(
            id__in=subject_ids
        ).order_by("name")

        subject_results = [
            get_subject_year_result(
                enrollment,
                subject,
            )
            for subject in subjects
        ]

        yearly_scores = [
            result["yearly_average"]
            for result in subject_results
            if result["yearly_average"] is not None
        ]

        overall_average = average(yearly_scores)

        grading_system = (
            enrollment.class_section.grade
            .grading_system
        )

        overall_grade = resolve_grade(
            overall_average,
            grading_system,
        )

        return Response(
            {
                "student": {
                    "id": enrollment.student.id,
                    "admission_number": (
                        enrollment.student
                        .admission_number
                    ),
                    "full_name": (
                        enrollment.student.full_name
                    ),
                    "gender": (
                        enrollment.student.gender
                    ),
                },
                "academic_year": {
                    "id": enrollment.academic_year.id,
                    "name": (
                        enrollment.academic_year.name
                    ),
                },
                "class": {
                    "id": (
                        enrollment.class_section.id
                    ),
                    "name": str(
                        enrollment.class_section
                    ),
                    "grade": (
                        enrollment.class_section
                        .grade.name
                    ),
                    "grading_system": (
                        grading_system
                    ),
                },
                "subjects": subject_results,
                "overall_average": (
                    overall_average
                ),
                "overall_grade": overall_grade[
                    "grade"
                ],
                "overall_remark": overall_grade[
                    "remark"
                ],
            }
        )

    @action(
        detail=False,
        methods=["get"],
        url_path="class-summary",
    )
    def class_summary(self, request):
        class_section = (
            request.query_params.get(
                "class_section"
            )
        )

        academic_year = (
            request.query_params.get(
                "academic_year"
            )
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

        enrollments = (
            Enrollment.objects
            .select_related(
                "student",
                "class_section",
                "class_section__grade",
            )
            .filter(
                class_section_id=class_section,
                academic_year_id=academic_year,
                active=True,
            )
        )

        summary = []

        for enrollment in enrollments:
            subject_ids = (
                SubjectResult.objects
                .filter(enrollment=enrollment)
                .values_list(
                    "subject_id",
                    flat=True,
                )
                .distinct()
            )

            subject_scores = []

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
                    subject_scores.append(
                        result["yearly_average"]
                    )

            overall = average(subject_scores)

            grade_data = resolve_grade(
                overall,
                enrollment.class_section
                .grade.grading_system,
            )

            summary.append(
                {
                    "student_id": (
                        enrollment.student.id
                    ),
                    "admission_number": (
                        enrollment.student
                        .admission_number
                    ),
                    "student_name": (
                        enrollment.student.full_name
                    ),
                    "overall_average": overall,
                    "grade": grade_data["grade"],
                    "remark": grade_data["remark"],
                }
            )

        ranked = sorted(
            summary,
            key=lambda item: (
                item["overall_average"]
                if item["overall_average"]
                is not None
                else Decimal("-1")
            ),
            reverse=True,
        )

        previous_score = None
        current_position = 0

        for index, item in enumerate(
            ranked,
            start=1,
        ):
            if item["overall_average"] != previous_score:
                current_position = index
                previous_score = item[
                    "overall_average"
                ]

            item["position"] = current_position

        return Response(ranked)


class CBTQuestionViewSet(viewsets.ModelViewSet):
    queryset = CBTQuestion.objects.all()

    serializer_class = CBTQuestionSerializer

    permission_classes = [
        permissions.IsAuthenticated,
    ]


class CBTOptionViewSet(viewsets.ModelViewSet):
    queryset = CBTOption.objects.all()

    serializer_class = CBTOptionSerializer

    permission_classes = [
        permissions.IsAuthenticated,
    ]