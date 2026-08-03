from decimal import Decimal

from django.conf import settings
from django.core.exceptions import ValidationError
from django.core.validators import (
    MaxValueValidator,
    MinValueValidator,
)
from django.db import models

from academics.models import (
    AcademicYear,
    ClassSection,
    Enrollment,
    Subject,
    Term,
)
from students.models import Student


class Assessment(models.Model):
    name = models.CharField(max_length=100)

    term = models.ForeignKey(
        Term,
        on_delete=models.CASCADE,
        related_name="assessments",
    )

    class_section = models.ForeignKey(
        ClassSection,
        on_delete=models.CASCADE,
        related_name="assessments",
    )

    subject = models.ForeignKey(
        Subject,
        on_delete=models.CASCADE,
        related_name="assessments",
    )

    max_score = models.DecimalField(
        max_digits=6,
        decimal_places=2,
        default=100,
    )

    date = models.DateField()

    is_cbt = models.BooleanField(default=False)

    active = models.BooleanField(default=True)

    created_at = models.DateTimeField(
        auto_now_add=True,
    )

    updated_at = models.DateTimeField(
        auto_now=True,
    )

    class Meta:
        ordering = ["-date", "name"]

    def __str__(self):
        return (
            f"{self.name} - "
            f"{self.class_section} - "
            f"{self.subject}"
        )


class Score(models.Model):
    assessment = models.ForeignKey(
        Assessment,
        on_delete=models.CASCADE,
        related_name="scores",
    )

    student = models.ForeignKey(
        Student,
        on_delete=models.CASCADE,
        related_name="assessment_scores",
    )

    score = models.DecimalField(
        max_digits=6,
        decimal_places=2,
        validators=[MinValueValidator(0)],
    )

    remarks = models.CharField(
        max_length=200,
        blank=True,
    )

    created_at = models.DateTimeField(
        auto_now_add=True,
    )

    updated_at = models.DateTimeField(
        auto_now=True,
    )

    class Meta:
        constraints = [
            models.UniqueConstraint(
                fields=["assessment", "student"],
                name="unique_assessment_student_score",
            )
        ]

    def clean(self):
        if (
            self.assessment_id
            and self.score is not None
            and self.score > self.assessment.max_score
        ):
            raise ValidationError(
                {
                    "score": (
                        "Score cannot exceed the "
                        "assessment maximum score."
                    )
                }
            )

    def save(self, *args, **kwargs):
        self.full_clean()
        super().save(*args, **kwargs)

    def __str__(self):
        return (
            f"{self.student} - "
            f"{self.assessment}: {self.score}"
        )


class GradeScale(models.Model):
    class GradingSystem(models.TextChoices):
        NUMERIC = "NUMERIC", "Numeric Grading"
        LETTER = "LETTER", "Letter Grading (A–F)"

    grading_system = models.CharField(
        max_length=20,
        choices=GradingSystem.choices,
        default=GradingSystem.NUMERIC,
    )

    min_score = models.DecimalField(
        max_digits=5,
        decimal_places=2,
        validators=[
            MinValueValidator(0),
            MaxValueValidator(100),
        ],
    )

    max_score = models.DecimalField(
        max_digits=5,
        decimal_places=2,
        validators=[
            MinValueValidator(0),
            MaxValueValidator(100),
        ],
    )

    grade = models.CharField(
        max_length=3,
    )

    remark = models.CharField(
        max_length=100,
    )

    points = models.DecimalField(
        max_digits=5,
        decimal_places=2,
        default=0,
    )

    active = models.BooleanField(default=True)

    class Meta:
        ordering = [
            "grading_system",
            "-min_score",
        ]

    def clean(self):
        if self.min_score > self.max_score:
            raise ValidationError(
                {
                    "min_score": (
                        "Minimum score cannot exceed "
                        "maximum score."
                    )
                }
            )

        overlapping = GradeScale.objects.filter(
            grading_system=self.grading_system,
            active=True,
            min_score__lte=self.max_score,
            max_score__gte=self.min_score,
        )

        if self.pk:
            overlapping = overlapping.exclude(
                pk=self.pk
            )

        if overlapping.exists():
            raise ValidationError(
                "This grade range overlaps an existing grade."
            )

    def save(self, *args, **kwargs):
        self.grade = self.grade.upper().strip()
        self.full_clean()
        super().save(*args, **kwargs)

    def __str__(self):
        return (
            f"{self.grade}: "
            f"{self.min_score}-{self.max_score}"
        )


