from rest_framework import serializers

from .models import (
    Assessment,
    CBTOption,
    CBTQuestion,
    GradeScale,
    ResultPeriod,
    Score,
    SubjectResult,
)


class AssessmentSerializer(
    serializers.ModelSerializer
):
    class_name = serializers.CharField(
        source="class_section.__str__",
        read_only=True,
    )

    subject_name = serializers.CharField(
        source="subject.name",
        read_only=True,
    )

    term_name = serializers.CharField(
        source="term.name",
        read_only=True,
    )

    class Meta:
        model = Assessment
        fields = "__all__"


class ScoreSerializer(serializers.ModelSerializer):
    student_name = serializers.CharField(
        source="student.full_name",
        read_only=True,
    )

    admission_number = serializers.CharField(
        source="student.admission_number",
        read_only=True,
    )

    class Meta:
        model = Score
        fields = "__all__"


class GradeScaleSerializer(
    serializers.ModelSerializer
):
    class Meta:
        model = GradeScale
        fields = "__all__"


class ResultPeriodSerializer(
    serializers.ModelSerializer
):
    academic_year_name = serializers.CharField(
        source="academic_year.name",
        read_only=True,
    )

    display_name = serializers.CharField(
        source="get_code_display",
        read_only=True,
    )

    is_semester_exam = serializers.BooleanField(
        read_only=True,
    )

    is_period = serializers.BooleanField(
        read_only=True,
    )

    class Meta:
        model = ResultPeriod

        fields = [
            "id",
            "academic_year",
            "academic_year_name",
            "code",
            "display_name",
            "name",
            "order",
            "start_date",
            "end_date",
            "active",
            "score_entry_open",
            "published",
            "is_semester_exam",
            "is_period",
            "created_at",
            "updated_at",
        ]

        read_only_fields = [
            "id",
            "display_name",
            "order",
            "is_semester_exam",
            "is_period",
            "created_at",
            "updated_at",
        ]


class SubjectResultSerializer(
    serializers.ModelSerializer
):
    student_id = serializers.IntegerField(
        source="enrollment.student.id",
        read_only=True,
    )

    student_name = serializers.CharField(
        source="enrollment.student.full_name",
        read_only=True,
    )

    admission_number = serializers.CharField(
        source=(
            "enrollment.student.admission_number"
        ),
        read_only=True,
    )

    class_name = serializers.CharField(
        source="enrollment.class_section.__str__",
        read_only=True,
    )

    grade_name = serializers.CharField(
        source=(
            "enrollment.class_section.grade.name"
        ),
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

    period_name = serializers.CharField(
        source="period.name",
        read_only=True,
    )

    period_code = serializers.CharField(
        source="period.code",
        read_only=True,
    )

    period_total = serializers.DecimalField(
        max_digits=5,
        decimal_places=2,
        read_only=True,
    )

    total_score = serializers.DecimalField(
        max_digits=5,
        decimal_places=2,
        read_only=True,
    )

    entered_by_name = serializers.CharField(
        source="entered_by.get_full_name",
        read_only=True,
    )

    approved_by_name = serializers.CharField(
        source="approved_by.get_full_name",
        read_only=True,
    )

    class Meta:
        model = SubjectResult

        fields = [
            "id",
            "enrollment",
            "student_id",
            "student_name",
            "admission_number",
            "class_name",
            "grade_name",
            "subject",
            "subject_name",
            "subject_code",
            "period",
            "period_name",
            "period_code",
            "assignment_score",
            "class_activity_score",
            "quiz_score",
            "period_test_score",
            "semester_exam_score",
            "period_total",
            "total_score",
            "remarks",
            "entered_by",
            "entered_by_name",
            "approved_by",
            "approved_by_name",
            "approved",
            "published",
            "created_at",
            "updated_at",
        ]

        read_only_fields = [
            "id",
            "student_id",
            "student_name",
            "admission_number",
            "class_name",
            "grade_name",
            "subject_name",
            "subject_code",
            "period_name",
            "period_code",
            "period_total",
            "total_score",
            "entered_by",
            "entered_by_name",
            "approved_by",
            "approved_by_name",
            "created_at",
            "updated_at",
        ]

    def create(self, validated_data):
        request = self.context.get("request")

        if request and request.user.is_authenticated:
            validated_data["entered_by"] = request.user

        return super().create(validated_data)

    def update(self, instance, validated_data):
        request = self.context.get("request")

        if request and request.user.is_authenticated:
            validated_data["entered_by"] = request.user

        return super().update(
            instance,
            validated_data,
        )


class CBTQuestionSerializer(
    serializers.ModelSerializer
):
    class Meta:
        model = CBTQuestion
        fields = "__all__"


class CBTOptionSerializer(
    serializers.ModelSerializer
):
    class Meta:
        model = CBTOption
        fields = "__all__"