from django.db.models import Count
from rest_framework import permissions, status
from rest_framework.response import Response
from rest_framework.views import APIView

from academics.models import Enrollment
from attendance.models import StudentAttendance
from examinations.models import SubjectResult
from examinations.services import (
    average,
    get_subject_year_result,
    resolve_grade,
)

from .models import Student


def get_logged_in_student(request):
    try:
        student = (
            Student.objects
            .select_related(
                "user",
                "guardian",
            )
            .get(user=request.user)
        )
    except Student.DoesNotExist:
        return None, Response(
            {
                "detail": (
                    "This user account is not linked to a "
                    "student record."
                )
            },
            status=status.HTTP_403_FORBIDDEN,
        )

    if not student.is_active:
        return None, Response(
            {
                "detail": "This student account is inactive."
            },
            status=status.HTTP_403_FORBIDDEN,
        )

    return student, None


class StudentPortalDashboardView(APIView):
    permission_classes = [
        permissions.IsAuthenticated,
    ]

    def get(self, request):
        student, error_response = (
            get_logged_in_student(request)
        )

        if error_response:
            return error_response

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

        attendance = StudentAttendance.objects.filter(
            student=student
        )

        attendance_totals = {
            item["status"]: item["total"]
            for item in (
                attendance
                .values("status")
                .annotate(total=Count("id"))
            )
        }

        total_attendance = sum(
            attendance_totals.values()
        )

        present_count = attendance_totals.get(
            "P",
            0,
        )

        attendance_percentage = (
            round(
                present_count
                / total_attendance
                * 100,
                2,
            )
            if total_attendance
            else 0
        )

        saved_results = SubjectResult.objects.filter(
            enrollment__student=student
        )

        return Response(
            {
                "student": {
                    "id": student.id,
                    "admission_number": (
                        student.admission_number
                    ),
                    "full_name": student.full_name,
                    "first_name": student.first_name,
                    "middle_name": student.middle_name,
                    "last_name": student.last_name,
                    "gender": student.gender,
                    "date_of_birth": (
                        student.date_of_birth
                    ),
                    "phone": student.phone,
                    "email": student.email,
                    "address": student.address,
                    "photo": (
                        request.build_absolute_uri(
                            student.photo.url
                        )
                        if student.photo
                        else None
                    ),
                    "admission_date": (
                        student.admission_date
                    ),
                    "previous_school": (
                        student.previous_school
                    ),
                },

                "guardian": (
                    {
                        "id": student.guardian.id,
                        "name": student.guardian.name,
                        "relationship": (
                            student.guardian.relationship
                        ),
                        "phone": student.guardian.phone,
                        "email": student.guardian.email,
                        "address": (
                            student.guardian.address
                        ),
                    }
                    if student.guardian
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
                        "grading_system": (
                            active_enrollment
                            .class_section.grade
                            .grading_system
                        ),
                    }
                    if active_enrollment
                    else None
                ),

                "statistics": {
                    "attendance_records": (
                        total_attendance
                    ),
                    "present": present_count,
                    "absent": (
                        attendance_totals.get(
                            "A",
                            0,
                        )
                    ),
                    "late": (
                        attendance_totals.get(
                            "L",
                            0,
                        )
                    ),
                    "excused": (
                        attendance_totals.get(
                            "E",
                            0,
                        )
                    ),
                    "attendance_percentage": (
                        attendance_percentage
                    ),
                    "saved_results": (
                        saved_results.count()
                    ),
                    "published_results": (
                        saved_results.filter(
                            published=True
                        ).count()
                    ),
                },
            }
        )


class StudentPortalEnrollmentsView(APIView):
    permission_classes = [
        permissions.IsAuthenticated,
    ]

    def get(self, request):
        student, error_response = (
            get_logged_in_student(request)
        )

        if error_response:
            return error_response

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

        records = []

        for enrollment in enrollments:
            records.append(
                {
                    "id": enrollment.id,
                    "academic_year": (
                        enrollment.academic_year.id
                    ),
                    "academic_year_name": (
                        enrollment.academic_year.name
                    ),
                    "class_section": (
                        enrollment.class_section.id
                    ),
                    "class_name": str(
                        enrollment.class_section
                    ),
                    "grade_name": (
                        enrollment
                        .class_section.grade.name
                    ),
                    "roll_number": (
                        enrollment.roll_number
                    ),
                    "active": enrollment.active,
                }
            )

        return Response(records)


class StudentPortalAttendanceView(APIView):
    permission_classes = [
        permissions.IsAuthenticated,
    ]

    def get(self, request):
        student, error_response = (
            get_logged_in_student(request)
        )

        if error_response:
            return error_response

        queryset = (
            StudentAttendance.objects
            .select_related(
                "class_section",
                "term",
                "term__academic_year",
                "recorded_by",
            )
            .filter(student=student)
            .order_by("-date")
        )

        term = request.query_params.get("term")

        date_from = request.query_params.get(
            "date_from"
        )

        date_to = request.query_params.get(
            "date_to"
        )

        if term:
            queryset = queryset.filter(
                term_id=term
            )

        if date_from:
            queryset = queryset.filter(
                date__gte=date_from
            )

        if date_to:
            queryset = queryset.filter(
                date__lte=date_to
            )

        records = []

        for attendance in queryset:
            records.append(
                {
                    "id": attendance.id,
                    "date": attendance.date,
                    "status": attendance.status,
                    "status_display": (
                        attendance.get_status_display()
                    ),
                    "remarks": attendance.remarks,
                    "class_name": str(
                        attendance.class_section
                    ),
                    "term": attendance.term.id,
                    "term_name": (
                        attendance.term.name
                    ),
                    "academic_year_name": (
                        attendance.term
                        .academic_year.name
                    ),
                }
            )

        return Response(records)


class StudentPortalResultsView(APIView):
    permission_classes = [
        permissions.IsAuthenticated,
    ]

    def get(self, request):
        student, error_response = (
            get_logged_in_student(request)
        )

        if error_response:
            return error_response

        academic_year_id = (
            request.query_params.get(
                "academic_year"
            )
        )

        enrollment_query = (
            Enrollment.objects
            .select_related(
                "academic_year",
                "class_section",
                "class_section__grade",
            )
            .filter(student=student)
        )

        if academic_year_id:
            enrollment_query = (
                enrollment_query.filter(
                    academic_year_id=(
                        academic_year_id
                    )
                )
            )

        enrollment = (
            enrollment_query
            .order_by(
                "-academic_year__start_date"
            )
            .first()
        )

        if not enrollment:
            return Response(
                {
                    "detail": (
                        "No enrollment record was found "
                        "for this student."
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

        from academics.models import Subject

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
