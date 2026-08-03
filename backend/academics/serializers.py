from rest_framework import serializers

from .models import (
    AcademicYear,
    ClassSection,
    Enrollment,
    GradeLevel,
    Subject,
    SubjectAssignment,
    Term,
    TimetableEntry,
    StudentPromotion,
)


class AcademicYearSerializer(serializers.ModelSerializer):
    class Meta:
        model = AcademicYear
        fields = "__all__"

    def validate(self, attrs):
        start_date = attrs.get(
            "start_date",
            getattr(self.instance, "start_date", None),
        )
        end_date = attrs.get(
            "end_date",
            getattr(self.instance, "end_date", None),
        )

        if start_date and end_date and end_date <= start_date:
            raise serializers.ValidationError(
                {
                    "end_date": (
                        "The academic year end date must be "
                        "later than the start date."
                    )
                }
            )

        return attrs


class TermSerializer(serializers.ModelSerializer):
    academic_year_name = serializers.CharField(
        source="academic_year.name",
        read_only=True,
    )

    class Meta:
        model = Term
        fields = "__all__"

    def validate(self, attrs):
        start_date = attrs.get(
            "start_date",
            getattr(self.instance, "start_date", None),
        )
        end_date = attrs.get(
            "end_date",
            getattr(self.instance, "end_date", None),
        )

        if start_date and end_date and end_date <= start_date:
            raise serializers.ValidationError(
                {
                    "end_date": (
                        "The term end date must be later "
                        "than the start date."
                    )
                }
            )

        return attrs


class GradeLevelSerializer(serializers.ModelSerializer):
    class_count = serializers.IntegerField(
        source="classsection_set.count",
        read_only=True,
    )

    class Meta:
        model = GradeLevel
        fields = [
            "id",
            "name",
            "order",
            "class_count",
        ]


class ClassSectionSerializer(serializers.ModelSerializer):
    grade_name = serializers.CharField(
        source="grade.name",
        read_only=True,
    )
    teacher_name = serializers.SerializerMethodField()
    student_count = serializers.IntegerField(
        source="enrollments.count",
        read_only=True,
    )

    class Meta:
        model = ClassSection
        fields = [
            "id",
            "grade",
            "grade_name",
            "name",
            "class_teacher",
            "teacher_name",
            "capacity",
            "student_count",
        ]

    def get_teacher_name(self, obj):
        if not obj.class_teacher:
            return ""

        if hasattr(obj.class_teacher, "full_name"):
            return obj.class_teacher.full_name

        return str(obj.class_teacher)


class SubjectSerializer(serializers.ModelSerializer):
    class Meta:
        model = Subject
        fields = "__all__"


class EnrollmentSerializer(serializers.ModelSerializer):
    student_name = serializers.CharField(
        source="student.full_name",
        read_only=True,
    )
    admission_number = serializers.CharField(
        source="student.admission_number",
        read_only=True,
    )
    class_name = serializers.SerializerMethodField()
    grade_name = serializers.CharField(
        source="class_section.grade.name",
        read_only=True,
    )
    academic_year_name = serializers.CharField(
        source="academic_year.name",
        read_only=True,
    )

    class Meta:
        model = Enrollment
        fields = [
            "id",
            "student",
            "student_name",
            "admission_number",
            "class_section",
            "class_name",
            "grade_name",
            "academic_year",
            "academic_year_name",
            "roll_number",
            "active",
            "created_at",
            "updated_at",
        ]
        read_only_fields = [
            "created_at",
            "updated_at",
        ]

    def get_class_name(self, obj):
        return str(obj.class_section)

    def validate(self, attrs):
        student = attrs.get(
            "student",
            getattr(self.instance, "student", None),
        )
        academic_year = attrs.get(
            "academic_year",
            getattr(self.instance, "academic_year", None),
        )
        class_section = attrs.get(
            "class_section",
            getattr(self.instance, "class_section", None),
        )
        roll_number = attrs.get(
            "roll_number",
            getattr(self.instance, "roll_number", None),
        )

        existing = Enrollment.objects.filter(
            student=student,
            academic_year=academic_year,
        )

        if self.instance:
            existing = existing.exclude(pk=self.instance.pk)

        if existing.exists():
            raise serializers.ValidationError(
                {
                    "student": (
                        "This student is already enrolled "
                        "for the selected academic year."
                    )
                }
            )

        if roll_number:
            roll_exists = Enrollment.objects.filter(
                class_section=class_section,
                academic_year=academic_year,
                roll_number=roll_number,
            )

            if self.instance:
                roll_exists = roll_exists.exclude(
                    pk=self.instance.pk
                )

            if roll_exists.exists():
                raise serializers.ValidationError(
                    {
                        "roll_number": (
                            "This roll number is already assigned "
                            "in the selected class."
                        )
                    }
                )

        if (
            class_section
            and class_section.enrollments.filter(
                academic_year=academic_year,
                active=True,
            ).exclude(
                pk=self.instance.pk if self.instance else None
            ).count()
            >= class_section.capacity
        ):
            raise serializers.ValidationError(
                {
                    "class_section": (
                        "This class has reached its maximum capacity."
                    )
                }
            )

        return attrs

