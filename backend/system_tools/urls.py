from django.urls import path
from .views import AdminSearchView, BackupDownloadView, BackupView, HealthView, MaintenanceView, SessionsView
urlpatterns=[path('health/',HealthView.as_view(),name='system-health'),path('backups/',BackupView.as_view(),name='system-backups'),path('backups/<str:filename>/download/',BackupDownloadView.as_view(),name='system-backup-download'),path('sessions/',SessionsView.as_view(),name='system-sessions'),path('maintenance/',MaintenanceView.as_view(),name='system-maintenance'),path('admin-search/',AdminSearchView.as_view(),name='admin-search')]