class ResultPeriod(models.Model):
    class Code(models.TextChoices):
        FIRST_PERIOD = "FIRST_PERIOD", "1st Period"
        SECOND_PERIOD = "SECOND_PERIOD", "2nd Period"
        THIRD_PERIOD = "THIRD_PERIOD", "3rd Period"

        FIRST_SEMESTER_EXAM = (
            "FIRST_SEMESTER_EXAM",
            "1st Semester Exam",
        )

        FOURTH_PERIOD = "FOURTH_PERIOD", "4th Period"
        FIFTH_PERIOD = "FIFTH_PERIOD", "5th Period"
        SIXTH_PERIOD = "SIXTH_PERIOD", "6th Period"

        SECOND_SEMESTER_EXAM = (
            "SECOND_SEMESTER_EXAM",
            "2nd Semester Exam",
        )

    PERIOD_CODES = {
        Code.FIRST_PERIOD,
        Code.SECOND_PERIOD,
        Code.THIRD_PERIOD,
        Code.FOURTH_PERIOD,
        Code.FIFTH_PERIOD,
        Code.SIXTH_PERIOD,
    }

    EXAM_CODES = {
        Code.FIRST_SEMESTER_EXAM,
        Code.SECOND_SEMESTER_EXAM,
    }

    PERIOD_ORDER = {
        Code.FIRST_PERIOD: 1,
        Code.SECOND_PERIOD: 2,
        Code.THIRD_PERIOD: 3,
        Code.FIRST_SEMESTER_EXAM: 4,
        Code.FOURTH_PERIOD: 5,
        Code.FIFTH_PERIOD: 6,
        Code.SIXTH_PERIOD: 7,
        Code.SECOND_SEMESTER_EXAM: 8,
    }

    academic_year = models.ForeignKey(
        AcademicYear,
        on_delete=models.CASCADE,
        related_name="result_periods",
    )

    code = models.CharField(
        max_length=40,
        choices=Code.choices,
    )

    name = models.CharField(
        max_length=100,
        blank=True,
    )

    order = models.PositiveSmallIntegerField(
        default=1,
    )

    start_date = models.DateField(
        null=True,
        blank=True,
    )

    end_date = models.DateField(
        null=True,
        blank=True,
    )

    active = models.BooleanField(default=True)

    score_entry_open = models.BooleanField(
        default=True,
    )

    published = models.BooleanField(
        default=False,
    )

    created_at = models.DateTimeField(
        auto_now_add=True,
    )

    updated_at = models.DateTimeField(
        auto_now=True,
    )

    class Meta:
        ordering = [
            "academic_year__start_date",
            "order",
        ]

        constraints = [
            models.UniqueConstraint(
                fields=["academic_year", "code"],
                name="unique_result_period_per_year",
            )
        ]

    def save(self, *args, **kwargs):
        if not self.name:
            self.name = self.get_code_display()

        self.order = self.PERIOD_ORDER.get(
            self.code,
            self.order,
        )

        super().save(*args, **kwargs)

    @property
    def is_semester_exam(self):
        return self.code in self.EXAM_CODES

    @property
    def is_period(self):
        return self.code in self.PERIOD_CODES

    def __str__(self):
        return (
            f"{self.academic_year} - "
            f"{self.get_code_display()}"
        )


