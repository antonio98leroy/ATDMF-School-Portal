from django.db.models import Count, Sum
from rest_framework import filters, permissions, viewsets
from rest_framework.decorators import action
from rest_framework.response import Response

from .models import TeacherAssignment
from .serializers import TeacherAssignmentSerializer


class TeacherAssignmentViewSet(
    viewsets.ModelViewSet
):
    serializer_class = TeacherAssignmentSerializer

    permission_classes = [
        permissions.IsAuthenticated,
    ]

    filter_backends = [
        filters.SearchFilter,
        filters.OrderingFilter,
    ]

    search_fields = [
        "teacher__employee_id",
        "teacher__first_name",
        "teacher__middle_name",
        "teacher__last_name",
        "subject__name",
        "subject__code",
        "class_section__name",
        "class_section__grade__name",
        "academic_year__name",
        "term__name",
    ]

    ordering_fields = [
        "teacher__first_name",
        "teacher__last_name",
        "subject__name",
        "weekly_periods",
        "created_at",
    ]

    ordering = [
        "class_section__grade__order",
        "class_section__name",
        "subject__name",
    ]

    def get_queryset(self):
        queryset = (
            TeacherAssignment.objects
            .select_related(
                "teacher",
                "academic_year",
                "term",
                "class_section",
                "class_section__grade",
                "subject",
            )
            .all()
        )

        academic_year = self.request.query_params.get(
            "academic_year"
        )

        term = self.request.query_params.get("term")

        teacher = self.request.query_params.get(
            "teacher"
        )

        grade = self.request.query_params.get("grade")

        class_section = (
            self.request.query_params.get(
                "class_section"
            )
        )

        subject = self.request.query_params.get(
            "subject"
        )

        active = self.request.query_params.get(
            "active"
        )

        is_class_teacher = (
            self.request.query_params.get(
                "is_class_teacher"
            )
        )

        if academic_year:
            queryset = queryset.filter(
                academic_year_id=academic_year
            )

        if term:
            queryset = queryset.filter(
                term_id=term
            )

        if teacher:
            queryset = queryset.filter(
                teacher_id=teacher
            )

        if grade:
            queryset = queryset.filter(
                class_section__grade_id=grade
            )

        if class_section:
            queryset = queryset.filter(
                class_section_id=class_section
            )

        if subject:
            queryset = queryset.filter(
                subject_id=subject
            )

        if active in {"true", "false"}:
            queryset = queryset.filter(
                active=active == "true"
            )

        if is_class_teacher in {"true", "false"}:
            queryset = queryset.filter(
                is_class_teacher=(
                    is_class_teacher == "true"
                )
            )

        return queryset

    @action(
        detail=False,
        methods=["get"],
        url_path="statistics",
    )
    def statistics(self, request):
        queryset = self.get_queryset()

        return Response(
            {
                "total_assignments": queryset.count(),
                "active_assignments": queryset.filter(
                    active=True
                ).count(),
                "teachers_assigned": queryset.filter(
                    active=True
                )
                .values("teacher")
                .distinct()
                .count(),
                "classes_covered": queryset.filter(
                    active=True
                )
                .values("class_section")
                .distinct()
                .count(),
                "subjects_covered": queryset.filter(
                    active=True
                )
                .values("subject")
                .distinct()
                .count(),
                "weekly_periods": (
                    queryset.filter(active=True)
                    .aggregate(
                        total=Sum("weekly_periods")
                    )["total"]
                    or 0
                ),
            }
        )

    @action(
        detail=False,
        methods=["get"],
        url_path="workload",
    )
    def workload(self, request):
        queryset = self.get_queryset().filter(
            active=True
        )

        workload = (
            queryset.values(
                "teacher_id",
                "teacher__employee_id",
                "teacher__first_name",
                "teacher__middle_name",
                "teacher__last_name",
            )
            .annotate(
                assignment_count=Count("id"),
                weekly_periods=Sum(
                    "weekly_periods"
                ),
                class_count=Count(
                    "class_section",
                    distinct=True,
                ),
                subject_count=Count(
                    "subject",
                    distinct=True,
                ),
            )
            .order_by(
                "teacher__first_name",
                "teacher__last_name",
            )
        )

        results = []

        for item in workload:
            names = [
                item["teacher__first_name"],
                item["teacher__middle_name"],
                item["teacher__last_name"],
            ]

            results.append(
                {
                    "teacher_id": item[
                        "teacher_id"
                    ],
                    "employee_id": item[
                        "teacher__employee_id"
                    ],
                    "teacher_name": " ".join(
                        name
                        for name in names
                        if name
                    ),
                    "assignment_count": item[
                        "assignment_count"
                    ],
                    "weekly_periods": item[
                        "weekly_periods"
                    ]
                    or 0,
                    "class_count": item[
                        "class_count"
                    ],
                    "subject_count": item[
                        "subject_count"
                    ],
                }
            )

        return Response(results)