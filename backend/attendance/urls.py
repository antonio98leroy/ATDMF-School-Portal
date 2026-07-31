from django.urls import include,path
from rest_framework.routers import DefaultRouter
from .views import AttendanceViewSet
r=DefaultRouter(); r.register('records',AttendanceViewSet)
urlpatterns=[path('',include(r.urls))]
