from django.urls import include, path
from rest_framework.routers import DefaultRouter

from .owner_views import OwnerDashboardView
from .principal_views import PrincipalDashboardView
from .reports_views import (
    AcademicPerformanceReportView,
    AttendanceReportView,
    EmployeeReportView,
    FinanceReportView,
    PromotionReportView,
    ReportsSummaryView,
    SponsorshipReportView,
    StudentRegisterReportView,
)
from .views import (
    AcademicYearViewSet,
    ClassSectionViewSet,
    DashboardView,
    EnrollmentViewSet,
    GradeLevelViewSet,
    StudentPromotionViewSet,
    SubjectAssignmentViewSet,
    SubjectViewSet,
    TermViewSet,
    TimetableEntryViewSet,
)


router = DefaultRouter()

router.register(
    "years",
    AcademicYearViewSet,
    basename="academic-year",
)

router.register(
    "terms",
    TermViewSet,
    basename="term",
)

router.register(
    "grades",
    GradeLevelViewSet,
    basename="grade-level",
)

router.register(
    "classes",
    ClassSectionViewSet,
    basename="class-section",
)

router.register(
    "subjects",
    SubjectViewSet,
    basename="subject",
)

router.register(
    "enrollments",
    EnrollmentViewSet,
    basename="enrollment",
)

router.register(
    "assignments",
    SubjectAssignmentViewSet,
    basename="subject-assignment",
)

router.register(
    "timetable",
    TimetableEntryViewSet,
    basename="timetable-entry",
)

router.register(
    "promotions",
    StudentPromotionViewSet,
    basename="student-promotion",
)


urlpatterns = [
    path(
        "dashboard/",
        DashboardView.as_view(),
        name="academic-dashboard",
    ),

    path(
        "principal-dashboard/",
        PrincipalDashboardView.as_view(),
        name="principal-dashboard",
    ),

    path(
        "owner-dashboard/",
        OwnerDashboardView.as_view(),
        name="owner-dashboard",
    ),

    path(
        "reports/summary/",
        ReportsSummaryView.as_view(),
        name="reports-summary",
    ),

    path(
        "reports/students/",
        StudentRegisterReportView.as_view(),
        name="reports-students",
    ),

    path(
        "reports/sponsorships/",
        SponsorshipReportView.as_view(),
        name="reports-sponsorships",
    ),

    path(
        "reports/attendance/",
        AttendanceReportView.as_view(),
        name="reports-attendance",
    ),

    path(
        "reports/finance/",
        FinanceReportView.as_view(),
        name="reports-finance",
    ),

    path(
        "reports/promotions/",
        PromotionReportView.as_view(),
        name="reports-promotions",
    ),

    path(
        "reports/employees/",
        EmployeeReportView.as_view(),
        name="reports-employees",
    ),

    path(
        "reports/academic-performance/",
        AcademicPerformanceReportView.as_view(),
        name="reports-academic-performance",
    ),

    path(
        "",
        include(router.urls),
    ),
]
