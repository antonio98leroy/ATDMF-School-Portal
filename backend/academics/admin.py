from django.contrib import admin
from .models import *
admin.site.register([AcademicYear,Term,GradeLevel,ClassSection,Subject,Enrollment,SubjectAssignment,TimetableEntry])
from .models import StudentPromotion


@admin.register(StudentPromotion)
class StudentPromotionAdmin(
    admin.ModelAdmin
):
    list_display = (
        "student",
        "source_academic_year",
        "source_class",
        "target_academic_year",
        "target_class",
        "decision",
        "yearly_average",
        "processed_at",
    )

    list_filter = (
        "decision",
        "source_academic_year",
        "target_academic_year",
        "source_class",
        "target_class",
    )

    search_fields = (
        "student__admission_number",
        "student__first_name",
        "student__middle_name",
        "student__last_name",
    )

    readonly_fields = (
        "processed_at",
    )