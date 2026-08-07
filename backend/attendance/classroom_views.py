from django.db import transaction
from django.utils import timezone

from rest_framework import permissions, status
from rest_framework.response import Response
from rest_framework.views import APIView

from academics.models import Enrollment
from teacher_assignments.models import (
    TeacherAssignment,
    TimetableEntry,
)

from .models import (
    ClassroomAttendanceRecord,
    ClassroomAttendanceSession,
)


def get_teacher(request):
    employee = getattr(
        request.user,
        "employee",
        None,
    )

    if not employee:
        return None, Response(
            {
                "detail": (
                    "This account is not linked "
                    "to an employee record."
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
            {
                "detail": (
                    "This teacher account is inactive."
                )
            },
            status=status.HTTP_403_FORBIDDEN,
        )

    return employee, None


def get_assignment(
    request,
    assignment_id,
):
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
                    "You are not assigned to "
                    "this class and subject."
                )
            },
            status=status.HTTP_403_FORBIDDEN,
        )

    return assignment, None


def serialize_session(session):
    assignment = session.teacher_assignment

    return {
        "id": session.id,

        "date": session.date,

        "submitted": session.submitted,

        "submitted_at": (
            session.submitted_at
            if session.submitted_at
            else None
        ),

        "notes": session.notes,

        "teacher_assignment": assignment.id,

        "teacher": {
            "id": assignment.teacher.id,
            "full_name": (
                assignment.teacher.full_name
            ),
        },

        "class_section": {
            "id": assignment.class_section.id,
            "name": str(
                assignment.class_section
            ),
        },

        "subject": {
            "id": assignment.subject.id,
            "name": assignment.subject.name,
        },

        "term": {
            "id": assignment.term.id,
            "name": assignment.term.name,
        },

        "academic_year": {
            "id": assignment.academic_year.id,
            "name": assignment.academic_year.name,
        },

        "timetable_entry": (
            session.timetable_entry_id
        ),
    }


class ClassroomAttendanceRosterView(APIView):
    permission_classes = [
        permissions.IsAuthenticated
    ]

    def get(self, request):
        assignment_id = (
            request.query_params.get(
                "teacher_assignment"
            )
        )

        date = request.query_params.get(
            "date"
        ) or timezone.localdate()

        timetable_entry_id = (
            request.query_params.get(
                "timetable_entry"
            )
        )

        assignment, error = get_assignment(
            request,
            assignment_id,
        )

        if error:
            return error

        timetable_entry = None

        if timetable_entry_id:
            try:
                timetable_entry = (
                    TimetableEntry.objects.get(
                        pk=timetable_entry_id,
                        teacher_assignment=assignment,
                        active=True,
                    )
                )
            except TimetableEntry.DoesNotExist:
                return Response(
                    {
                        "timetable_entry": (
                            "Invalid timetable entry."
                        )
                    },
                    status=status.HTTP_400_BAD_REQUEST,
                )

        session = (
            ClassroomAttendanceSession.objects
            .filter(
                teacher_assignment=assignment,
                timetable_entry=timetable_entry,
                date=date,
            )
            .first()
        )

        enrollments = (
            Enrollment.objects
            .select_related("student")
            .filter(
                academic_year=(
                    assignment.academic_year
                ),
                class_section=(
                    assignment.class_section
                ),
                active=True,
            )
            .order_by(
                "student__last_name",
                "student__first_name",
            )
        )

        existing = {}

        if session:
            existing = {
                record.student_id: record
                for record in (
                    ClassroomAttendanceRecord.objects
                    .filter(session=session)
                )
            }

        students = []

        for enrollment in enrollments:
            student = enrollment.student
            record = existing.get(
                student.id
            )

            students.append(
                {
                    "student_id": student.id,

                    "admission_number": (
                        student.admission_number
                    ),

                    "full_name": (
                        student.full_name
                    ),

                    "roll_number": (
                        enrollment.roll_number
                    ),

                    "status": (
                        record.status
                        if record
                        else "P"
                    ),

                    "remarks": (
                        record.remarks
                        if record
                        else ""
                    ),
                }
            )

        return Response(
            {
                "session": (
                    serialize_session(session)
                    if session
                    else None
                ),

                "assignment": {
                    "id": assignment.id,

                    "class_name": str(
                        assignment.class_section
                    ),

                    "subject_name": (
                        assignment.subject.name
                    ),

                    "term_name": (
                        assignment.term.name
                    ),

                    "academic_year_name": (
                        assignment.academic_year.name
                    ),
                },

                "date": date,

                "students": students,

                "status_choices": [
                    {
                        "value": value,
                        "label": label,
                    }
                    for value, label
                    in ClassroomAttendanceRecord
                    .Status.choices
                ],
            }
        )


