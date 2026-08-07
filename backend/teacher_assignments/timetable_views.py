from django.core.exceptions import ValidationError
from django.db.models import Q

from rest_framework import permissions, status
from rest_framework.response import Response
from rest_framework.views import APIView

from .models import (
    SchoolPeriod,
    TeacherAssignment,
    TimetableEntry,
)


MANAGEMENT_ROLES = {
    "OWNER",
    "SUPER_ADMIN",
    "PRINCIPAL",
    "VICE_PRINCIPAL",
}


def user_role(user):
    return str(
        getattr(user, "role", "") or ""
    ).upper()


def timetable_management_allowed(user):
    return bool(
        user
        and user.is_authenticated
        and (
            user.is_superuser
            or user_role(user) in MANAGEMENT_ROLES
        )
    )


def validation_error_response(exc):
    if hasattr(exc, "message_dict"):
        return Response(
            exc.message_dict,
            status=status.HTTP_400_BAD_REQUEST,
        )

    return Response(
        {"detail": exc.messages},
        status=status.HTTP_400_BAD_REQUEST,
    )


def serialize_period(period):
    return {
        "id": period.id,
        "name": period.name,
        "period_number": period.period_number,
        "start_time": period.start_time.strftime("%H:%M"),
        "end_time": period.end_time.strftime("%H:%M"),
        "is_teaching_period": period.is_teaching_period,
        "active": period.active,
    }


def serialize_entry(entry):
    assignment = entry.teacher_assignment

    return {
        "id": entry.id,

        "day": entry.day,
        "day_name": entry.get_day_display(),

        "period": {
            "id": entry.period.id,
            "name": entry.period.name,
            "period_number": entry.period.period_number,
            "start_time": entry.period.start_time.strftime(
                "%H:%M"
            ),
            "end_time": entry.period.end_time.strftime(
                "%H:%M"
            ),
        },

        "teacher_assignment": assignment.id,

        "teacher": {
            "id": assignment.teacher.id,
            "employee_id": assignment.teacher.employee_id,
            "full_name": assignment.teacher.full_name,
        },

        "class_section": {
            "id": assignment.class_section.id,
            "name": str(assignment.class_section),
            "grade": assignment.class_section.grade.name,
        },

        "subject": {
            "id": assignment.subject.id,
            "code": assignment.subject.code,
            "name": assignment.subject.name,
        },

        "academic_year": {
            "id": assignment.academic_year.id,
            "name": assignment.academic_year.name,
        },

        "term": {
            "id": assignment.term.id,
            "name": assignment.term.name,
        },

        "room": entry.room,
        "notes": entry.notes,
        "active": entry.active,
    }


class SchoolPeriodListView(APIView):
    permission_classes = [permissions.IsAuthenticated]

    def get(self, request):
        periods = SchoolPeriod.objects.filter(
            active=True
        ).order_by("period_number")

        return Response(
            [serialize_period(item) for item in periods]
        )


class TimetableEntryListCreateView(APIView):
    permission_classes = [permissions.IsAuthenticated]

    def get(self, request):
        if not timetable_management_allowed(request.user):
            return Response(
                {
                    "detail": (
                        "You are not authorized to manage "
                        "the school timetable."
                    )
                },
                status=status.HTTP_403_FORBIDDEN,
            )

        queryset = (
            TimetableEntry.objects
            .select_related(
                "period",
                "teacher_assignment",
                "teacher_assignment__teacher",
                "teacher_assignment__subject",
                "teacher_assignment__class_section",
                "teacher_assignment__class_section__grade",
                "teacher_assignment__academic_year",
                "teacher_assignment__term",
            )
            .filter(active=True)
        )

        academic_year = request.query_params.get(
            "academic_year"
        )

        term = request.query_params.get("term")

        teacher = request.query_params.get("teacher")

        class_section = request.query_params.get(
            "class_section"
        )

        day = request.query_params.get("day")

        if academic_year:
            queryset = queryset.filter(
                teacher_assignment__academic_year_id=(
                    academic_year
                )
            )

        if term:
            queryset = queryset.filter(
                teacher_assignment__term_id=term
            )

        if teacher:
            queryset = queryset.filter(
                teacher_assignment__teacher_id=teacher
            )

        if class_section:
            queryset = queryset.filter(
                teacher_assignment__class_section_id=(
                    class_section
                )
            )

        if day:
            queryset = queryset.filter(day=day)

        queryset = queryset.order_by(
            "day",
            "period__period_number",
            "teacher_assignment__class_section__grade__order",
        )

        return Response(
            [serialize_entry(item) for item in queryset]
        )

    def post(self, request):
        if not timetable_management_allowed(request.user):
            return Response(
                {
                    "detail": (
                        "You are not authorized to create "
                        "timetable entries."
                    )
                },
                status=status.HTTP_403_FORBIDDEN,
            )

        assignment_id = request.data.get(
            "teacher_assignment"
        )

        period_id = request.data.get("period")

        day = request.data.get("day")

        room = request.data.get("room", "")

        notes = request.data.get("notes", "")

        if not assignment_id:
            return Response(
                {
                    "teacher_assignment": (
                        "Teacher assignment is required."
                    )
                },
                status=status.HTTP_400_BAD_REQUEST,
            )

        if not period_id:
            return Response(
                {"period": "School period is required."},
                status=status.HTTP_400_BAD_REQUEST,
            )

        if not day:
            return Response(
                {"day": "Day is required."},
                status=status.HTTP_400_BAD_REQUEST,
            )

        try:
            assignment = (
                TeacherAssignment.objects
                .select_related(
                    "teacher",
                    "class_section",
                    "subject",
                    "academic_year",
                    "term",
                )
                .get(
                    pk=assignment_id,
                    active=True,
                )
            )
        except TeacherAssignment.DoesNotExist:
            return Response(
                {
                    "teacher_assignment": (
                        "The selected teacher assignment "
                        "does not exist or is inactive."
                    )
                },
                status=status.HTTP_400_BAD_REQUEST,
            )

        try:
            period = SchoolPeriod.objects.get(
                pk=period_id,
                active=True,
            )
        except SchoolPeriod.DoesNotExist:
            return Response(
                {
                    "period": (
                        "The selected school period "
                        "does not exist or is inactive."
                    )
                },
                status=status.HTTP_400_BAD_REQUEST,
            )

        valid_days = {
            choice[0]
            for choice in TimetableEntry.Day.choices
        }

        if day not in valid_days:
            return Response(
                {"day": "Invalid school day."},
                status=status.HTTP_400_BAD_REQUEST,
            )

        entry = TimetableEntry(
            teacher_assignment=assignment,
            day=day,
            period=period,
            room=room,
            notes=notes,
            active=True,
        )

        try:
            entry.save()
        except ValidationError as exc:
            return validation_error_response(exc)

        return Response(
            serialize_entry(entry),
            status=status.HTTP_201_CREATED,
        )


