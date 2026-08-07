from django.db import transaction
from django.utils import timezone

from rest_framework import permissions, status
from rest_framework.response import Response
from rest_framework.views import APIView

from academics.models import Enrollment
from teacher_assignments.models import TeacherAssignment

from .models import Assessment, Score


def get_teacher(request):
    employee = getattr(request.user, "employee", None)

    if not employee:
        return None, Response(
            {
                "detail": (
                    "This account is not linked to "
                    "an employee record."
                )
            },
            status=status.HTTP_403_FORBIDDEN,
        )

    if not employee.is_teacher:
        return None, Response(
            {
                "detail": (
                    "The linked employee is not "
                    "registered as a teacher."
                )
            },
            status=status.HTTP_403_FORBIDDEN,
        )

    if not employee.active:
        return None, Response(
            {"detail": "This teacher account is inactive."},
            status=status.HTTP_403_FORBIDDEN,
        )

    return employee, None


def get_teacher_assignment(request, assignment_id):
    teacher, error = get_teacher(request)

    if error:
        return None, error

    try:
        assignment = (
            TeacherAssignment.objects
            .select_related(
                "teacher",
                "academic_year",
                "term",
                "class_section",
                "class_section__grade",
                "subject",
            )
            .get(
                pk=assignment_id,
                teacher=teacher,
                active=True,
            )
        )
    except TeacherAssignment.DoesNotExist:
        return None, Response(
            {
                "detail": (
                    "You are not assigned to the selected "
                    "class and subject."
                )
            },
            status=status.HTTP_403_FORBIDDEN,
        )

    return assignment, None


def assessment_belongs_to_assignment(
    assessment,
    assignment,
):
    return (
        assessment.term_id == assignment.term_id
        and assessment.class_section_id
        == assignment.class_section_id
        and assessment.subject_id
        == assignment.subject_id
    )


def serialize_assessment(item):
    return {
        "id": item.id,
        "name": item.name,
        "term": item.term_id,
        "term_name": item.term.name,
        "class_section": item.class_section_id,
        "class_name": str(item.class_section),
        "subject": item.subject_id,
        "subject_name": item.subject.name,
        "max_score": str(item.max_score),
        "date": item.date,
        "active": item.active,
    }


class TeacherAssessmentListCreateView(APIView):
    permission_classes = [permissions.IsAuthenticated]

    def get(self, request):
        assignment_id = request.query_params.get(
            "teacher_assignment"
        )

        if not assignment_id:
            return Response(
                {
                    "teacher_assignment": (
                        "Teacher assignment is required."
                    )
                },
                status=status.HTTP_400_BAD_REQUEST,
            )

        assignment, error = get_teacher_assignment(
            request,
            assignment_id,
        )

        if error:
            return error

        queryset = (
            Assessment.objects
            .select_related(
                "term",
                "class_section",
                "subject",
            )
            .filter(
                term=assignment.term,
                class_section=assignment.class_section,
                subject=assignment.subject,
                active=True,
            )
            .order_by("-date", "-id")
        )

        return Response(
            [serialize_assessment(item) for item in queryset]
        )

    def post(self, request):
        assignment_id = request.data.get(
            "teacher_assignment"
        )

        assignment, error = get_teacher_assignment(
            request,
            assignment_id,
        )

        if error:
            return error

        name = str(
            request.data.get("name", "")
        ).strip()

        max_score = request.data.get("max_score")
        date = request.data.get("date")

        if not name:
            return Response(
                {"name": "Assessment name is required."},
                status=status.HTTP_400_BAD_REQUEST,
            )

        if max_score in ("", None):
            return Response(
                {
                    "max_score": (
                        "Maximum score is required."
                    )
                },
                status=status.HTTP_400_BAD_REQUEST,
            )

        if not date:
            date = timezone.localdate()

        assessment = Assessment(
            name=name,
            term=assignment.term,
            class_section=assignment.class_section,
            subject=assignment.subject,
            max_score=max_score,
            date=date,
            active=True,
        )

        try:
            assessment.full_clean()
            assessment.save()
        except Exception as exc:
            if hasattr(exc, "message_dict"):
                return Response(
                    exc.message_dict,
                    status=status.HTTP_400_BAD_REQUEST,
                )

            return Response(
                {"detail": str(exc)},
                status=status.HTTP_400_BAD_REQUEST,
            )

        return Response(
            serialize_assessment(assessment),
            status=status.HTTP_201_CREATED,
        )