class SubjectResult(models.Model):
    enrollment = models.ForeignKey(
        Enrollment,
        on_delete=models.CASCADE,
        related_name="subject_results",
    )

    subject = models.ForeignKey(
        Subject,
        on_delete=models.PROTECT,
        related_name="student_results",
    )

    period = models.ForeignKey(
        ResultPeriod,
        on_delete=models.PROTECT,
        related_name="subject_results",
    )

    assignment_score = models.DecimalField(
        max_digits=5,
        decimal_places=2,
        default=0,
        validators=[
            MinValueValidator(0),
            MaxValueValidator(10),
        ],
    )

    class_activity_score = models.DecimalField(
        max_digits=5,
        decimal_places=2,
        default=0,
        validators=[
            MinValueValidator(0),
            MaxValueValidator(10),
        ],
        help_text=(
            "Attendance and participation score."
        ),
    )

    quiz_score = models.DecimalField(
        max_digits=5,
        decimal_places=2,
        default=0,
        validators=[
            MinValueValidator(0),
            MaxValueValidator(30),
        ],
    )

    period_test_score = models.DecimalField(
        max_digits=5,
        decimal_places=2,
        default=0,
        validators=[
            MinValueValidator(0),
            MaxValueValidator(50),
        ],
    )

    semester_exam_score = models.DecimalField(
        max_digits=5,
        decimal_places=2,
        default=0,
        validators=[
            MinValueValidator(0),
            MaxValueValidator(100),
        ],
    )

    remarks = models.CharField(
        max_length=255,
        blank=True,
    )

    entered_by = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.SET_NULL,
        null=True,
        blank=True,
        related_name="entered_subject_results",
    )

    approved_by = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.SET_NULL,
        null=True,
        blank=True,
        related_name="approved_subject_results",
    )

    approved = models.BooleanField(default=False)

    published = models.BooleanField(default=False)

    created_at = models.DateTimeField(
        auto_now_add=True,
    )

    updated_at = models.DateTimeField(
        auto_now=True,
    )

    class Meta:
        ordering = [
            "enrollment__student__last_name",
            "subject__name",
            "period__order",
        ]

        constraints = [
            models.UniqueConstraint(
                fields=[
                    "enrollment",
                    "subject",
                    "period",
                ],
                name="unique_student_subject_period_result",
            )
        ]

        indexes = [
            models.Index(
                fields=["period", "subject"]
            ),
            models.Index(
                fields=["approved", "published"]
            ),
        ]

    @property
    def student(self):
        return self.enrollment.student

    @property
    def period_total(self):
        return (
            self.assignment_score
            + self.class_activity_score
            + self.quiz_score
            + self.period_test_score
        )

    @property
    def total_score(self):
        if self.period.is_semester_exam:
            return self.semester_exam_score

        return self.period_total

    def clean(self):
        errors = {}

        if (
            self.enrollment_id
            and self.period_id
            and self.enrollment.academic_year_id
            != self.period.academic_year_id
        ):
            errors["period"] = (
                "The result period does not belong to "
                "the enrollment academic year."
            )

        if self.period_id:
            if self.period.is_semester_exam:
                component_total = (
                    self.assignment_score
                    + self.class_activity_score
                    + self.quiz_score
                    + self.period_test_score
                )

                if component_total > Decimal("0"):
                    errors["semester_exam_score"] = (
                        "Semester exam records should use "
                        "only the semester exam score."
                    )

            elif self.semester_exam_score > Decimal("0"):
                errors["semester_exam_score"] = (
                    "Semester exam score is only valid for "
                    "semester examination periods."
                )

            if not self.period.score_entry_open:
                errors["period"] = (
                    "Score entry is closed for this period."
                )

        if errors:
            raise ValidationError(errors)

    def save(self, *args, **kwargs):
        self.full_clean()
        super().save(*args, **kwargs)

    def __str__(self):
        return (
            f"{self.student.full_name} - "
            f"{self.subject} - "
            f"{self.period}: {self.total_score}"
        )


class CBTQuestion(models.Model):
    assessment = models.ForeignKey(
        Assessment,
        on_delete=models.CASCADE,
        related_name="questions",
    )

    text = models.TextField()

    marks = models.DecimalField(
        max_digits=5,
        decimal_places=2,
        default=1,
    )

    order = models.PositiveIntegerField(default=1)

    def __str__(self):
        return self.text[:80]


class CBTOption(models.Model):
    question = models.ForeignKey(
        CBTQuestion,
        on_delete=models.CASCADE,
        related_name="options",
    )

    text = models.CharField(max_length=255)

    is_correct = models.BooleanField(default=False)

    def __str__(self):
        return self.text