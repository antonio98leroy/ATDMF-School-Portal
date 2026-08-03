from django.contrib import admin

from .models import (
    Assessment,
    CBTOption,
    CBTQuestion,
    GradeScale,
    ResultPeriod,
    Score,
    SubjectResult,
)


@admin.register(ResultPeriod)
class ResultPeriodAdmin(admin.ModelAdmin):
    list_display = (
        "academic_year",
        "name",
        "order",
        "score_entry_open",
        "published",
        "active",
    )

    list_filter = (
        "academic_year",
        "score_entry_open",
        "published",
        "active",
    )

    ordering = (
        "academic_year",
        "order",
    )


@admin.register(SubjectResult)
class SubjectResultAdmin(admin.ModelAdmin):
    list_display = (
        "student_name",
        "class_name",
        "subject",
        "period",
        "total_score_display",
        "approved",
        "published",
    )

    list_filter = (
        "period__academic_year",
        "period",
        "enrollment__class_section",
        "subject",
        "approved",
        "published",
    )

    search_fields = (
        "enrollment__student__admission_number",
        "enrollment__student__first_name",
        "enrollment__student__middle_name",
        "enrollment__student__last_name",
        "subject__name",
    )

    readonly_fields = (
        "created_at",
        "updated_at",
    )

    def student_name(self, obj):
        return obj.enrollment.student.full_name

    def class_name(self, obj):
        return str(obj.enrollment.class_section)

    def total_score_display(self, obj):
        return obj.total_score


@admin.register(GradeScale)
class GradeScaleAdmin(admin.ModelAdmin):
    list_display = (
        "grading_system",
        "grade",
        "min_score",
        "max_score",
        "remark",
        "active",
    )

    list_filter = (
        "grading_system",
        "active",
    )

    ordering = (
        "grading_system",
        "-min_score",
    )


admin.site.register(Assessment)
admin.site.register(Score)
admin.site.register(CBTQuestion)
admin.site.register(CBTOption)