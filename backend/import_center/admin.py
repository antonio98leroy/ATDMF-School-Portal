from django.contrib import admin
from .models import ImportBatch, ImportedObject

@admin.register(ImportBatch)
class ImportBatchAdmin(admin.ModelAdmin):
    list_display = ["batch_number", "import_type", "original_filename", "academic_year", "status", "total_rows", "successful_rows", "failed_rows", "uploaded_at"]
    list_filter = ["status", "import_type", "academic_year"]
    search_fields = ["batch_number", "original_filename", "uploaded_by__username"]
    readonly_fields = ["batch_number", "preview_data", "summary", "uploaded_at", "confirmed_at", "rolled_back_at"]

@admin.register(ImportedObject)
class ImportedObjectAdmin(admin.ModelAdmin):
    list_display = ["batch", "app_label", "model_name", "object_id", "object_repr"]
    readonly_fields = ["batch", "app_label", "model_name", "object_id", "object_repr", "created_at"]
