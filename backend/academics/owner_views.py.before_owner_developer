from datetime import timedelta
from decimal import Decimal

from django.db.models import Count, Q, Sum
from django.db.models.functions import TruncMonth
from django.utils import timezone
from rest_framework import permissions
from rest_framework.response import Response
from rest_framework.views import APIView

from accounts.models import User
from academics.models import AcademicYear, ClassSection, Enrollment, StudentPromotion, Subject, Term
from attendance.models import StudentAttendance
from communications.models import Notice
from employees.models import Employee
from finance.models import BankDeposit, BankStatement, Expense, Payment, StudentInvoice, StudentSponsorship
from students.models import Guardian, Student


def number(value):
    return float(value or Decimal("0.00"))


def has_field(model, name):
    return any(field.name == name for field in model._meta.get_fields())


class IsExecutiveUser(permissions.BasePermission):
    message = "Only the school owner, super administrator, or principal can access this dashboard."

    def has_permission(self, request, view):
        role = str(getattr(request.user, "role", "") or "").upper()
        return bool(
            request.user
            and request.user.is_authenticated
            and (
                request.user.is_superuser
                or role in {"SUPER_ADMIN", "OWNER", "PRINCIPAL"}
            )
        )


class OwnerDashboardView(APIView):
    permission_classes = [permissions.IsAuthenticated, IsExecutiveUser]

    def get(self, request):
        today = timezone.localdate()
        now = timezone.now()
        start_date = today - timedelta(days=365)

        active_year = AcademicYear.objects.filter(active=True).order_by("-start_date").first()
        active_term = None
        if active_year:
            active_term = (
                Term.objects.filter(
                    academic_year=active_year,
                    start_date__lte=today,
                    end_date__gte=today,
                ).order_by("start_date").first()
                or Term.objects.filter(academic_year=active_year).order_by("start_date").first()
            )

        students = Student.objects.filter(is_active=True)
        enrollments = Enrollment.objects.filter(active=True)
        if active_year:
            enrollments = enrollments.filter(academic_year=active_year)

        employees = Employee.objects.all()
        if has_field(Employee, "active"):
            employees = employees.filter(active=True)

        teacher_count = employees.filter(
            Q(position__name__icontains="teacher")
            | Q(user_account__role="TEACHER")
        ).distinct().count()

        sponsorships = StudentSponsorship.objects.all()
        if has_field(StudentSponsorship, "active"):
            sponsorships = sponsorships.filter(active=True)
        if active_year and has_field(StudentSponsorship, "academic_year"):
            sponsorships = sponsorships.filter(academic_year=active_year)

        sponsored_ids = sponsorships.filter(
            funding_status__in=["SPONSORED", "PARTIALLY_SPONSORED"]
        ).values_list("student_id", flat=True)

        collected = Payment.objects.aggregate(total=Sum("amount"))["total"] or Decimal("0.00")
        invoiced = StudentInvoice.objects.aggregate(total=Sum("total_amount"))["total"] or Decimal("0.00")
        outstanding = max(invoiced - collected, Decimal("0.00"))

        expenses_qs = Expense.objects.all()
        if has_field(Expense, "approved"):
            expenses_qs = expenses_qs.filter(approved=True)
        expenses = expenses_qs.aggregate(total=Sum("amount"))["total"] or Decimal("0.00")

        pending_deposits = BankDeposit.objects.all()
        if has_field(BankDeposit, "verification_status"):
            pending_deposits = pending_deposits.filter(verification_status="PENDING")

        today_records = StudentAttendance.objects.filter(date=today)
        attendance_counts = {
            row["status"]: row["total"]
            for row in today_records.values("status").annotate(total=Count("id"))
        }
        attendance_total = sum(attendance_counts.values())
        present = attendance_counts.get("P", 0)
        late = attendance_counts.get("L", 0)
        attendance_rate = round(((present + late) / attendance_total) * 100, 2) if attendance_total else 0

        promotions = StudentPromotion.objects.all()
        if active_year:
            promotions = promotions.filter(source_academic_year=active_year)
        promotion_total = promotions.count()
        promoted = promotions.filter(decision="PROMOTED").count()

        monthly_income = {
            row["month"].strftime("%Y-%m"): number(row["total"])
            for row in (
                Payment.objects.filter(paid_at__date__gte=start_date)
                .annotate(month=TruncMonth("paid_at"))
                .values("month")
                .annotate(total=Sum("amount"))
                .order_by("month")
            )
        }
        monthly_expenses = {
            row["month"].strftime("%Y-%m"): number(row["total"])
            for row in (
                expenses_qs.filter(date__gte=start_date)
                .annotate(month=TruncMonth("date"))
                .values("month")
                .annotate(total=Sum("amount"))
                .order_by("month")
            )
        }
        months = sorted(set(monthly_income) | set(monthly_expenses))

        enrollment_trend = [
            {"month": row["month"].strftime("%Y-%m"), "total": row["total"]}
            for row in (
                Enrollment.objects.filter(created_at__date__gte=start_date)
                .annotate(month=TruncMonth("created_at"))
                .values("month")
                .annotate(total=Count("id"))
                .order_by("month")
            )
            if row["month"]
        ]

        recent_students = [
            {
                "id": item.id,
                "admission_number": item.admission_number,
                "full_name": item.full_name,
                "admission_date": item.admission_date,
            }
            for item in Student.objects.order_by("-created_at")[:8]
        ]

        recent_payments = [
            {
                "id": item.id,
                "receipt_number": item.receipt_number,
                "student_name": item.invoice.student.full_name,
                "amount": number(item.amount),
                "paid_at": item.paid_at,
            }
            for item in (
                Payment.objects.select_related("invoice", "invoice__student")
                .order_by("-paid_at")[:8]
            )
        ]

        recent_notices = [
            {
                "id": item.id,
                "title": item.title,
                "priority": item.priority,
                "published_at": item.published_at or item.created_at,
            }
            for item in (
                Notice.objects.filter(status="PUBLISHED", published=True)
                .filter(Q(expires_at__isnull=True) | Q(expires_at__gt=now))
                .order_by("-pinned", "-published_at", "-created_at")[:8]
            )
        ]

        return Response({
            "generated_at": now,
            "academic_context": {
                "academic_year": {"id": active_year.id, "name": active_year.name} if active_year else None,
                "term": {"id": active_term.id, "name": active_term.name} if active_term else None,
            },
            "school": {
                "students": students.count(),
                "enrollments": enrollments.count(),
                "guardians": Guardian.objects.filter(active=True).count(),
                "employees": employees.count(),
                "teachers": teacher_count,
                "classes": ClassSection.objects.count(),
                "subjects": Subject.objects.count(),
                "portal_users": User.objects.filter(is_active=True).count(),
            },
            "sponsorship": {
                "sponsored": students.filter(id__in=sponsored_ids).distinct().count(),
                "fully_sponsored": sponsorships.filter(funding_status="SPONSORED").values("student_id").distinct().count(),
                "partially_sponsored": sponsorships.filter(funding_status="PARTIALLY_SPONSORED").values("student_id").distinct().count(),
                "unsponsored": students.exclude(id__in=sponsored_ids).count(),
            },
            "finance": {
                "total_invoiced": number(invoiced),
                "collected": number(collected),
                "outstanding": number(outstanding),
                "expenses": number(expenses),
                "net_balance": number(collected - expenses),
                "today_collection": number(
                    Payment.objects.filter(paid_at__date=today).aggregate(total=Sum("amount"))["total"]
                ),
                "month_collection": number(
                    Payment.objects.filter(
                        paid_at__year=today.year,
                        paid_at__month=today.month,
                    ).aggregate(total=Sum("amount"))["total"]
                ),
                "pending_bank_amount": number(pending_deposits.aggregate(total=Sum("amount"))["total"]),
                "pending_deposits": pending_deposits.count(),
                "bank_statements": BankStatement.objects.count(),
                "reconciled_statements": BankStatement.objects.filter(status="RECONCILED").count(),
                "statement_review_required": BankStatement.objects.filter(status="REVIEW_REQUIRED").count(),
            },
            "attendance": {
                "date": today,
                "total": attendance_total,
                "present": present,
                "absent": attendance_counts.get("A", 0),
                "late": late,
                "excused": attendance_counts.get("E", 0),
                "sick": attendance_counts.get("S", 0),
                "rate": attendance_rate,
            },
            "academics": {
                "promotions_processed": promotion_total,
                "promoted": promoted,
                "promotion_rate": round(promoted / promotion_total * 100, 2) if promotion_total else 0,
            },
            "charts": {
                "monthly_finance": [
                    {
                        "month": month,
                        "income": monthly_income.get(month, 0),
                        "expenses": monthly_expenses.get(month, 0),
                    }
                    for month in months
                ],
                "enrollment_trend": enrollment_trend,
                "gender_distribution": [
                    {
                        "gender": "Male" if row["gender"] == "M" else "Female",
                        "total": row["total"],
                    }
                    for row in students.values("gender").annotate(total=Count("id")).order_by("gender")
                ],
                "students_by_grade": [
                    {
                        "grade": row["class_section__grade__name"],
                        "total": row["total"],
                    }
                    for row in (
                        enrollments.values("class_section__grade__name")
                        .annotate(total=Count("id"))
                        .order_by("class_section__grade__name")
                    )
                ],
            },
            "recent": {
                "students": recent_students,
                "payments": recent_payments,
                "notices": recent_notices,
            },
        })