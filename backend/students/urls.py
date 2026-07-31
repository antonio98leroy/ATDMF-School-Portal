from django.urls import include, path
from rest_framework.routers import DefaultRouter

from .views import GuardianViewSet, StudentViewSet


router = DefaultRouter()

router.register(
    "records",
    StudentViewSet,
    basename="student",
)

router.register(
    "guardians",
    GuardianViewSet,
    basename="guardian",
)

urlpatterns = [
    path("", include(router.urls)),
]
