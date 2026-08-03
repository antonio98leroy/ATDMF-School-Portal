from django.urls import path
from .views import BackupView, HealthView
urlpatterns = [
    path("health/", HealthView.as_view(), name="system-health"),
    path("backups/", BackupView.as_view(), name="system-backups"),
]
