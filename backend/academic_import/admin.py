from django.contrib import admin
from .models import AcademicImportBatch


@admin.register(AcademicImportBatch)
class AcademicImportBatchAdmin(admin.ModelAdmin):
    list_display = [
        "original_filename",
        "academic_year",
        "class_section",
        "status",
        "valid_rows",
        "error_rows",
        "imported_rows",
        "uploaded_by",
        "uploaded_at",
    ]
    list_filter = [
        "status",
        "academic_year",
        "class_section",
    ]
    readonly_fields = [
        "preview_data",
        "created_result_ids",
        "uploaded_at",
        "imported_at",
        "rolled_back_at",
    ]
