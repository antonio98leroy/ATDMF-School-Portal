from django.contrib import admin
from .models import SchoolSettings


@admin.register(SchoolSettings)
class SchoolSettingsAdmin(admin.ModelAdmin):
    list_display = ["school_name", "default_currency", "updated_at"]
    readonly_fields = ["updated_by", "created_at", "updated_at"]

    def has_add_permission(self, request):
        return not SchoolSettings.objects.exists()

    def has_delete_permission(self, request, obj=None):
        return False
