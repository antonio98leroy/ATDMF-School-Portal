from django.utils import timezone
from rest_framework import parsers, permissions, status, viewsets
from rest_framework.decorators import action
from rest_framework.response import Response

from accounts.permissions import HasAllowedRole
from .models import ImportBatch
from .serializers import ImportBatchSerializer
from .services import (
    import_employee_records,
    import_records,
    preview_employee_workbook,
    preview_workbook,
    rollback_batch,
)


class ImportBatchViewSet(viewsets.ReadOnlyModelViewSet):
    queryset = ImportBatch.objects.select_related("academic_year", "uploaded_by", "confirmed_by").all()
    serializer_class = ImportBatchSerializer
    permission_classes = [permissions.IsAuthenticated, HasAllowedRole]
    allowed_roles = ["OWNER", "SUPER_ADMIN", "DEVELOPER", "IT_ADMIN", "REGISTRAR"]
    parser_classes = [parsers.JSONParser, parsers.MultiPartParser, parsers.FormParser]

    @action(detail=False, methods=["post"], url_path="preview")
    def preview(self, request):
        upload = request.FILES.get("file")
        academic_year_id = request.data.get("academic_year")
        import_type = request.data.get(
            "import_type",
            ImportBatch.ImportType.SPONSORSHIP,
        )
        if not upload:
            return Response({"detail": "File is required."}, status=400)
        if (
            import_type == ImportBatch.ImportType.SPONSORSHIP
            and not academic_year_id
        ):
            return Response(
                {"detail": "Academic year is required for student and sponsorship imports."},
                status=400,
            )
        if not upload.name.lower().endswith(".xlsx"):
            return Response({"detail": "Only .xlsx files are supported in this phase."}, status=400)
        batch = ImportBatch.objects.create(
            import_type=import_type,
            source_file=upload,
            original_filename=upload.name,
            academic_year_id=academic_year_id or None,
            uploaded_by=request.user,
        )
        try:
            records = (
                preview_employee_workbook(batch.source_file.path)
                if import_type == ImportBatch.ImportType.EMPLOYEE
                else preview_workbook(batch.source_file.path)
            )
        except Exception as exc:
            batch.status = ImportBatch.Status.FAILED
            batch.summary = {"error": str(exc)}
            batch.save(update_fields=["status", "summary"])
            return Response({"detail": str(exc)}, status=400)
        valid = sum(1 for row in records if row["valid"])
        invalid = len(records) - valid
        batch.preview_data = records
        batch.total_rows = len(records)
        batch.summary = {"valid_rows": valid, "invalid_rows": invalid}
        batch.save(update_fields=["preview_data", "total_rows", "summary"])
        return Response(ImportBatchSerializer(batch, context={"request": request}).data)

    @action(detail=True, methods=["post"], url_path="confirm")
    def confirm(self, request, pk=None):
        batch = self.get_object()
        if batch.status != ImportBatch.Status.PREVIEWED:
            return Response({"detail": "Only previewed batches can be confirmed."}, status=400)
        if batch.import_type == ImportBatch.ImportType.EMPLOYEE:
            summary, successful, failed = import_employee_records(batch, request.user)
        else:
            summary, successful, failed = import_records(batch, request.user)
        batch.successful_rows = successful
        batch.failed_rows = failed
        batch.summary = summary
        batch.confirmed_by = request.user
        batch.confirmed_at = timezone.now()
        batch.status = ImportBatch.Status.COMPLETED if failed == 0 else ImportBatch.Status.PARTIAL
        batch.save()
        return Response(ImportBatchSerializer(batch, context={"request": request}).data)

    @action(detail=True, methods=["post"], url_path="rollback")
    def rollback(self, request, pk=None):
        batch = self.get_object()
        if batch.status not in {ImportBatch.Status.COMPLETED, ImportBatch.Status.PARTIAL}:
            return Response({"detail": "This batch cannot be rolled back."}, status=400)
        deleted, errors = rollback_batch(batch)
        return Response({"detail": "Rollback completed.", "deleted": deleted, "errors": errors})
