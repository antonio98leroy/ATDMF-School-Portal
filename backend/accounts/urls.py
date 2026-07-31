from django.urls import path,include
from rest_framework.routers import DefaultRouter
from rest_framework_simplejwt.views import TokenObtainPairView,TokenRefreshView
from .views import CurrentUserView,UserViewSet
r=DefaultRouter(); r.register('users',UserViewSet)
urlpatterns=[path('login/',TokenObtainPairView.as_view()),path('token/refresh/',TokenRefreshView.as_view()),path('me/',CurrentUserView.as_view()),path('',include(r.urls))]
