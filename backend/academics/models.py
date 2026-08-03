from django.db import models
from students.models import Student
from staff.models import StaffMember
class AcademicYear(models.Model):
    name=models.CharField(max_length=20,unique=True); start_date=models.DateField(); end_date=models.DateField(); active=models.BooleanField(default=False)
    def __str__(self): return self.name
class Term(models.Model):
    academic_year=models.ForeignKey(AcademicYear,on_delete=models.CASCADE,related_name='terms'); name=models.CharField(max_length=40); start_date=models.DateField(); end_date=models.DateField(); active=models.BooleanField(default=False)
    def __str__(self): return f'{self.academic_year} - {self.name}'
class GradeLevel(models.Model):
    class GradingSystem(models.TextChoices):
        NUMERIC = "NUMERIC", "Numeric Grading"
        LETTER = "LETTER", "Letter Grading (A–F)"

    name = models.CharField(
        max_length=30,
        unique=True,
    )

    order = models.PositiveIntegerField(
        default=1,
    )

    grading_system = models.CharField(
        max_length=20,
        choices=GradingSystem.choices,
        default=GradingSystem.NUMERIC,
        help_text=(
            "Use Letter Grading for ECD/K-1 and "
            "Numeric Grading for other grade levels."
        ),
    )

    active = models.BooleanField(default=True)

    def __str__(self):
        return self.name
class ClassSection(models.Model):
    grade=models.ForeignKey(GradeLevel,on_delete=models.CASCADE); name=models.CharField(max_length=30); class_teacher=models.ForeignKey(StaffMember,on_delete=models.SET_NULL,null=True,blank=True); capacity=models.PositiveIntegerField(default=40)
    class Meta: unique_together=('grade','name')
    def __str__(self): return f'{self.grade} {self.name}'
class Subject(models.Model):
    code=models.CharField(max_length=20,unique=True); name=models.CharField(max_length=100); description=models.TextField(blank=True)
    def __str__(self): return self.name
class Enrollment(models.Model):
    student = models.ForeignKey(
        Student,
        on_delete=models.CASCADE,
        related_name="enrollments",
    )

    class_section = models.ForeignKey(
        ClassSection,
        on_delete=models.CASCADE,
        related_name="enrollments",
    )

    academic_year = models.ForeignKey(
        AcademicYear,
        on_delete=models.CASCADE,
    )

    roll_number = models.PositiveIntegerField(
        blank=True,
        null=True,
    )

    active = models.BooleanField(default=True)

    created_at = models.DateTimeField(
        auto_now_add=True, null=True, blank=True
    )
    updated_at = models.DateTimeField(
        auto_now=True, null=True, blank=True
    )
class AdmissionType(models.TextChoices):
    NEW = "NEW", "New Student"
    RETURNING = "RETURNING", "Returning Student"


admission_type = models.CharField(
    max_length=20,
    choices=AdmissionType.choices,
    default=AdmissionType.RETURNING,
    )   
class Meta:
        unique_together = ("student", "academic_year")
        ordering = ["class_section", "roll_number"]

        def __str__(self):
         return (
            f"{self.student.full_name} - "
            f"{self.class_section} "
            f"({self.academic_year})"
        )
class SubjectAssignment(models.Model):
    subject=models.ForeignKey(Subject,on_delete=models.CASCADE); class_section=models.ForeignKey(ClassSection,on_delete=models.CASCADE); teacher=models.ForeignKey(StaffMember,on_delete=models.SET_NULL,null=True,blank=True); academic_year=models.ForeignKey(AcademicYear,on_delete=models.CASCADE)
    class Meta: unique_together=('subject','class_section','academic_year')
class TimetableEntry(models.Model):
    DAYS=[(i,n) for i,n in enumerate(['Monday','Tuesday','Wednesday','Thursday','Friday'],1)]
    class_section=models.ForeignKey(ClassSection,on_delete=models.CASCADE); subject=models.ForeignKey(Subject,on_delete=models.CASCADE); teacher=models.ForeignKey(StaffMember,on_delete=models.SET_NULL,null=True); day=models.PositiveSmallIntegerField(choices=DAYS); start_time=models.TimeField(); end_time=models.TimeField(); room=models.CharField(max_length=50,blank=True)

from django.conf import settings


class StudentPromotion(models.Model):
    class Decision(models.TextChoices):
        PROMOTED = "PROMOTED", "Promoted"
        REPEATED = "REPEATED", "Repeated"
        GRADUATED = "GRADUATED", "Graduated"
        WITHDRAWN = "WITHDRAWN", "Withdrawn"

    student = models.ForeignKey(
        Student,
        on_delete=models.PROTECT,
        related_name="promotion_records",
    )

    source_enrollment = models.ForeignKey(
        Enrollment,
        on_delete=models.PROTECT,
        related_name="promotion_records",
    )

    source_academic_year = models.ForeignKey(
        AcademicYear,
        on_delete=models.PROTECT,
        related_name="source_promotions",
    )

    source_class = models.ForeignKey(
        ClassSection,
        on_delete=models.PROTECT,
        related_name="source_promotions",
    )

    target_academic_year = models.ForeignKey(
        AcademicYear,
        on_delete=models.PROTECT,
        related_name="target_promotions",
    )

    target_class = models.ForeignKey(
        ClassSection,
        on_delete=models.PROTECT,
        related_name="target_promotions",
        null=True,
        blank=True,
    )

    target_enrollment = models.ForeignKey(
        Enrollment,
        on_delete=models.SET_NULL,
        related_name="created_from_promotion",
        null=True,
        blank=True,
    )

    decision = models.CharField(
        max_length=20,
        choices=Decision.choices,
        default=Decision.PROMOTED,
    )

    yearly_average = models.DecimalField(
        max_digits=6,
        decimal_places=2,
        null=True,
        blank=True,
    )

    remarks = models.CharField(
        max_length=255,
        blank=True,
    )

    promoted_by = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.SET_NULL,
        null=True,
        blank=True,
        related_name="processed_promotions",
    )

    processed_at = models.DateTimeField(
        auto_now_add=True,
    )

    class Meta:
        ordering = ["-processed_at"]

        constraints = [
            models.UniqueConstraint(
                fields=[
                    "student",
                    "source_academic_year",
                    "target_academic_year",
                ],
                name="unique_student_year_promotion",
            )
        ]

    def __str__(self):
        return (
            f"{self.student.full_name} - "
            f"{self.source_academic_year} to "
            f"{self.target_academic_year} - "
            f"{self.get_decision_display()}"
        )