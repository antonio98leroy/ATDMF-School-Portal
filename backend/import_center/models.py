from django.conf import settings
from django.db import models


class ImportBatch(models.Model):
    class ImportType(models.TextChoices):
        SPONSORSHIP = "SPONSORSHIP", "Students, Guardians and Sponsorships"
        EMPLOYEE = "EMPLOYEE", "Employees / Staff"

    class Status(models.TextChoices):
        PREVIEWED = "PREVIEWED", "Previewed"
        COMPLETED = "COMPLETED", "Completed"
        PARTIAL = "PARTIAL", "Completed with Errors"
        FAILED = "FAILED", "Failed"
        ROLLED_BACK = "ROLLED_BACK", "Rolled Back"

    batch_number = models.CharField(max_length=40, unique=True, blank=True)
    import_type = models.CharField(max_length=30, choices=ImportType.choices)
    source_file = models.FileField(upload_to="imports/%Y/%m/")
    original_filename = models.CharField(max_length=255)
    academic_year = models.ForeignKey(
        "academics.AcademicYear",
        on_delete=models.PROTECT,
        related_name="import_batches",
        null=True,
        blank=True,
    )
    status = models.CharField(max_length=30, choices=Status.choices, default=Status.PREVIEWED)
    preview_data = models.JSONField(default=list, blank=True)
    summary = models.JSONField(default=dict, blank=True)
    total_rows = models.PositiveIntegerField(default=0)
    successful_rows = models.PositiveIntegerField(default=0)
    failed_rows = models.PositiveIntegerField(default=0)
    uploaded_by = models.ForeignKey(
        settings.AUTH_USER_MODEL, on_delete=models.SET_NULL, null=True, blank=True,
        related_name="uploaded_import_batches"
    )
    confirmed_by = models.ForeignKey(
        settings.AUTH_USER_MODEL, on_delete=models.SET_NULL, null=True, blank=True,
        related_name="confirmed_import_batches"
    )
    uploaded_at = models.DateTimeField(auto_now_add=True)
    confirmed_at = models.DateTimeField(null=True, blank=True)
    rolled_back_at = models.DateTimeField(null=True, blank=True)

    class Meta:
        ordering = ["-uploaded_at"]

    def save(self, *args, **kwargs):
        if not self.batch_number:
            from django.utils import timezone
            prefix = timezone.localdate().strftime("IMP-%Y%m%d")
            last = ImportBatch.objects.filter(batch_number__startswith=prefix).order_by("-id").first()
            number = (last.id + 1) if last else 1
            self.batch_number = f"{prefix}-{number:05d}"
        super().save(*args, **kwargs)

    def __str__(self):
        return f"{self.batch_number} - {self.get_import_type_display()}"


class ImportedObject(models.Model):
    batch = models.ForeignKey(ImportBatch, on_delete=models.CASCADE, related_name="created_objects")
    app_label = models.CharField(max_length=100)
    model_name = models.CharField(max_length=100)
    object_id = models.CharField(max_length=100)
    object_repr = models.CharField(max_length=255, blank=True)
    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        ordering = ["-id"]
