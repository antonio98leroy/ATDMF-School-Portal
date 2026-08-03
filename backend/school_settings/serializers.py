from rest_framework import serializers
from .models import SchoolSettings


class SchoolSettingsSerializer(serializers.ModelSerializer):
    active_academic_year_name = serializers.CharField(
        source="active_academic_year.name",
        read_only=True,
    )
    active_term_name = serializers.CharField(
        source="active_term.name",
        read_only=True,
    )
    updated_by_name = serializers.SerializerMethodField()

    class Meta:
        model = SchoolSettings
        fields = "__all__"
        read_only_fields = [
            "id",
            "updated_by",
            "created_at",
            "updated_at",
        ]

    def get_updated_by_name(self, obj):
        if not obj.updated_by:
            return ""
        return obj.updated_by.get_full_name() or obj.updated_by.username