class TimetableEntryDetailView(APIView):
    permission_classes = [permissions.IsAuthenticated]

    def get_object(self, pk):
        try:
            return (
                TimetableEntry.objects
                .select_related(
                    "period",
                    "teacher_assignment",
                    "teacher_assignment__teacher",
                    "teacher_assignment__subject",
                    "teacher_assignment__class_section",
                    "teacher_assignment__class_section__grade",
                    "teacher_assignment__academic_year",
                    "teacher_assignment__term",
                )
                .get(pk=pk)
            )
        except TimetableEntry.DoesNotExist:
            return None

    def patch(self, request, pk):
        if not timetable_management_allowed(request.user):
            return Response(
                {"detail": "Access denied."},
                status=status.HTTP_403_FORBIDDEN,
            )

        entry = self.get_object(pk)

        if not entry:
            return Response(
                {"detail": "Timetable entry not found."},
                status=status.HTTP_404_NOT_FOUND,
            )

        if "teacher_assignment" in request.data:
            try:
                entry.teacher_assignment = (
                    TeacherAssignment.objects.get(
                        pk=request.data[
                            "teacher_assignment"
                        ],
                        active=True,
                    )
                )
            except TeacherAssignment.DoesNotExist:
                return Response(
                    {
                        "teacher_assignment": (
                            "Invalid teacher assignment."
                        )
                    },
                    status=status.HTTP_400_BAD_REQUEST,
                )

        if "period" in request.data:
            try:
                entry.period = SchoolPeriod.objects.get(
                    pk=request.data["period"],
                    active=True,
                )
            except SchoolPeriod.DoesNotExist:
                return Response(
                    {"period": "Invalid school period."},
                    status=status.HTTP_400_BAD_REQUEST,
                )

        if "day" in request.data:
            entry.day = request.data["day"]

        if "room" in request.data:
            entry.room = request.data["room"]

        if "notes" in request.data:
            entry.notes = request.data["notes"]

        if "active" in request.data:
            entry.active = bool(
                request.data["active"]
            )

        try:
            entry.save()
        except ValidationError as exc:
            return validation_error_response(exc)

        entry = self.get_object(pk)

        return Response(
            serialize_entry(entry)
        )

    def delete(self, request, pk):
        if not timetable_management_allowed(request.user):
            return Response(
                {"detail": "Access denied."},
                status=status.HTTP_403_FORBIDDEN,
            )

        entry = self.get_object(pk)

        if not entry:
            return Response(
                {"detail": "Timetable entry not found."},
                status=status.HTTP_404_NOT_FOUND,
            )

        entry.active = False
        entry.save()

        return Response(
            status=status.HTTP_204_NO_CONTENT
        )


class MyTimetableView(APIView):
    permission_classes = [permissions.IsAuthenticated]

    def get(self, request):
        employee = getattr(
            request.user,
            "employee",
            None,
        )

        if not employee:
            return Response(
                {
                    "detail": (
                        "This account is not linked to "
                        "an employee record."
                    )
                },
                status=status.HTTP_403_FORBIDDEN,
            )

        if not employee.is_teacher:
            return Response(
                {
                    "detail": (
                        "The linked employee is not "
                        "registered as a teacher."
                    )
                },
                status=status.HTTP_403_FORBIDDEN,
            )

        queryset = (
            TimetableEntry.objects
            .select_related(
                "period",
                "teacher_assignment",
                "teacher_assignment__teacher",
                "teacher_assignment__subject",
                "teacher_assignment__class_section",
                "teacher_assignment__class_section__grade",
                "teacher_assignment__academic_year",
                "teacher_assignment__term",
            )
            .filter(
                teacher_assignment__teacher=employee,
                teacher_assignment__active=True,
                active=True,
            )
        )

        academic_year = request.query_params.get(
            "academic_year"
        )

        term = request.query_params.get("term")

        if academic_year:
            queryset = queryset.filter(
                teacher_assignment__academic_year_id=(
                    academic_year
                )
            )

        if term:
            queryset = queryset.filter(
                teacher_assignment__term_id=term
            )

        queryset = queryset.order_by(
            "day",
            "period__period_number",
        )

        return Response(
            [serialize_entry(item) for item in queryset]
        )
