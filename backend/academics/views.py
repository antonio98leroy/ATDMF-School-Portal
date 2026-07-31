from django.db.models import Sum
from rest_framework import filters, viewsets
from rest_framework.permissions import IsAuthenticated
from rest_framework.response import Response
from rest_framework.views import APIView

from finance.models import Payment, StudentInvoice
from staff.models import StaffMember
from students.models import Student

from .models import (
    AcademicYear,
    ClassSection,
    Enrollment,
    GradeLevel,
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
        .order_by("-id")
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


class DashboardView(APIView):
    permission_classes = [IsAuthenticated]

    def get(self, request):
        fees_collected = (
            Payment.objects.aggregate(total=Sum("amount"))[
                "total"
            ]
            or 0
        )

        outstanding = (
            StudentInvoice.objects.aggregate(
                total=Sum("balance")
            )["total"]
            or 0
        )

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
                "outstanding": float(outstanding),
            }
        )
