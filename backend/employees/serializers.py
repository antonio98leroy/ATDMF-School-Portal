from rest_framework import serializers

from .models import Department, Employee, Position


class DepartmentSerializer(serializers.ModelSerializer):
    employee_count = serializers.IntegerField(
        source="employees.count",
        read_only=True,
    )

    class Meta:
        model = Department
        fields = [
            "id",
            "name",
            "code",
            "description",
            "active",
            "employee_count",
            "created_at",
            "updated_at",
        ]
        read_only_fields = [
            "id",
            "employee_count",
            "created_at",
            "updated_at",
        ]


class PositionSerializer(serializers.ModelSerializer):
    employee_count = serializers.IntegerField(
        source="employees.count",
        read_only=True,
    )

    class Meta:
        model = Position
        fields = [
            "id",
            "name",
            "description",
            "active",
            "employee_count",
            "created_at",
            "updated_at",
        ]
        read_only_fields = [
            "id",
            "employee_count",
            "created_at",
            "updated_at",
        ]


class EmployeeSerializer(serializers.ModelSerializer):
    full_name = serializers.CharField(read_only=True)
    display_name = serializers.CharField(read_only=True)

    department_name = serializers.CharField(
        source="department.name",
        read_only=True,
    )

    position_name = serializers.CharField(
        source="position.name",
        read_only=True,
    )

    photo_url = serializers.SerializerMethodField()

    class Meta:
        model = Employee
        fields = [
            "id",
            "employee_id",
            "photo",
            "photo_url",
            "first_name",
            "middle_name",
            "last_name",
            "full_name",
            "display_name",
            "gender",
            "date_of_birth",
            "phone",
            "alternative_phone",
            "email",
            "address",
            "emergency_contact_name",
            "emergency_contact_phone",
            "qualification",
            "specialization",
            "department",
            "department_name",
            "position",
            "position_name",
            "employment_type",
            "hire_date",
            "status",
            "is_teacher",
            "active",
            "notes",
            "created_at",
            "updated_at",
        ]

        read_only_fields = [
            "id",
            "employee_id",
            "full_name",
            "display_name",
            "department_name",
            "position_name",
            "photo_url",
            "created_at",
            "updated_at",
        ]

    def get_photo_url(self, obj):
        if not obj.photo:
            return None

        request = self.context.get("request")

        if request:
            return request.build_absolute_uri(obj.photo.url)

        return obj.photo.url

    def validate_email(self, value):
        if not value:
            return None

        value = value.strip().lower()

        queryset = Employee.objects.filter(
            email__iexact=value
        )

        if self.instance:
            queryset = queryset.exclude(
                pk=self.instance.pk
            )

        if queryset.exists():
            raise serializers.ValidationError(
                "An employee with this email address already exists."
            )

        return value

    def validate_phone(self, value):
        value = value.strip()

        if len(value) < 7:
            raise serializers.ValidationError(
                "Please enter a valid phone number."
            )

        return value

    def validate(self, attrs):
        department = attrs.get(
            "department",
            getattr(self.instance, "department", None),
        )

        position = attrs.get(
            "position",
            getattr(self.instance, "position", None),
        )

        status = attrs.get(
            "status",
            getattr(
                self.instance,
                "status",
                Employee.Status.ACTIVE,
            ),
        )

        if department and not department.active:
            raise serializers.ValidationError(
                {
                    "department":
                        "The selected department is inactive."
                }
            )

        if position and not position.active:
            raise serializers.ValidationError(
                {
                    "position":
                        "The selected position is inactive."
                }
            )

        attrs["active"] = (
            status == Employee.Status.ACTIVE
        )

        return attrs