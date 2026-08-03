from django.contrib import admin

from .models import (
    EmployeeAttendance,
    StudentAttendance,
)


@admin.register(StudentAttendance)
class StudentAttendanceAdmin(
    admin.ModelAdmin
):
    list_display = (
        "student",
        "class_section",
        "term",
        "date",
        "status",
        "time_in",
        "recorded_by",
        "corrected",
    )

    list_filter = (
        "status",
        "date",
        "term",
        "class_section",
        "corrected",
    )

    search_fields = (
        "student__admission_number",
        "student__first_name",
        "student__middle_name",
        "student__last_name",
        "remarks",
    )

    readonly_fields = (
        "recorded_by",
        "corrected",
        "corrected_by",
        "corrected_at",
        "created_at",
        "updated_at",
    )


@admin.register(EmployeeAttendance)
class EmployeeAttendanceAdmin(
    admin.ModelAdmin
):
    list_display = (
        "employee",
        "date",
        "status",
        "time_in",
        "time_out",
        "recorded_by",
        "corrected",
    )

    list_filter = (
        "status",
        "date",
        "employee__department",
        "corrected",
    )

    search_fields = (
        "employee__employee_id",
        "employee__first_name",
        "employee__middle_name",
        "employee__last_name",
        "remarks",
    )

    readonly_fields = (
        "recorded_by",
        "corrected",
        "corrected_by",
        "corrected_at",
        "created_at",
        "updated_at",
    )