class ClassroomAttendanceSubmitView(APIView):
    permission_classes = [
        permissions.IsAuthenticated
    ]

    @transaction.atomic
    def post(self, request):
        assignment_id = request.data.get(
            "teacher_assignment"
        )

        date = request.data.get(
            "date"
        ) or timezone.localdate()

        timetable_entry_id = (
            request.data.get(
                "timetable_entry"
            )
        )

        records = request.data.get(
            "records",
            [],
        )

        assignment, error = get_assignment(
            request,
            assignment_id,
        )

        if error:
            return error

        timetable_entry = None

        if timetable_entry_id:
            try:
                timetable_entry = (
                    TimetableEntry.objects.get(
                        pk=timetable_entry_id,
                        teacher_assignment=assignment,
                        active=True,
                    )
                )
            except TimetableEntry.DoesNotExist:
                return Response(
                    {
                        "timetable_entry": (
                            "Invalid timetable entry."
                        )
                    },
                    status=status.HTTP_400_BAD_REQUEST,
                )

        session, _ = (
            ClassroomAttendanceSession.objects
            .get_or_create(
                teacher_assignment=assignment,
                timetable_entry=timetable_entry,
                date=date,
                defaults={
                    "recorded_by": (
                        request.user
                    ),
                },
            )
        )

        if (
            session.recorded_by_id
            != request.user.id
        ):
            session.recorded_by = (
                request.user
            )

        allowed_students = set(
            Enrollment.objects.filter(
                academic_year=(
                    assignment.academic_year
                ),
                class_section=(
                    assignment.class_section
                ),
                active=True,
            ).values_list(
                "student_id",
                flat=True,
            )
        )

        valid_statuses = {
            item[0]
            for item in (
                ClassroomAttendanceRecord
                .Status.choices
            )
        }

        errors = []

        for item in records:
            student_id = item.get(
                "student_id"
            )

            attendance_status = (
                item.get("status")
            )

            if not student_id:
                continue

            if int(student_id) not in (
                allowed_students
            ):
                errors.append(
                    {
                        "student_id": (
                            student_id
                        ),
                        "error": (
                            "Student is not enrolled "
                            "in this class."
                        ),
                    }
                )
                continue

            if attendance_status not in (
                valid_statuses
            ):
                errors.append(
                    {
                        "student_id": (
                            student_id
                        ),
                        "error": (
                            "Invalid attendance status."
                        ),
                    }
                )

        if errors:
            transaction.set_rollback(
                True
            )

            return Response(
                {
                    "detail": (
                        "Attendance contains "
                        "invalid records."
                    ),
                    "errors": errors,
                },
                status=(
                    status.HTTP_400_BAD_REQUEST
                ),
            )

        for item in records:
            student_id = item.get(
                "student_id"
            )

            if not student_id:
                continue

            ClassroomAttendanceRecord.objects.update_or_create(
                session=session,
                student_id=student_id,
                defaults={
                    "status": item.get(
                        "status",
                        "P",
                    ),
                    "remarks": str(
                        item.get(
                            "remarks",
                            "",
                        )
                    ).strip(),
                },
            )

        session.submitted = True
        session.submitted_at = timezone.now()
        session.notes = str(
            request.data.get(
                "notes",
                "",
            )
        ).strip()

        session.recorded_by = (
            request.user
        )

        session.save()

        return Response(
            {
                "detail": (
                    "Classroom attendance "
                    "submitted successfully."
                ),
                "session": (
                    serialize_session(session)
                ),
                "records_saved": (
                    len(records)
                ),
            }
        )
