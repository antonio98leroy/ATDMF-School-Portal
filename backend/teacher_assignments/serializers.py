from rest_framework import serializers

from academics.models import Term
from employees.models import Employee

from .models import TeacherAssignment


class TeacherAssignmentSerializer(
    serializers.ModelSerializer
):
    teacher_name = serializers.CharField(
        source="teacher.full_name",
        read_only=True,
    )

    employee_id = serializers.CharField(
        source="teacher.employee_id",
        read_only=True,
    )

    academic_year_name = serializers.CharField(
        source="academic_year.name",
        read_only=True,
    )

    term_name = serializers.CharField(
        source="term.name",
        read_only=True,
    )

    class_name = serializers.SerializerMethodField()

    grade_name = serializers.CharField(
        source="class_section.grade.name",
        read_only=True,
    )

    subject_name = serializers.CharField(
        source="subject.name",
        read_only=True,
    )

    subject_code = serializers.CharField(
        source="subject.code",
        read_only=True,
    )

    class Meta:
        model = TeacherAssignment

        fields = [
            "id",
            "teacher",
            "teacher_name",
            "employee_id",
            "academic_year",
            "academic_year_name",
            "term",
            "term_name",
            "class_section",
            "class_name",
            "grade_name",
            "subject",
            "subject_name",
            "subject_code",
            "weekly_periods",
            "is_class_teacher",
            "active",
            "notes",
            "created_at",
            "updated_at",
        ]

        read_only_fields = [
            "id",
            "teacher_name",
            "employee_id",
            "academic_year_name",
            "term_name",
            "class_name",
            "grade_name",
            "subject_name",
            "subject_code",
            "created_at",
            "updated_at",
        ]

    def get_class_name(self, obj):
        return str(obj.class_section)

    def validate_teacher(self, teacher):
        if not teacher.is_teacher:
            raise serializers.ValidationError(
                "This employee is not marked as a teacher."
            )

        if not teacher.active:
            raise serializers.ValidationError(
                "This teacher is inactive."
            )

        return teacher

    def validate(self, attrs):
        academic_year = attrs.get(
            "academic_year",
            getattr(
                self.instance,
                "academic_year",
                None,
            ),
        )

        term = attrs.get(
            "term",
            getattr(self.instance, "term", None),
        )

        class_section = attrs.get(
            "class_section",
            getattr(
                self.instance,
                "class_section",
                None,
            ),
        )

        subject = attrs.get(
            "subject",
            getattr(self.instance, "subject", None),
        )

        if (
            term
            and academic_year
            and term.academic_year_id
            != academic_year.id
        ):
            raise serializers.ValidationError(
                {
                    "term": (
                        "The selected term does not belong "
                        "to the selected academic year."
                    )
                }
            )

        duplicate = TeacherAssignment.objects.filter(
            academic_year=academic_year,
            term=term,
            class_section=class_section,
            subject=subject,
        )

        if self.instance:
            duplicate = duplicate.exclude(
                pk=self.instance.pk
            )

        if duplicate.exists():
            raise serializers.ValidationError(
                {
                    "subject": (
                        "This subject already has a teacher "
                        "for the selected class and term."
                    )
                }
            )

        teacher = attrs.get(
            "teacher",
            getattr(self.instance, "teacher", None),
        )

        is_class_teacher = attrs.get(
            "is_class_teacher",
            getattr(
                self.instance,
                "is_class_teacher",
                False,
            ),
        )

        if is_class_teacher and class_section:
            existing_class_teacher = (
                TeacherAssignment.objects.filter(
                    academic_year=academic_year,
                    term=term,
                    class_section=class_section,
                    is_class_teacher=True,
                    active=True,
                )
            )

            if self.instance:
                existing_class_teacher = (
                    existing_class_teacher.exclude(
                        pk=self.instance.pk
                    )
                )

            if existing_class_teacher.exists():
                raise serializers.ValidationError(
                    {
                        "is_class_teacher": (
                            "This class already has an active "
                            "class teacher for the selected term."
                        )
                    }
                )

        if teacher and not teacher.is_teacher:
            raise serializers.ValidationError(
                {
                    "teacher": (
                        "The selected employee is not marked "
                        "as a teacher."
                    )
                }
            )

        return attrs