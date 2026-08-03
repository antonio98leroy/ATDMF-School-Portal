from django.urls import include, path
from rest_framework.routers import DefaultRouter

from .views import (
    CommunicationDashboardViewSet,
    CommunicationUserViewSet,
    DocumentViewSet,
    InternalMessageViewSet,
    NoticeViewSet,
)


router = DefaultRouter()

router.register(
    "notices",
    NoticeViewSet,
    basename="notice",
)

router.register(
    "messages",
    InternalMessageViewSet,
    basename="internal-message",
)

router.register(
    "users",
    CommunicationUserViewSet,
    basename="communication-user",
)

router.register(
    "documents",
    DocumentViewSet,
    basename="communication-document",
)

router.register(
    "dashboard",
    CommunicationDashboardViewSet,
    basename="communication-dashboard",
)


urlpatterns = [
    path("", include(router.urls)),
]
