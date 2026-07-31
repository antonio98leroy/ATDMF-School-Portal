from django.urls import include,path
from rest_framework.routers import DefaultRouter
from .views import AuditLogViewSet
r=DefaultRouter(); r.register('logs',AuditLogViewSet)
urlpatterns=[path('',include(r.urls))]
