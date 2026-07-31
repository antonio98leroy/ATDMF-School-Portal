from rest_framework import filters, viewsets
from rest_framework.parsers import FormParser, JSONParser, MultiPartParser
from rest_framework.permissions import IsAuthenticated

from .models import Guardian, Student
from .serializers import GuardianSerializer, StudentSerializer


class StudentViewSet(viewsets.ModelViewSet):
    serializer_class = StudentSerializer
    permission_classes = [IsAuthenticated]
    parser_classes = [JSONParser, MultiPartParser, FormParser]
    filter_backends = [filters.SearchFilter, filters.OrderingFilter]

    search_fields = [
        "admission_number",
        "first_name",
        "middle_name",
        "last_name",
        "phone",
        "email",
        "guardian__name",
        "guardian__phone",
    ]

    ordering_fields = [
        "admission_number",
        "first_name",
        "last_name",
        "admission_date",
        "created_at",
    ]

    ordering = ["-created_at"]

    def get_queryset(self):
        return (
            Student.objects
            .select_related("guardian", "user")
            .all()
        )


class GuardianViewSet(viewsets.ModelViewSet):
    queryset = Guardian.objects.all().order_by("name")
    serializer_class = GuardianSerializer
    permission_classes = [IsAuthenticated]
    filter_backends = [filters.SearchFilter, filters.OrderingFilter]
    search_fields = ["name", "phone", "email"]
    ordering_fields = ["name", "id"]
    ordering = ["name"]
