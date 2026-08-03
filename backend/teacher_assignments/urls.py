from django.urls import include, path
from rest_framework.routers import DefaultRouter

from .portal_views import (
    MyAssignmentsView,
    MyStudentsView,
    TeacherAttendanceSummaryView,
    TeacherDashboardView,
)
from .views import TeacherAssignmentViewSet


router = DefaultRouter()

router.register(
    "records",
    TeacherAssignmentViewSet,
    basename="teacher-assignment",
)


urlpatterns = [
    path(
        "portal/dashboard/",
        TeacherDashboardView.as_view(),
        name="teacher-portal-dashboard",
    ),
    path(
        "portal/assignments/",
        MyAssignmentsView.as_view(),
        name="teacher-portal-assignments",
    ),
    path(
        "portal/students/",
        MyStudentsView.as_view(),
        name="teacher-portal-students",
    ),
    path(
        "portal/attendance-summary/",
        TeacherAttendanceSummaryView.as_view(),
        name="teacher-attendance-summary",
    ),
    path("", include(router.urls)),
]