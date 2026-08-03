from rest_framework import serializers
from .models import AcademicImportBatch


class AcademicImportBatchSerializer(serializers.ModelSerializer):
    academic_year_name = serializers.CharField(
        source="academic_year.name",
        read_only=True,
    )
    class_section_name = serializers.CharField(
        source="class_section.__str__",
        read_only=True,
    )
    uploaded_by_name = serializers.SerializerMethodField()

    class Meta:
        model = AcademicImportBatch
        fields = "__all__"
        read_only_fields = [
            "status",
            "preview_data",
            "created_result_ids",
            "total_rows",
            "valid_rows",
            "error_rows",
            "imported_rows",
            "uploaded_by",
            "uploaded_at",
            "imported_at",
            "rolled_back_at",
        ]

    def get_uploaded_by_name(self, obj):
        if not obj.uploaded_by:
            return ""
        return obj.uploaded_by.get_full_name() or obj.uploaded_by.username
