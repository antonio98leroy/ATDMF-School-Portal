from django.urls import include,path
from rest_framework.routers import DefaultRouter
from .views import StudentViewSet,GuardianViewSet
r=DefaultRouter(); r.register('records',StudentViewSet); r.register('guardians',GuardianViewSet)
urlpatterns=[path('',include(r.urls))]
