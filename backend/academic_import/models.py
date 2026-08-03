from django.conf import settings
from django.db import models


class AcademicImportBatch(models.Model):
    class Status(models.TextChoices):
        PREVIEWED = "PREVIEWED", "Previewed"
        IMPORTED = "IMPORTED", "Imported"
        ROLLED_BACK = "ROLLED_BACK", "Rolled Back"
        FAILED = "FAILED", "Failed"

    original_filename = models.CharField(max_length=255)
    academic_year = models.ForeignKey(
        "academics.AcademicYear",
        on_delete=models.PROTECT,
        related_name="academic_import_batches",
    )
    class_section = models.ForeignKey(
        "academics.ClassSection",
        on_delete=models.PROTECT,
        related_name="academic_import_batches",
    )
    status = models.CharField(
        max_length=20,
        choices=Status.choices,
        default=Status.PREVIEWED,
    )
    preview_data = models.JSONField(default=list, blank=True)
    created_result_ids = models.JSONField(default=list, blank=True)
    total_rows = models.PositiveIntegerField(default=0)
    valid_rows = models.PositiveIntegerField(default=0)
    error_rows = models.PositiveIntegerField(default=0)
    imported_rows = models.PositiveIntegerField(default=0)
    uploaded_by = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.SET_NULL,
        null=True,
        blank=True,
        related_name="academic_import_batches",
    )
    uploaded_at = models.DateTimeField(auto_now_add=True)
    imported_at = models.DateTimeField(null=True, blank=True)
    rolled_back_at = models.DateTimeField(null=True, blank=True)
    notes = models.TextField(blank=True)

    class Meta:
        ordering = ["-uploaded_at"]

    def __str__(self):
        return f"{self.original_filename} - {self.class_section}"
