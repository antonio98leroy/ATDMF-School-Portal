from django.db.models import Avg, Count, Sum
from django.utils import timezone

from rest_framework import permissions
from rest_framework.response import Response
from rest_framework.views import APIView

from attendance.models import StudentAttendance
from communications.models import Notice
from employees.models import Employee
from examinations.models import SubjectResult
from finance.models import Payment, StudentInvoice
from students.models import Student
from teacher_assignments.models import TeacherAssignment

from .models import (
    AcademicYear,
    ClassSection,
    Enrollment,
    GradeLevel,
    StudentPromotion,
    Subject,
)


class PrincipalDashboardView(APIView):
    permission_classes = [
        permissions.IsAuthenticated,
    ]

    def get(self, request):
        active_year = (
            AcademicYear.objects
            .filter(active=True)
            .first()
        )

        students = Student.objects.filter(
            is_active=True
        )

        employees = Employee.objects.filter(
            active=True
        )

        teachers = employees.filter(
            is_teacher=True
        )

        enrollments = Enrollment.objects.filter(
            active=True
        )

        if active_year:
            enrollments = enrollments.filter(
                academic_year=active_year
            )

        today = timezone.localdate()

        attendance_today = (
            StudentAttendance.objects
            .filter(date=today)
        )

        attendance_summary = {
            "present": attendance_today.filter(
                status="P"
            ).count(),
            "absent": attendance_today.filter(
                status="A"
            ).count(),
            "late": attendance_today.filter(
                status="L"
            ).count(),
            "excused": attendance_today.filter(
                status="E"
            ).count(),
            "total": attendance_today.count(),
        }

        published_results = (
            SubjectResult.objects
            .filter(published=True)
        )

        if active_year:
            published_results = (
                published_results.filter(
                    enrollment__academic_year=active_year
                )
            )

        academic_average = (
            published_results.aggregate(
                average=Avg(
                    "semester_exam_score"
                )
            )["average"]
            or 0
        )

        invoice_queryset = (
            StudentInvoice.objects.all()
        )

        payment_queryset = Payment.objects.all()

        if active_year:
            invoice_queryset = (
                invoice_queryset.filter(
                    term__academic_year=active_year
                )
            )

            payment_queryset = (
                payment_queryset.filter(
                    invoice__term__academic_year=active_year
                )
            )

        invoiced_total = (
            invoice_queryset.aggregate(
                total=Sum("total_amount")
            )["total"]
            or 0
        )

        paid_total = (
            payment_queryset.aggregate(
                total=Sum("amount")
            )["total"]
            or 0
        )

        outstanding_total = (
            invoiced_total - paid_total
        )

        promotion_queryset = (
            StudentPromotion.objects.all()
        )

        if active_year:
            promotion_queryset = (
                promotion_queryset.filter(
                    target_academic_year=active_year
                )
            )

        promotion_summary = {
            "promoted": promotion_queryset.filter(
                decision="PROMOTED"
            ).count(),
            "repeated": promotion_queryset.filter(
                decision="REPEATED"
            ).count(),
            "graduated": promotion_queryset.filter(
                decision="GRADUATED"
            ).count(),
            "withdrawn": promotion_queryset.filter(
                decision="WITHDRAWN"
            ).count(),
        }

        class_distribution = (
            enrollments
            .values(
                "class_section__id",
                "class_section__name",
                "class_section__grade__name",
            )
            .annotate(
                student_count=Count("student")
            )
            .order_by(
                "class_section__grade__order",
                "class_section__name",
            )
        )

        gender_distribution = (
            students
            .values("gender")
            .annotate(total=Count("id"))
            .order_by("gender")
        )

        teacher_workload = (
            TeacherAssignment.objects
            .filter(active=True)
        )

        if active_year:
            teacher_workload = (
                teacher_workload.filter(
                    academic_year=active_year
                )
            )

        teacher_workload = (
            teacher_workload
            .values(
                "teacher__id",
                "teacher__employee_id",
                "teacher__first_name",
                "teacher__middle_name",
                "teacher__last_name",
            )
            .annotate(
                assignments=Count("id"),
                weekly_periods=Sum(
                    "weekly_periods"
                ),
                classes=Count(
                    "class_section",
                    distinct=True,
                ),
                subjects=Count(
                    "subject",
                    distinct=True,
                ),
            )
            .order_by(
                "-weekly_periods",
                "teacher__last_name",
            )[:10]
        )

        workload_records = []

        for item in teacher_workload:
            full_name = " ".join(
                name
                for name in [
                    item[
                        "teacher__first_name"
                    ],
                    item[
                        "teacher__middle_name"
                    ],
                    item[
                        "teacher__last_name"
                    ],
                ]
                if name
            )

            workload_records.append(
                {
                    "teacher_id": (
                        item["teacher__id"]
                    ),
                    "employee_id": (
                        item[
                            "teacher__employee_id"
                        ]
                    ),
                    "teacher_name": full_name,
                    "assignments": (
                        item["assignments"]
                    ),
                    "weekly_periods": (
                        item["weekly_periods"]
                        or 0
                    ),
                    "classes": item["classes"],
                    "subjects": item["subjects"],
                }
            )

        recent_notices = []

        try:
            notices = (
                Notice.objects
                .all()
                .order_by("-id")[:5]
            )

            for notice in notices:
                recent_notices.append(
                    {
                        "id": notice.id,
                        "title": getattr(
                            notice,
                            "title",
                            str(notice),
                        ),
                        "message": getattr(
                            notice,
                            "message",
                            "",
                        ),
                        "created_at": getattr(
                            notice,
                            "created_at",
                            None,
                        ),
                    }
                )
        except Exception:
            recent_notices = []

        return Response(
            {
                "active_academic_year": (
                    {
                        "id": active_year.id,
                        "name": active_year.name,
                    }
                    if active_year
                    else None
                ),

                "statistics": {
                    "students": students.count(),
                    "employees": employees.count(),
                    "teachers": teachers.count(),
                    "classes": (
                        ClassSection.objects
                        .count()
                    ),
                    "grades": (
                        GradeLevel.objects
                        .filter(active=True)
                        .count()
                    ),
                    "subjects": (
                        Subject.objects.count()
                    ),
                    "active_enrollments": (
                        enrollments.count()
                    ),
                    "published_results": (
                        published_results.count()
                    ),
                    "academic_average": round(
                        float(
                            academic_average
                        ),
                        2,
                    ),
                },

                "attendance_today": (
                    attendance_summary
                ),

                "finance": {
                    "invoiced": float(
                        invoiced_total
                    ),
                    "paid": float(paid_total),
                    "outstanding": float(
                        outstanding_total
                    ),
                },

                "promotions": promotion_summary,

                "class_distribution": list(
                    class_distribution
                ),

                "gender_distribution": list(
                    gender_distribution
                ),

                "teacher_workload": (
                    workload_records
                ),

                "recent_notices": (
                    recent_notices
                ),
            }
        )
