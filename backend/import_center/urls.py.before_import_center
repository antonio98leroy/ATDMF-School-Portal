from django.urls import include, path
from rest_framework.routers import DefaultRouter
from .views import ImportBatchViewSet

router = DefaultRouter()
router.register("batches", ImportBatchViewSet, basename="import-batch")
urlpatterns = [path("", include(router.urls))]
