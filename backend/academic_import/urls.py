from django.urls import include, path
from rest_framework.routers import DefaultRouter
from .views import AcademicImportBatchViewSet

router = DefaultRouter()
router.register(
    "batches",
    AcademicImportBatchViewSet,
    basename="academic-import-batch",
)

urlpatterns = [
    path("", include(router.urls)),
]
