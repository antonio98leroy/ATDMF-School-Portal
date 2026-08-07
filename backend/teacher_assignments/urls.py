
from .timetable_views import (
    SchoolPeriodListView,
    TimetableEntryListCreateView,
    TimetableEntryDetailView,
    MyTimetableView,
)

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
        "timetable/periods/",
        SchoolPeriodListView.as_view(),
        name="timetable-periods",
    ),
    path(
        "timetable/entries/",
        TimetableEntryListCreateView.as_view(),
        name="timetable-entries",
    ),
    path(
        "timetable/entries/<int:pk>/",
        TimetableEntryDetailView.as_view(),
        name="timetable-entry-detail",
    ),
    path(
        "portal/my-timetable/",
        MyTimetableView.as_view(),
        name="my-timetable",
    ),

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