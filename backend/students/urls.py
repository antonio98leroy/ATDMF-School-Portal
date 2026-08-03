from django.urls import include, path
from rest_framework.routers import DefaultRouter

from .parent_portal_views import (
    ParentPortalChildAttendanceView,
    ParentPortalChildEnrollmentsView,
    ParentPortalChildResultsView,
    ParentPortalDashboardView,
)
from .portal_views import (
    StudentPortalAttendanceView,
    StudentPortalDashboardView,
    StudentPortalEnrollmentsView,
    StudentPortalResultsView,
)
from .views import (
    GuardianViewSet,
    StudentViewSet,
)


router = DefaultRouter()

router.register(
    "records",
    StudentViewSet,
    basename="student",
)

router.register(
    "guardians",
    GuardianViewSet,
    basename="guardian",
)


urlpatterns = [
    # Student portal
    path(
        "portal/dashboard/",
        StudentPortalDashboardView.as_view(),
        name="student-portal-dashboard",
    ),
    path(
        "portal/enrollments/",
        StudentPortalEnrollmentsView.as_view(),
        name="student-portal-enrollments",
    ),
    path(
        "portal/attendance/",
        StudentPortalAttendanceView.as_view(),
        name="student-portal-attendance",
    ),
    path(
        "portal/results/",
        StudentPortalResultsView.as_view(),
        name="student-portal-results",
    ),

    # Parent portal
    path(
        "parent-portal/dashboard/",
        ParentPortalDashboardView.as_view(),
        name="parent-portal-dashboard",
    ),
    path(
        "parent-portal/attendance/",
        ParentPortalChildAttendanceView.as_view(),
        name="parent-portal-attendance",
    ),
    path(
        "parent-portal/results/",
        ParentPortalChildResultsView.as_view(),
        name="parent-portal-results",
    ),
    path(
        "parent-portal/enrollments/",
        ParentPortalChildEnrollmentsView.as_view(),
        name="parent-portal-enrollments",
    ),

    path("", include(router.urls)),
]