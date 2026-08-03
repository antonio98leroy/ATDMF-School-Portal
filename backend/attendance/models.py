from django.conf import settings
from django.core.exceptions import ValidationError
from django.db import models
from django.utils import timezone

from academics.models import ClassSection, Term
from employees.models import Employee
from students.models import Student


class StudentAttendance(models.Model):
    class Status(models.TextChoices):
        PRESENT = "P", "Present"
        ABSENT = "A", "Absent"
        LATE = "L", "Late"
        EXCUSED = "E", "Excused"
        SICK = "S", "Sick"

    student = models.ForeignKey(
        Student,
        on_delete=models.CASCADE,
        related_name="attendance_records",
    )

    class_section = models.ForeignKey(
        ClassSection,
        on_delete=models.PROTECT,
        related_name="student_attendance_records",
    )

    term = models.ForeignKey(
        Term,
        on_delete=models.PROTECT,
        related_name="student_attendance_records",
    )

    date = models.DateField(
        default=timezone.localdate,
    )

    status = models.CharField(
        max_length=1,
        choices=Status.choices,
        default=Status.PRESENT,
    )

    time_in = models.TimeField(
        null=True,
        blank=True,
    )

    remarks = models.CharField(
        max_length=255,
        blank=True,
    )

    recorded_by = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.SET_NULL,
        null=True,
        blank=True,
        related_name="recorded_student_attendance",
    )

    corrected = models.BooleanField(
        default=False,
    )

    correction_reason = models.TextField(
        blank=True,
    )

    corrected_by = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.SET_NULL,
        null=True,
        blank=True,
        related_name="corrected_student_attendance",
    )

    corrected_at = models.DateTimeField(
        null=True,
        blank=True,
    )

    created_at = models.DateTimeField(
        auto_now_add=True,
    )

    updated_at = models.DateTimeField(
        auto_now=True,
    )

    class Meta:
        ordering = [
            "-date",
            "student__last_name",
            "student__first_name",
        ]

        constraints = [
            models.UniqueConstraint(
                fields=[
                    "student",
                    "date",
                ],
                name="unique_student_attendance_date",
            )
        ]

        indexes = [
            models.Index(
                fields=["date"],
            ),
            models.Index(
                fields=["status"],
            ),
            models.Index(
                fields=[
                    "class_section",
                    "date",
                ],
            ),
            models.Index(
                fields=[
                    "term",
                    "date",
                ],
            ),
        ]

    def clean(self):
        errors = {}

        if (
            self.term_id
            and self.class_section_id
            and self.term.academic_year_id
            != self.class_section.academic_year_id
        ):
            errors["term"] = (
                "The selected term and class must belong "
                "to the same academic year."
            )

        if errors:
            raise ValidationError(errors)

    def save(self, *args, **kwargs):
        self.full_clean()
        super().save(*args, **kwargs)

    def __str__(self):
        return (
            f"{self.student.full_name} - "
            f"{self.date} - "
            f"{self.get_status_display()}"
        )


class EmployeeAttendance(models.Model):
    class Status(models.TextChoices):
        PRESENT = "P", "Present"
        ABSENT = "A", "Absent"
        LATE = "L", "Late"
        EXCUSED = "E", "Excused"
        SICK = "S", "Sick"
        LEAVE = "LV", "On Leave"

    employee = models.ForeignKey(
        Employee,
        on_delete=models.CASCADE,
        related_name="attendance_records",
    )

    date = models.DateField(
        default=timezone.localdate,
    )

    status = models.CharField(
        max_length=2,
        choices=Status.choices,
        default=Status.PRESENT,
    )

    time_in = models.TimeField(
        null=True,
        blank=True,
    )

    time_out = models.TimeField(
        null=True,
        blank=True,
    )

    remarks = models.CharField(
        max_length=255,
        blank=True,
    )

    recorded_by = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.SET_NULL,
        null=True,
        blank=True,
        related_name="recorded_employee_attendance",
    )

    corrected = models.BooleanField(
        default=False,
    )

    correction_reason = models.TextField(
        blank=True,
    )

    corrected_by = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.SET_NULL,
        null=True,
        blank=True,
        related_name="corrected_employee_attendance",
    )

    corrected_at = models.DateTimeField(
        null=True,
        blank=True,
    )

    created_at = models.DateTimeField(
        auto_now_add=True,
    )

    updated_at = models.DateTimeField(
        auto_now=True,
    )

    class Meta:
        ordering = [
            "-date",
            "employee__last_name",
            "employee__first_name",
        ]

        constraints = [
            models.UniqueConstraint(
                fields=[
                    "employee",
                    "date",
                ],
                name="unique_employee_attendance_date",
            )
        ]

        indexes = [
            models.Index(
                fields=["date"],
            ),
            models.Index(
                fields=["status"],
            ),
        ]

    def __str__(self):
        return (
            f"{self.employee} - "
            f"{self.date} - "
            f"{self.get_status_display()}"
        )
