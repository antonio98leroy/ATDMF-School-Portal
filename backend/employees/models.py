from django.core.validators import MinLengthValidator
from django.db import models
from django.utils import timezone


class Department(models.Model):
    name = models.CharField(
        max_length=100,
        unique=True,
    )

    code = models.CharField(
        max_length=20,
        unique=True,
        blank=True,
        null=True,
        help_text="Optional short department code, for example ICT or ADM.",
    )

    description = models.TextField(
        blank=True,
    )

    active = models.BooleanField(
        default=True,
    )

    created_at = models.DateTimeField(
        auto_now_add=True,
    )

    updated_at = models.DateTimeField(
        auto_now=True,
    )

    class Meta:
        ordering = ["name"]
        verbose_name = "Department"
        verbose_name_plural = "Departments"

    def __str__(self):
        return self.name


class Position(models.Model):
    name = models.CharField(
        max_length=100,
        unique=True,
    )

    description = models.TextField(
        blank=True,
    )

    active = models.BooleanField(
        default=True,
    )

    created_at = models.DateTimeField(
        auto_now_add=True,
    )

    updated_at = models.DateTimeField(
        auto_now=True,
    )

    class Meta:
        ordering = ["name"]
        verbose_name = "Position"
        verbose_name_plural = "Positions"

    def __str__(self):
        return self.name


class Employee(models.Model):
    class Gender(models.TextChoices):
        MALE = "Male", "Male"
        FEMALE = "Female", "Female"
        OTHER = "Other", "Other"

    class EmploymentType(models.TextChoices):
        FULL_TIME = "Full Time", "Full Time"
        PART_TIME = "Part Time", "Part Time"
        CONTRACT = "Contract", "Contract"
        VOLUNTEER = "Volunteer", "Volunteer"
        TEMPORARY = "Temporary", "Temporary"

    class Status(models.TextChoices):
        ACTIVE = "Active", "Active"
        INACTIVE = "Inactive", "Inactive"
        SUSPENDED = "Suspended", "Suspended"
        RETIRED = "Retired", "Retired"
        RESIGNED = "Resigned", "Resigned"
        TERMINATED = "Terminated", "Terminated"

    employee_id = models.CharField(
        max_length=30,
        unique=True,
        editable=False,
        blank=True,
    )

    photo = models.ImageField(
        upload_to="employees/photos/",
        blank=True,
        null=True,
    )

    first_name = models.CharField(
        max_length=100,
        validators=[MinLengthValidator(2)],
    )

    middle_name = models.CharField(
        max_length=100,
        blank=True,
    )

    last_name = models.CharField(
        max_length=100,
        validators=[MinLengthValidator(2)],
    )

    gender = models.CharField(
        max_length=20,
        choices=Gender.choices,
    )

    date_of_birth = models.DateField(
        blank=True,
        null=True,
    )

    phone = models.CharField(
        max_length=30,
    )

    alternative_phone = models.CharField(
        max_length=30,
        blank=True,
    )

    email = models.EmailField(
        blank=True,
        null=True,
        unique=True,
    )

    address = models.TextField(
        blank=True,
    )

    emergency_contact_name = models.CharField(
        max_length=150,
        blank=True,
    )

    emergency_contact_phone = models.CharField(
        max_length=30,
        blank=True,
    )

    qualification = models.CharField(
        max_length=200,
        blank=True,
    )

    specialization = models.CharField(
        max_length=200,
        blank=True,
    )

    department = models.ForeignKey(
        Department,
        on_delete=models.PROTECT,
        related_name="employees",
    )

    position = models.ForeignKey(
        Position,
        on_delete=models.PROTECT,
        related_name="employees",
    )

    employment_type = models.CharField(
        max_length=30,
        choices=EmploymentType.choices,
        default=EmploymentType.FULL_TIME,
    )

    hire_date = models.DateField(
        default=timezone.localdate,
    )

    status = models.CharField(
        max_length=30,
        choices=Status.choices,
        default=Status.ACTIVE,
    )

    is_teacher = models.BooleanField(
        default=False,
        help_text="Select this when the employee performs teaching duties.",
    )

    active = models.BooleanField(
        default=True,
    )

    notes = models.TextField(
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
            "last_name",
            "first_name",
            "middle_name",
        ]

        verbose_name = "Employee"
        verbose_name_plural = "Employees"

        indexes = [
            models.Index(fields=["employee_id"]),
            models.Index(fields=["last_name", "first_name"]),
            models.Index(fields=["department"]),
            models.Index(fields=["position"]),
            models.Index(fields=["status"]),
        ]

    def generate_employee_id(self):
        prefix = "ATDMF-EMP"

        last_employee = (
            Employee.objects
            .exclude(employee_id="")
            .order_by("-id")
            .first()
        )

        next_number = 1

        if last_employee and last_employee.employee_id:
            try:
                current_number = int(
                    last_employee.employee_id.split("-")[-1]
                )
                next_number = current_number + 1
            except (ValueError, IndexError):
                next_number = last_employee.id + 1

        employee_id = f"{prefix}-{next_number:04d}"

        while Employee.objects.filter(
            employee_id=employee_id
        ).exists():
            next_number += 1
            employee_id = f"{prefix}-{next_number:04d}"

        return employee_id

    def save(self, *args, **kwargs):
        if not self.employee_id:
            self.employee_id = self.generate_employee_id()

        if self.status != self.Status.ACTIVE:
            self.active = False

        super().save(*args, **kwargs)

    @property
    def full_name(self):
        names = [
            self.first_name,
            self.middle_name,
            self.last_name,
        ]

        return " ".join(
            name.strip()
            for name in names
            if name and name.strip()
        )

    @property
    def display_name(self):
        return f"{self.employee_id} - {self.full_name}"

    def __str__(self):
        return self.display_name