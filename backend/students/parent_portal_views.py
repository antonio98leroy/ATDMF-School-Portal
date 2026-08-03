from django.db.models import Count
from rest_framework import permissions, status
from rest_framework.response import Response
from rest_framework.views import APIView

from academics.models import Enrollment, Subject
from attendance.models import StudentAttendance
from examinations.models import SubjectResult
from examinations.services import (
    average,
    get_subject_year_result,
    resolve_grade,
)

from .models import Guardian


def get_logged_in_guardian(request):
    try:
        guardian = (
            Guardian.objects
            .prefetch_related("students")
            .get(user=request.user)
        )
    except Guardian.DoesNotExist:
        return None, Response(
            {
                "detail": (
                    "This user account is not linked "
                    "to a guardian record."
                )
            },
            status=status.HTTP_403_FORBIDDEN,
        )

    if not guardian.active:
        return None, Response(
            {
                "detail": (
                    "This parent or guardian account "
                    "is inactive."
                )
            },
            status=status.HTTP_403_FORBIDDEN,
        )

    return guardian, None


class ParentPortalDashboardView(APIView):
    permission_classes = [
        permissions.IsAuthenticated,
    ]

    def get(self, request):
        guardian, error_response = (
            get_logged_in_guardian(request)
        )

        if error_response:
            return error_response

        students = (
            guardian.students
            .filter(is_active=True)
            .order_by(
                "last_name",
                "first_name",
            )
        )

        children = []

        for student in students:
            active_enrollment = (
                Enrollment.objects
                .select_related(
                    "academic_year",
                    "class_section",
                    "class_section__grade",
                )
                .filter(
                    student=student,
                    active=True,
                )
                .order_by(
                    "-academic_year__start_date"
                )
                .first()
            )

            attendance = (
                StudentAttendance.objects
                .filter(student=student)
            )

            attendance_counts = {
                item["status"]: item["total"]
                for item in (
                    attendance
                    .values("status")
                    .annotate(total=Count("id"))
                )
            }

            total_attendance = sum(
                attendance_counts.values()
            )

            present = attendance_counts.get(
                "P",
                0,
            )

            attendance_percentage = (
                round(
                    present
                    / total_attendance
                    * 100,
                    2,
                )
                if total_attendance
                else 0
            )

            published_results = (
                SubjectResult.objects
                .filter(
                    enrollment__student=student,
                    published=True,
                )
                .count()
            )

            children.append(
                {
                    "id": student.id,
                    "admission_number": (
                        student.admission_number
                    ),
                    "full_name": student.full_name,
                    "gender": student.gender,
                    "date_of_birth": (
                        student.date_of_birth
                    ),
                    "photo": (
                        request.build_absolute_uri(
                            student.photo.url
                        )
                        if student.photo
                        else None
                    ),
                    "enrollment": (
                        {
                            "id": active_enrollment.id,
                            "academic_year": (
                                active_enrollment
                                .academic_year.id
                            ),
                            "academic_year_name": (
                                active_enrollment
                                .academic_year.name
                            ),
                            "class_section": (
                                active_enrollment
                                .class_section.id
                            ),
                            "class_name": str(
                                active_enrollment
                                .class_section
                            ),
                            "grade_name": (
                                active_enrollment
                                .class_section.grade.name
                            ),
                            "roll_number": (
                                active_enrollment
                                .roll_number
                            ),
                        }
                        if active_enrollment
                        else None
                    ),
                    "statistics": {
                        "attendance_records": (
                            total_attendance
                        ),
                        "present": present,
                        "absent": (
                            attendance_counts.get(
                                "A",
                                0,
                            )
                        ),
                        "late": (
                            attendance_counts.get(
                                "L",
                                0,
                            )
                        ),
                        "excused": (
                            attendance_counts.get(
                                "E",
                                0,
                            )
                        ),
                        "attendance_percentage": (
                            attendance_percentage
                        ),
                        "published_results": (
                            published_results
                        ),
                    },
                }
            )

        return Response(
            {
                "guardian": {
                    "id": guardian.id,
                    "name": guardian.name,
                    "relationship": (
                        guardian.relationship
                    ),
                    "phone": guardian.phone,
                    "email": guardian.email,
                    "address": guardian.address,
                },
                "children": children,
                "statistics": {
                    "children": len(children),
                    "active_enrollments": sum(
                        1
                        for child in children
                        if child["enrollment"]
                    ),
                },
            }
        )


