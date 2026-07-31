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
    class_name = serializers.CharField(
        source="class_section.__str__",
        read_only=True,
    )
    academic_year_name = serializers.CharField(
        source="academic_year.name",
        read_only=True,
    )

    class Meta:
        model = Enrollment
        fields = "__all__"


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
