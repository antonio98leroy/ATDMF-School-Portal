from .classroom_views import (
    ClassroomAttendanceRosterView,
    ClassroomAttendanceSubmitView,
)

from django.urls import include, path
from rest_framework.routers import DefaultRouter

from .views import (
    EmployeeAttendanceViewSet,
    StudentAttendanceViewSet,
)


router = DefaultRouter()

router.register(
    "records",
    StudentAttendanceViewSet,
    basename="student-attendance",
)

router.register(
    "employees",
    EmployeeAttendanceViewSet,
    basename="employee-attendance",
)


urlpatterns = [

    path(
        "classroom/roster/",
        ClassroomAttendanceRosterView.as_view(),
        name="classroom-attendance-roster",
    ),
    path(
        "classroom/submit/",
        ClassroomAttendanceSubmitView.as_view(),
        name="classroom-attendance-submit",
    ),

    path("", include(router.urls)),
]
