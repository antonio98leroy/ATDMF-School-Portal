from rest_framework import serializers

from .models import (
    EmployeeAttendance,
    StudentAttendance,
)


class StudentAttendanceSerializer(
    serializers.ModelSerializer
):
    student_name = serializers.CharField(
        source="student.full_name",
        read_only=True,
    )

    admission_number = serializers.CharField(
        source="student.admission_number",
        read_only=True,
    )

    class_name = serializers.CharField(
        source="class_section.__str__",
        read_only=True,
    )

    term_name = serializers.CharField(
        source="term.name",
        read_only=True,
    )

    academic_year_name = serializers.CharField(
        source="term.academic_year.name",
        read_only=True,
    )

    status_display = serializers.CharField(
        source="get_status_display",
        read_only=True,
    )

    recorded_by_name = serializers.SerializerMethodField()

    corrected_by_name = serializers.SerializerMethodField()

    class Meta:
        model = StudentAttendance
        fields = "__all__"

        read_only_fields = [
            "recorded_by",
            "corrected",
            "corrected_by",
            "corrected_at",
        ]

    def get_recorded_by_name(self, obj):
        if not obj.recorded_by:
            return ""

        return (
            obj.recorded_by.get_full_name()
            or obj.recorded_by.username
        )

    def get_corrected_by_name(self, obj):
        if not obj.corrected_by:
            return ""

        return (
            obj.corrected_by.get_full_name()
            or obj.corrected_by.username
        )


class EmployeeAttendanceSerializer(
    serializers.ModelSerializer
):
    employee_name = serializers.CharField(
        source="employee.full_name",
        read_only=True,
    )

    employee_number = serializers.CharField(
        source="employee.employee_id",
        read_only=True,
    )

    department_name = serializers.CharField(
        source="employee.department.name",
        read_only=True,
    )

    position_name = serializers.CharField(
        source="employee.position.name",
        read_only=True,
    )

    status_display = serializers.CharField(
        source="get_status_display",
        read_only=True,
    )

    recorded_by_name = serializers.SerializerMethodField()

    corrected_by_name = serializers.SerializerMethodField()

    class Meta:
        model = EmployeeAttendance
        fields = "__all__"

        read_only_fields = [
            "recorded_by",
            "corrected",
            "corrected_by",
            "corrected_at",
        ]

    def get_recorded_by_name(self, obj):
        if not obj.recorded_by:
            return ""

        return (
            obj.recorded_by.get_full_name()
            or obj.recorded_by.username
        )

    def get_corrected_by_name(self, obj):
        if not obj.corrected_by:
            return ""

        return (
            obj.corrected_by.get_full_name()
            or obj.corrected_by.username
        )
