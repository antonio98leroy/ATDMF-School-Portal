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

class SchoolPeriod(models.Model):
    """
    Defines the school's daily teaching periods.
    Example:
        Period 1: 08:00 - 08:45
        Period 2: 08:45 - 09:30
    """

    name = models.CharField(
        max_length=100,
        help_text="Example: Period 1, Period 2, Lunch Break",
    )

    period_number = models.PositiveSmallIntegerField(
        unique=True,
    )

    start_time = models.TimeField()

    end_time = models.TimeField()

    is_teaching_period = models.BooleanField(
        default=True,
        help_text=(
            "Disable for lunch, devotion, assembly "
            "or other non-teaching periods."
        ),
    )

    active = models.BooleanField(default=True)

    class Meta:
        ordering = [
            "period_number",
        ]

    def clean(self):
        errors = {}

        if (
            self.start_time
            and self.end_time
            and self.start_time >= self.end_time
        ):
            errors["end_time"] = (
                "End time must be later than start time."
            )

        if errors:
            raise ValidationError(errors)

    def save(self, *args, **kwargs):
        self.full_clean()
        super().save(*args, **kwargs)

    def __str__(self):
        return (
            f"{self.name} "
            f"({self.start_time:%H:%M} - "
            f"{self.end_time:%H:%M})"
        )


class TimetableEntry(models.Model):
    class Day(models.TextChoices):
        MONDAY = "MON", "Monday"
        TUESDAY = "TUE", "Tuesday"
        WEDNESDAY = "WED", "Wednesday"
        THURSDAY = "THU", "Thursday"
        FRIDAY = "FRI", "Friday"

    teacher_assignment = models.ForeignKey(
        TeacherAssignment,
        on_delete=models.CASCADE,
        related_name="timetable_entries",
    )

    day = models.CharField(
        max_length=3,
        choices=Day.choices,
    )

    period = models.ForeignKey(
        SchoolPeriod,
        on_delete=models.PROTECT,
        related_name="timetable_entries",
    )

    room = models.CharField(
        max_length=100,
        blank=True,
        help_text=(
            "Optional classroom, laboratory or room."
        ),
    )

    active = models.BooleanField(default=True)

    notes = models.CharField(
        max_length=255,
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
            "day",
            "period__period_number",
        ]

        constraints = [
            models.UniqueConstraint(
                fields=[
                    "teacher_assignment",
                    "day",
                    "period",
                ],
                name=(
                    "unique_assignment_day_period"
                ),
            ),
        ]

        indexes = [
            models.Index(
                fields=[
                    "day",
                    "active",
                ],
            ),
        ]

    def clean(self):
        errors = {}

        assignment = self.teacher_assignment

        if (
            self.period_id
            and not self.period.active
        ):
            errors["period"] = (
                "The selected school period is inactive."
            )

        if (
            self.period_id
            and not self.period.is_teaching_period
        ):
            errors["period"] = (
                "A class cannot be scheduled during "
                "a non-teaching period."
            )

        if assignment and not assignment.active:
            errors["teacher_assignment"] = (
                "The selected teacher assignment is inactive."
            )

        if (
            assignment
            and self.day
            and self.period_id
        ):
            conflicts = (
                TimetableEntry.objects
                .select_related(
                    "teacher_assignment",
                )
                .filter(
                    day=self.day,
                    period=self.period,
                    active=True,
                    teacher_assignment__academic_year=(
                        assignment.academic_year
                    ),
                    teacher_assignment__term=assignment.term,
                )
            )

            if self.pk:
                conflicts = conflicts.exclude(pk=self.pk)

            teacher_conflict = conflicts.filter(
                teacher_assignment__teacher=(
                    assignment.teacher
                )
            ).exists()

            if teacher_conflict:
                errors["teacher_assignment"] = (
                    "This teacher already has another "
                    "class during this period."
                )

            class_conflict = conflicts.filter(
                teacher_assignment__class_section=(
                    assignment.class_section
                )
            ).exists()

            if class_conflict:
                errors["period"] = (
                    "This class already has another "
                    "subject during this period."
                )

            if self.room:
                room_conflict = conflicts.filter(
                    room__iexact=self.room.strip()
                ).exists()

                if room_conflict:
                    errors["room"] = (
                        "This room is already being used "
                        "during this period."
                    )

        if errors:
            raise ValidationError(errors)

    def save(self, *args, **kwargs):
        if self.room:
            self.room = self.room.strip()

        self.full_clean()
        super().save(*args, **kwargs)

    @property
    def teacher(self):
        return self.teacher_assignment.teacher

    @property
    def class_section(self):
        return self.teacher_assignment.class_section

    @property
    def subject(self):
        return self.teacher_assignment.subject

    @property
    def academic_year(self):
        return self.teacher_assignment.academic_year

    @property
    def term(self):
        return self.teacher_assignment.term

    def __str__(self):
        assignment = self.teacher_assignment

        return (
            f"{self.get_day_display()} - "
            f"{self.period.name} - "
            f"{assignment.class_section} - "
            f"{assignment.subject.name} - "
            f"{assignment.teacher.full_name}"
        )