class ParentPortalChildAttendanceView(APIView):
    permission_classes = [
        permissions.IsAuthenticated,
    ]

    def get(self, request):
        guardian, error_response = (
            get_logged_in_guardian(request)
        )

        if error_response:
            return error_response

        student_id = request.query_params.get(
            "student"
        )

        if not student_id:
            return Response(
                {
                    "detail": (
                        "Student is required."
                    )
                },
                status=status.HTTP_400_BAD_REQUEST,
            )

        student = guardian.students.filter(
            id=student_id,
            is_active=True,
        ).first()

        if not student:
            return Response(
                {
                    "detail": (
                        "This student is not linked "
                        "to your guardian account."
                    )
                },
                status=status.HTTP_403_FORBIDDEN,
            )

        queryset = (
            StudentAttendance.objects
            .select_related(
                "class_section",
                "term",
                "term__academic_year",
            )
            .filter(student=student)
            .order_by("-date")
        )

        term = request.query_params.get("term")

        if term:
            queryset = queryset.filter(
                term_id=term
            )

        records = [
            {
                "id": item.id,
                "date": item.date,
                "status": item.status,
                "status_display": (
                    item.get_status_display()
                ),
                "remarks": item.remarks,
                "class_name": str(
                    item.class_section
                ),
                "term_name": item.term.name,
                "academic_year_name": (
                    item.term.academic_year.name
                ),
            }
            for item in queryset
        ]

        return Response(records)


class ParentPortalChildResultsView(APIView):
    permission_classes = [
        permissions.IsAuthenticated,
    ]

    def get(self, request):
        guardian, error_response = (
            get_logged_in_guardian(request)
        )

        if error_response:
            return error_response

        student_id = request.query_params.get(
            "student"
        )

        academic_year_id = (
            request.query_params.get(
                "academic_year"
            )
        )

        if not student_id:
            return Response(
                {
                    "detail": (
                        "Student is required."
                    )
                },
                status=status.HTTP_400_BAD_REQUEST,
            )

        student = guardian.students.filter(
            id=student_id,
            is_active=True,
        ).first()

        if not student:
            return Response(
                {
                    "detail": (
                        "This student is not linked "
                        "to your guardian account."
                    )
                },
                status=status.HTTP_403_FORBIDDEN,
            )

        enrollments = (
            Enrollment.objects
            .select_related(
                "academic_year",
                "class_section",
                "class_section__grade",
            )
            .filter(student=student)
        )

        if academic_year_id:
            enrollments = enrollments.filter(
                academic_year_id=(
                    academic_year_id
                )
            )

        enrollment = (
            enrollments
            .order_by(
                "-academic_year__start_date"
            )
            .first()
        )

        if not enrollment:
            return Response(
                {
                    "detail": (
                        "No enrollment record was found."
                    )
                },
                status=status.HTTP_404_NOT_FOUND,
            )

        subject_ids = (
            SubjectResult.objects
            .filter(
                enrollment=enrollment,
                published=True,
            )
            .values_list(
                "subject_id",
                flat=True,
            )
            .distinct()
        )

        subjects = Subject.objects.filter(
            id__in=subject_ids
        ).order_by("name")

        subject_results = [
            get_subject_year_result(
                enrollment,
                subject,
            )
            for subject in subjects
        ]

        yearly_scores = [
            item["yearly_average"]
            for item in subject_results
            if item["yearly_average"]
            is not None
        ]

        overall_average = average(
            yearly_scores
        )

        grading_system = (
            enrollment.class_section.grade
            .grading_system
        )

        grade_data = resolve_grade(
            overall_average,
            grading_system,
        )

        return Response(
            {
                "student": {
                    "id": student.id,
                    "admission_number": (
                        student.admission_number
                    ),
                    "full_name": (
                        student.full_name
                    ),
                },
                "academic_year": {
                    "id": (
                        enrollment
                        .academic_year.id
                    ),
                    "name": (
                        enrollment
                        .academic_year.name
                    ),
                },
                "class": {
                    "id": (
                        enrollment
                        .class_section.id
                    ),
                    "name": str(
                        enrollment.class_section
                    ),
                    "grade_name": (
                        enrollment
                        .class_section.grade.name
                    ),
                    "grading_system": (
                        grading_system
                    ),
                },
                "subjects": subject_results,
                "overall_average": (
                    overall_average
                ),
                "overall_grade": (
                    grade_data["grade"]
                ),
                "overall_remark": (
                    grade_data["remark"]
                ),
            }
        )


class ParentPortalChildEnrollmentsView(APIView):
    permission_classes = [
        permissions.IsAuthenticated,
    ]

    def get(self, request):
        guardian, error_response = (
            get_logged_in_guardian(request)
        )

        if error_response:
            return error_response

        student_id = request.query_params.get(
            "student"
        )

        student = guardian.students.filter(
            id=student_id,
        ).first()

        if not student:
            return Response(
                {
                    "detail": (
                        "This student is not linked "
                        "to your guardian account."
                    )
                },
                status=status.HTTP_403_FORBIDDEN,
            )

        enrollments = (
            Enrollment.objects
            .select_related(
                "academic_year",
                "class_section",
                "class_section__grade",
            )
            .filter(student=student)
            .order_by(
                "-academic_year__start_date"
            )
        )

        return Response(
            [
                {
                    "id": item.id,
                    "academic_year": (
                        item.academic_year.id
                    ),
                    "academic_year_name": (
                        item.academic_year.name
                    ),
                    "class_section": (
                        item.class_section.id
                    ),
                    "class_name": str(
                        item.class_section
                    ),
                    "grade_name": (
                        item.class_section
                        .grade.name
                    ),
                    "roll_number": (
                        item.roll_number
                    ),
                    "active": item.active,
                }
                for item in enrollments
            ]
        )