from django.db.models import Count, Q
from rest_framework import filters, permissions, viewsets
from rest_framework.decorators import action
from rest_framework.parsers import FormParser, JSONParser, MultiPartParser
from rest_framework.response import Response

from .models import Department, Employee, Position
from .serializers import (
    DepartmentSerializer,
    EmployeeSerializer,
    PositionSerializer,
)


class DepartmentViewSet(viewsets.ModelViewSet):
    serializer_class = DepartmentSerializer
    permission_classes = [permissions.IsAuthenticated]

    filter_backends = [
        filters.SearchFilter,
        filters.OrderingFilter,
    ]

    search_fields = [
        "name",
        "code",
        "description",
    ]

    ordering_fields = [
        "name",
        "code",
        "active",
        "created_at",
    ]

    ordering = ["name"]

    def get_queryset(self):
        queryset = Department.objects.annotate(
            employee_total=Count("employees")
        )

        active = self.request.query_params.get("active")

        if active in {"true", "false"}:
            queryset = queryset.filter(
                active=active == "true"
            )

        return queryset


class PositionViewSet(viewsets.ModelViewSet):
    serializer_class = PositionSerializer
    permission_classes = [permissions.IsAuthenticated]

    filter_backends = [
        filters.SearchFilter,
        filters.OrderingFilter,
    ]

    search_fields = [
        "name",
        "description",
    ]

    ordering_fields = [
        "name",
        "active",
        "created_at",
    ]

    ordering = ["name"]

    def get_queryset(self):
        queryset = Position.objects.annotate(
            employee_total=Count("employees")
        )

        active = self.request.query_params.get("active")

        if active in {"true", "false"}:
            queryset = queryset.filter(
                active=active == "true"
            )

        return queryset


class EmployeeViewSet(viewsets.ModelViewSet):
    serializer_class = EmployeeSerializer
    permission_classes = [permissions.IsAuthenticated]

    parser_classes = [
        MultiPartParser,
        FormParser,
        JSONParser,
    ]

    filter_backends = [
        filters.SearchFilter,
        filters.OrderingFilter,
    ]

    search_fields = [
        "employee_id",
        "first_name",
        "middle_name",
        "last_name",
        "phone",
        "alternative_phone",
        "email",
        "department__name",
        "position__name",
    ]

    ordering_fields = [
        "employee_id",
        "first_name",
        "last_name",
        "hire_date",
        "status",
        "created_at",
    ]

    ordering = [
        "last_name",
        "first_name",
    ]

    def get_queryset(self):
        queryset = Employee.objects.select_related(
            "department",
            "position",
        )

        department = self.request.query_params.get(
            "department"
        )

        position = self.request.query_params.get(
            "position"
        )

        employment_type = self.request.query_params.get(
            "employment_type"
        )

        status = self.request.query_params.get(
            "status"
        )

        is_teacher = self.request.query_params.get(
            "is_teacher"
        )

        active = self.request.query_params.get(
            "active"
        )

        if department:
            queryset = queryset.filter(
                department_id=department
            )

        if position:
            queryset = queryset.filter(
                position_id=position
            )

        if employment_type:
            queryset = queryset.filter(
                employment_type=employment_type
            )

        if status:
            queryset = queryset.filter(
                status=status
            )

        if is_teacher in {"true", "false"}:
            queryset = queryset.filter(
                is_teacher=is_teacher == "true"
            )

        if active in {"true", "false"}:
            queryset = queryset.filter(
                active=active == "true"
            )

        return queryset

    @action(
        detail=False,
        methods=["get"],
        url_path="statistics",
    )
    def statistics(self, request):
        queryset = self.get_queryset()

        total = queryset.count()

        active = queryset.filter(
            status=Employee.Status.ACTIVE
        ).count()

        teachers = queryset.filter(
            is_teacher=True,
            status=Employee.Status.ACTIVE,
        ).count()

        inactive = queryset.exclude(
            status=Employee.Status.ACTIVE
        ).count()

        by_department = list(
            queryset
            .values(
                "department_id",
                "department__name",
            )
            .annotate(total=Count("id"))
            .order_by("department__name")
        )

        by_employment_type = list(
            queryset
            .values("employment_type")
            .annotate(total=Count("id"))
            .order_by("employment_type")
        )

        return Response(
            {
                "total": total,
                "active": active,
                "teachers": teachers,
                "inactive": inactive,
                "by_department": by_department,
                "by_employment_type":
                    by_employment_type,
            }
        )

    @action(
        detail=False,
        methods=["get"],
        url_path="teachers",
    )
    def teachers(self, request):
        queryset = self.get_queryset().filter(
            is_teacher=True,
            status=Employee.Status.ACTIVE,
        )

        page = self.paginate_queryset(queryset)

        if page is not None:
            serializer = self.get_serializer(
                page,
                many=True,
            )

            return self.get_paginated_response(
                serializer.data
            )

        serializer = self.get_serializer(
            queryset,
            many=True,
        )

        return Response(serializer.data)

    @action(
        detail=False,
        methods=["get"],
        url_path="lookup",
    )
    def lookup(self, request):
        search = request.query_params.get(
            "search",
            "",
        ).strip()

        queryset = self.get_queryset().filter(
            active=True
        )

        if search:
            queryset = queryset.filter(
                Q(employee_id__icontains=search)
                | Q(first_name__icontains=search)
                | Q(middle_name__icontains=search)
                | Q(last_name__icontains=search)
            )

        queryset = queryset[:50]

        serializer = self.get_serializer(
            queryset,
            many=True,
        )

        return Response(serializer.data)