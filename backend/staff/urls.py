from django.urls import include,path
from rest_framework.routers import DefaultRouter
from .views import DepartmentViewSet,StaffViewSet
r=DefaultRouter(); r.register('departments',DepartmentViewSet); r.register('members',StaffViewSet)
urlpatterns=[path('',include(r.urls))]
