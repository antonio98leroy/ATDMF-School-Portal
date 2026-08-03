from django.core.exceptions import ValidationError
from django.db import models

from academics.models import (
    AcademicYear,
    ClassSection,
    Subject,
    Term,
)
from employees.models import Employee


class TeacherAssignment(models.Model):
    teacher = models.ForeignKey(
        Employee,
        on_delete=models.PROTECT,
        related_name="teaching_assignments",
        limit_choices_to={
            "is_teacher": True,
            "active": True,
        },
    )

    academic_year = models.ForeignKey(
        AcademicYear,
        on_delete=models.PROTECT,
        related_name="teacher_assignments",
    )

    term = models.ForeignKey(
        Term,
        on_delete=models.PROTECT,
        related_name="teacher_assignments",
    )

    class_section = models.ForeignKey(
        ClassSection,
        on_delete=models.PROTECT,
        related_name="teacher_assignments",
    )

    subject = models.ForeignKey(
        Subject,
        on_delete=models.PROTECT,
        related_name="teacher_assignments",
    )

    weekly_periods = models.PositiveSmallIntegerField(
        default=3,
        help_text="Number of periods taught each week.",
    )

    is_class_teacher = models.BooleanField(
        default=False,
        help_text="Select when this employee is the class teacher.",
    )

    active = models.BooleanField(default=True)

    notes = models.TextField(blank=True)

    created_at = models.DateTimeField(auto_now_add=True)

    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        ordering = [
            "academic_year__name",
            "term__name",
            "class_section__grade__order",
            "class_section__name",
            "subject__name",
        ]

        constraints = [
            models.UniqueConstraint(
                fields=[
                    "academic_year",
                    "term",
                    "class_section",
                    "subject",
                ],
                name="unique_subject_teacher_per_class_term",
            )
        ]

        indexes = [
            models.Index(
                fields=[
                    "academic_year",
                    "term",
                ]
            ),
            models.Index(
                fields=[
                    "teacher",
                    "active",
                ]
            ),
            models.Index(
                fields=[
                    "class_section",
                    "active",
                ]
            ),
        ]

    def clean(self):
        errors = {}

        if self.teacher_id:
            if not self.teacher.is_teacher:
                errors["teacher"] = (
                    "The selected employee is not marked as a teacher."
                )

            if not self.teacher.active:
                errors["teacher"] = (
                    "The selected teacher is inactive."
                )

        if (
            self.term_id
            and self.academic_year_id
            and self.term.academic_year_id
            != self.academic_year_id
        ):
            errors["term"] = (
                "The selected term does not belong to the "
                "selected academic year."
            )

        if self.weekly_periods < 1:
            errors["weekly_periods"] = (
                "Weekly periods must be at least 1."
            )

        if self.weekly_periods > 20:
            errors["weekly_periods"] = (
                "Weekly periods cannot exceed 20."
            )

        if errors:
            raise ValidationError(errors)

    def save(self, *args, **kwargs):
        self.full_clean()
        super().save(*args, **kwargs)

    def __str__(self):
        return (
            f"{self.teacher.full_name} — "
            f"{self.subject.name} — "
            f"{self.class_section}"
        )