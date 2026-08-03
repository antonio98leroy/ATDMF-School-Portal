from decimal import Decimal, ROUND_HALF_UP

from .models import (
    GradeScale,
    ResultPeriod,
    SubjectResult,
)


ZERO = Decimal("0.00")
TWO_PLACES = Decimal("0.01")


def round_score(value):
    if value is None:
        return ZERO

    return Decimal(value).quantize(
        TWO_PLACES,
        rounding=ROUND_HALF_UP,
    )


def average(values):
    valid_values = [
        Decimal(value)
        for value in values
        if value is not None
    ]

    if not valid_values:
        return None

    return round_score(
        sum(valid_values) / len(valid_values)
    )


def resolve_grade(score, grading_system):
    if score is None:
        return {
            "grade": "",
            "remark": "",
            "points": ZERO,
        }

    scale = (
        GradeScale.objects
        .filter(
            grading_system=grading_system,
            active=True,
            min_score__lte=score,
            max_score__gte=score,
        )
        .order_by("-min_score")
        .first()
    )

    if not scale:
        return {
            "grade": "",
            "remark": "",
            "points": ZERO,
        }

    return {
        "grade": scale.grade,
        "remark": scale.remark,
        "points": scale.points,
    }


def get_subject_year_result(
    enrollment,
    subject,
):
    results = {
        item.period.code: item
        for item in (
            SubjectResult.objects
            .select_related("period")
            .filter(
                enrollment=enrollment,
                subject=subject,
            )
        )
    }

    def score(code):
        result = results.get(code)

        if not result:
            return None

        return round_score(result.total_score)

    first_period = score(
        ResultPeriod.Code.FIRST_PERIOD
    )
    second_period = score(
        ResultPeriod.Code.SECOND_PERIOD
    )
    third_period = score(
        ResultPeriod.Code.THIRD_PERIOD
    )
    first_exam = score(
        ResultPeriod.Code.FIRST_SEMESTER_EXAM
    )

    fourth_period = score(
        ResultPeriod.Code.FOURTH_PERIOD
    )
    fifth_period = score(
        ResultPeriod.Code.FIFTH_PERIOD
    )
    sixth_period = score(
        ResultPeriod.Code.SIXTH_PERIOD
    )
    second_exam = score(
        ResultPeriod.Code.SECOND_SEMESTER_EXAM
    )

    first_average = average(
        [
            first_period,
            second_period,
            third_period,
            first_exam,
        ]
    )

    second_average = average(
        [
            fourth_period,
            fifth_period,
            sixth_period,
            second_exam,
        ]
    )

    yearly_average = average(
        [
            first_average,
            second_average,
        ]
    )

    grading_system = (
        enrollment.class_section.grade.grading_system
    )

    grade_data = resolve_grade(
        yearly_average,
        grading_system,
    )

    return {
        "subject_id": subject.id,
        "subject_code": subject.code,
        "subject_name": subject.name,
        "first_period": first_period,
        "second_period": second_period,
        "third_period": third_period,
        "first_semester_exam": first_exam,
        "first_average": first_average,
        "fourth_period": fourth_period,
        "fifth_period": fifth_period,
        "sixth_period": sixth_period,
        "second_semester_exam": second_exam,
        "second_average": second_average,
        "yearly_average": yearly_average,
        **grade_data,
    }