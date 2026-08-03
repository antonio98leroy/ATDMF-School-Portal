from django.contrib import admin

from .models import Department, Employee, Position


@admin.register(Department)
class DepartmentAdmin(admin.ModelAdmin):
    list_display = (
        "name",
        "code",
        "active",
        "created_at",
    )

    list_filter = (
        "active",
    )

    search_fields = (
        "name",
        "code",
        "description",
    )

    ordering = (
        "name",
    )


@admin.register(Position)
class PositionAdmin(admin.ModelAdmin):
    list_display = (
        "name",
        "active",
        "created_at",
    )

    list_filter = (
        "active",
    )

    search_fields = (
        "name",
        "description",
    )

    ordering = (
        "name",
    )


@admin.register(Employee)
class EmployeeAdmin(admin.ModelAdmin):
    list_display = (
        "employee_id",
        "full_name",
        "department",
        "position",
        "employment_type",
        "is_teacher",
        "status",
        "active",
    )

    list_filter = (
        "department",
        "position",
        "employment_type",
        "is_teacher",
        "status",
        "active",
        "gender",
    )

    search_fields = (
        "employee_id",
        "first_name",
        "middle_name",
        "last_name",
        "phone",
        "alternative_phone",
        "email",
    )

    readonly_fields = (
        "employee_id",
        "created_at",
        "updated_at",
    )

    ordering = (
        "last_name",
        "first_name",
    )

    fieldsets = (
        (
            "Employee Identification",
            {
                "fields": (
                    "employee_id",
                    "photo",
                ),
            },
        ),
        (
            "Personal Information",
            {
                "fields": (
                    "first_name",
                    "middle_name",
                    "last_name",
                    "gender",
                    "date_of_birth",
                    "phone",
                    "alternative_phone",
                    "email",
                    "address",
                ),
            },
        ),
        (
            "Emergency Contact",
            {
                "fields": (
                    "emergency_contact_name",
                    "emergency_contact_phone",
                ),
            },
        ),
        (
            "Employment Information",
            {
                "fields": (
                    "department",
                    "position",
                    "qualification",
                    "specialization",
                    "employment_type",
                    "hire_date",
                    "is_teacher",
                    "status",
                    "active",
                ),
            },
        ),
        (
            "Additional Information",
            {
                "fields": (
                    "notes",
                    "created_at",
                    "updated_at",
                ),
            },
        ),
    )