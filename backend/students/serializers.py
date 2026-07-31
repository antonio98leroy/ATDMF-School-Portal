from rest_framework import serializers

from .models import Guardian, Student


class GuardianSerializer(serializers.ModelSerializer):
    class Meta:
        model = Guardian
        fields = [
            "id",
            "name",
            "relationship",
            "phone",
            "email",
            "address",
        ]


class StudentSerializer(serializers.ModelSerializer):
    full_name = serializers.CharField(read_only=True)
    guardian_detail = GuardianSerializer(
        source="guardian",
        read_only=True,
    )

    gender_display = serializers.CharField(
        source="get_gender_display",
        read_only=True,
    )

    class Meta:
        model = Student
        fields = [
            "id",
            "admission_number",
            "user",
            "first_name",
            "middle_name",
            "last_name",
            "full_name",
            "gender",
            "gender_display",
            "date_of_birth",
            "phone",
            "email",
            "address",
            "photo",
            "guardian",
            "guardian_detail",
            "admission_date",
            "previous_school",
            "is_active",
            "created_at",
        ]

        read_only_fields = [
            "admission_number",
            "created_at",
        ]

    def validate_date_of_birth(self, value):
        from datetime import date

        if value >= date.today():
            raise serializers.ValidationError(
                "Date of birth must be earlier than today."
            )

        return value