class SubjectAssignmentSerializer(serializers.ModelSerializer):
    subject_name = serializers.CharField(
        source="subject.name",
        read_only=True,
    )
    class_name = serializers.CharField(
        source="class_section.__str__",
        read_only=True,
    )
    academic_year_name = serializers.CharField(
        source="academic_year.name",
        read_only=True,
    )

    class Meta:
        model = SubjectAssignment
        fields = "__all__"


class TimetableEntrySerializer(serializers.ModelSerializer):
    day_name = serializers.CharField(
        source="get_day_display",
        read_only=True,
    )
    class_name = serializers.CharField(
        source="class_section.__str__",
        read_only=True,
    )
    subject_name = serializers.CharField(
        source="subject.name",
        read_only=True,
    )

    class Meta:
        model = TimetableEntry
        fields = "__all__"

    def validate(self, attrs):
        start_time = attrs.get(
            "start_time",
            getattr(self.instance, "start_time", None),
        )
        end_time = attrs.get(
            "end_time",
            getattr(self.instance, "end_time", None),
        )

        if start_time and end_time and end_time <= start_time:
            raise serializers.ValidationError(
                {
                    "end_time": (
                        "The ending time must be later "
                        "than the starting time."
                    )
                }
            )

        return attrs
class StudentPromotionSerializer(
    serializers.ModelSerializer
):
    student_name = serializers.CharField(
        source="student.full_name",
        read_only=True,
    )

    admission_number = serializers.CharField(
        source="student.admission_number",
        read_only=True,
    )

    source_year_name = serializers.CharField(
        source="source_academic_year.name",
        read_only=True,
    )

    target_year_name = serializers.CharField(
        source="target_academic_year.name",
        read_only=True,
    )

    source_class_name = serializers.CharField(
        source="source_class.__str__",
        read_only=True,
    )

    target_class_name = serializers.SerializerMethodField()

    decision_display = serializers.CharField(
        source="get_decision_display",
        read_only=True,
    )

    promoted_by_name = serializers.CharField(
        source="promoted_by.get_full_name",
        read_only=True,
    )

    class Meta:
        model = StudentPromotion

        fields = [
            "id",
            "student",
            "student_name",
            "admission_number",
            "source_enrollment",
            "source_academic_year",
            "source_year_name",
            "source_class",
            "source_class_name",
            "target_academic_year",
            "target_year_name",
            "target_class",
            "target_class_name",
            "target_enrollment",
            "decision",
            "decision_display",
            "yearly_average",
            "remarks",
            "promoted_by",
            "promoted_by_name",
            "processed_at",
        ]

        read_only_fields = [
            "id",
            "student",
            "student_name",
            "admission_number",
            "source_enrollment",
            "source_academic_year",
            "source_year_name",
            "source_class",
            "source_class_name",
            "target_enrollment",
            "target_class_name",
            "decision_display",
            "promoted_by",
            "promoted_by_name",
            "processed_at",
        ]

    def get_target_class_name(self, obj):
        if not obj.target_class:
            return ""

        return str(obj.target_class)