class TeacherAssessmentStudentsView(APIView):
    permission_classes = [permissions.IsAuthenticated]

    def get(self, request, assessment_id):
        assignment_id = request.query_params.get(
            "teacher_assignment"
        )

        assignment, error = get_teacher_assignment(
            request,
            assignment_id,
        )

        if error:
            return error

        try:
            assessment = (
                Assessment.objects
                .select_related(
                    "term",
                    "class_section",
                    "subject",
                )
                .get(
                    pk=assessment_id,
                    active=True,
                )
            )
        except Assessment.DoesNotExist:
            return Response(
                {"detail": "Assessment not found."},
                status=status.HTTP_404_NOT_FOUND,
            )

        if not assessment_belongs_to_assignment(
            assessment,
            assignment,
        ):
            return Response(
                {
                    "detail": (
                        "You are not authorized to enter "
                        "scores for this assessment."
                    )
                },
                status=status.HTTP_403_FORBIDDEN,
            )

        enrollments = (
            Enrollment.objects
            .select_related("student")
            .filter(
                academic_year=assignment.academic_year,
                class_section=assignment.class_section,
                active=True,
            )
            .order_by(
                "student__last_name",
                "student__first_name",
            )
        )

        existing_scores = {
            score.student_id: score
            for score in Score.objects.filter(
                assessment=assessment
            )
        }

        students = []

        for enrollment in enrollments:
            student = enrollment.student
            existing = existing_scores.get(student.id)

            students.append(
                {
                    "student_id": student.id,
                    "admission_number": (
                        student.admission_number
                    ),
                    "full_name": student.full_name,
                    "roll_number": (
                        enrollment.roll_number
                    ),
                    "score": (
                        str(existing.score)
                        if existing
                        else ""
                    ),
                    "remarks": (
                        existing.remarks
                        if existing
                        else ""
                    ),
                }
            )

        return Response(
            {
                "assessment": serialize_assessment(
                    assessment
                ),
                "students": students,
            }
        )


class TeacherAssessmentScoresView(APIView):
    permission_classes = [permissions.IsAuthenticated]

    @transaction.atomic
    def post(self, request, assessment_id):
        assignment_id = request.data.get(
            "teacher_assignment"
        )

        assignment, error = get_teacher_assignment(
            request,
            assignment_id,
        )

        if error:
            return error

        try:
            assessment = Assessment.objects.get(
                pk=assessment_id,
                active=True,
            )
        except Assessment.DoesNotExist:
            return Response(
                {"detail": "Assessment not found."},
                status=status.HTTP_404_NOT_FOUND,
            )

        if not assessment_belongs_to_assignment(
            assessment,
            assignment,
        ):
            return Response(
                {
                    "detail": (
                        "You are not authorized to enter "
                        "scores for this assessment."
                    )
                },
                status=status.HTTP_403_FORBIDDEN,
            )

        submitted_scores = request.data.get(
            "scores",
            [],
        )

        if not isinstance(submitted_scores, list):
            return Response(
                {
                    "scores": (
                        "Scores must be submitted as a list."
                    )
                },
                status=status.HTTP_400_BAD_REQUEST,
            )

        allowed_students = set(
            Enrollment.objects.filter(
                academic_year=assignment.academic_year,
                class_section=assignment.class_section,
                active=True,
            ).values_list(
                "student_id",
                flat=True,
            )
        )

        errors = []
        saved = 0

        for row in submitted_scores:
            student_id = row.get("student_id")
            score_value = row.get("score")
            remarks = str(
                row.get("remarks", "")
            ).strip()

            if not student_id:
                continue

            if int(student_id) not in allowed_students:
                errors.append(
                    {
                        "student_id": student_id,
                        "error": (
                            "Student is not enrolled in "
                            "this assigned class."
                        ),
                    }
                )
                continue

            # Empty score means skip instead of writing 0.
            if score_value in ("", None):
                continue

            try:
                score_obj, _ = Score.objects.get_or_create(
                    assessment=assessment,
                    student_id=student_id,
                    defaults={
                        "score": score_value,
                        "remarks": remarks,
                    },
                )

                score_obj.score = score_value
                score_obj.remarks = remarks

                score_obj.full_clean()
                score_obj.save()

                saved += 1

            except Exception as exc:
                if hasattr(exc, "message_dict"):
                    message = exc.message_dict
                else:
                    message = str(exc)

                errors.append(
                    {
                        "student_id": student_id,
                        "error": message,
                    }
                )

        if errors:
            transaction.set_rollback(True)

            return Response(
                {
                    "detail": (
                        "Some scores were invalid. "
                        "No scores were saved."
                    ),
                    "errors": errors,
                },
                status=status.HTTP_400_BAD_REQUEST,
            )

        return Response(
            {
                "detail": (
                    "Assessment scores saved successfully."
                ),
                "saved": saved,
            }
        )
