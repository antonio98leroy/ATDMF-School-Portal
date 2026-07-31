from django.urls import include,path
from rest_framework.routers import DefaultRouter
from .views import *
r=DefaultRouter(); r.register('years',AcademicYearViewSet); r.register('terms',TermViewSet); r.register('grades',GradeLevelViewSet); r.register('classes',ClassSectionViewSet); r.register('subjects',SubjectViewSet); r.register('enrollments',EnrollmentViewSet); r.register('assignments',SubjectAssignmentViewSet); r.register('timetable',TimetableEntryViewSet)
urlpatterns=[path('dashboard/',DashboardView.as_view()),path('',include(r.urls))]
