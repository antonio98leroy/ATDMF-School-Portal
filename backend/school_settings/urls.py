from django.urls import path
from .views import SchoolSettingsView

urlpatterns = [
    path("", SchoolSettingsView.as_view(), name="school-settings"),
]
