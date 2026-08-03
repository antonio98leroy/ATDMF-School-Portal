from django.contrib import admin

from .models import TeacherAssignment


@admin.register(TeacherAssignment)
class TeacherAssignmentAdmin(admin.ModelAdmin):
    list_display = (
        "teacher",
        "academic_year",
        "term",
        "class_section",
        "subject",
        "weekly_periods",
        "is_class_teacher",
        "active",
    )

    list_filter = (
        "academic_year",
        "term",
        "class_section__grade",
        "class_section",
        "subject",
        "is_class_teacher",
        "active",
    )

    search_fields = (
        "teacher__employee_id",
        "teacher__first_name",
        "teacher__middle_name",
        "teacher__last_name",
        "subject__name",
        "class_section__name",
    )

    readonly_fields = (
        "created_at",
        "updated_at",
    )

    ordering = (
        "academic_year",
        "term",
        "class_section",
        "subject",
    )
