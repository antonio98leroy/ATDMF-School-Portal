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
    path("", include(router.urls)),
]
