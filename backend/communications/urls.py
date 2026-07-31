from django.urls import include,path
from rest_framework.routers import DefaultRouter
from .views import NoticeViewSet,DocumentViewSet
r=DefaultRouter(); r.register('notices',NoticeViewSet); r.register('documents',DocumentViewSet)
urlpatterns=[path('',include(r.urls))]
