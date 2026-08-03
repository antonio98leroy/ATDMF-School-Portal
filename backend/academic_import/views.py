from rest_framework import parsers, permissions, status, viewsets
from rest_framework.decorators import action
from rest_framework.response import Response

from accounts.permissions import HasAllowedRole
from academics.models import AcademicYear, ClassSection

from .models import AcademicImportBatch
from .serializers import AcademicImportBatchSerializer
from .services import (
    import_preview_rows,
    parse_academic_workbook,
    rollback_import,
)


class AcademicImportBatchViewSet(viewsets.ReadOnlyModelViewSet):
    queryset = AcademicImportBatch.objects.select_related(
        "academic_year",
        "class_section",
        "uploaded_by",
    ).all()
    serializer_class = AcademicImportBatchSerializer
    permission_classes = [
        permissions.IsAuthenticated,
        HasAllowedRole,
    ]
    allowed_roles = [
        "OWNER",
        "SUPER_ADMIN",
        "DEVELOPER",
        "IT_ADMIN",
        "REGISTRAR",
        "PRINCIPAL",
    ]
    parser_classes = [
        parsers.MultiPartParser,
        parsers.FormParser,
        parsers.JSONParser,
    ]

    @action(detail=False, methods=["post"], url_path="preview")
    def preview(self, request):
        upload = request.FILES.get("file")
        academic_year_id = request.data.get("academic_year")
        class_section_id = request.data.get("class_section")

        if not upload:
            return Response(
                {"file": "An Excel workbook is required."},
                status=status.HTTP_400_BAD_REQUEST,
            )

        if not academic_year_id or not class_section_id:
            return Response(
                {"detail": "Academic year and class section are required."},
                status=status.HTTP_400_BAD_REQUEST,
            )

        academic_year = AcademicYear.objects.get(pk=academic_year_id)
        class_section = ClassSection.objects.get(pk=class_section_id)

        try:
            rows = parse_academic_workbook(
                upload,
                academic_year,
                class_section,
            )
        except Exception as exc:
            return Response(
                {"detail": str(exc)},
                status=status.HTTP_400_BAD_REQUEST,
            )

        batch = AcademicImportBatch.objects.create(
            original_filename=upload.name,
            academic_year=academic_year,
            class_section=class_section,
            preview_data=rows,
            total_rows=len(rows),
            valid_rows=sum(1 for row in rows if row["valid"]),
            error_rows=sum(1 for row in rows if not row["valid"]),
            uploaded_by=request.user,
        )

        return Response(
            self.get_serializer(batch).data,
            status=status.HTTP_201_CREATED,
        )

    @action(detail=True, methods=["post"], url_path="confirm")
    def confirm(self, request, pk=None):
        batch = self.get_object()

        if batch.status != batch.Status.PREVIEWED:
            return Response(
                {"detail": "Only a previewed batch can be imported."},
                status=status.HTTP_400_BAD_REQUEST,
            )

        count = import_preview_rows(batch, request.user)
        return Response(
            {
                "detail": "Academic results imported successfully.",
                "imported_rows": count,
                "batch": self.get_serializer(batch).data,
            }
        )

    @action(detail=True, methods=["post"], url_path="rollback")
    def rollback(self, request, pk=None):
        batch = self.get_object()

        if batch.status != batch.Status.IMPORTED:
            return Response(
                {"detail": "Only an imported batch can be rolled back."},
                status=status.HTTP_400_BAD_REQUEST,
            )

        deleted = rollback_import(batch)
        return Response(
            {
                "detail": "Academic import rolled back successfully.",
                "deleted_results": deleted,
            }
        )
