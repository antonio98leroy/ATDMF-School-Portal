from decimal import Decimal

from django.db.models import Count, Q, Sum
from django.utils import timezone

from rest_framework.permissions import IsAuthenticated
from rest_framework.response import Response
from rest_framework.views import APIView

from academics.models import (
    AcademicYear,
    ClassSection,
    Enrollment,
    StudentPromotion,
)
from attendance.models import (
    EmployeeAttendance,
    StudentAttendance,
)
from employees.models import Employee
from examinations.models import SubjectResult
from finance.models import (
    BankStatement,
    Expense,
    Payment,
    StudentInvoice,
    StudentSponsorship,
)
from students.models import Student


def field_exists(model, name):
    return any(
        field.name == name
        for field in model._meta.get_fields()
    )


def decimal_value(value):
    return float(value or Decimal("0.00"))


def full_name(instance):
    value = getattr(instance, "full_name", "")

    if callable(value):
        value = value()

    if value:
        return value

    return " ".join(
        str(getattr(instance, field, "") or "").strip()
        for field in (
            "first_name",
            "middle_name",
            "last_name",
        )
        if str(getattr(instance, field, "") or "").strip()
    )


def class_name(class_section):
    if not class_section:
        return ""

    grade = getattr(
        getattr(class_section, "grade", None),
        "name",
        "",
    )

    name = getattr(class_section, "name", "")

    return " ".join(
        item for item in [grade, name] if item
    )


class ReportsBaseView(APIView):
    permission_classes = [IsAuthenticated]

    def get_academic_year(self, request):
        year_id = request.query_params.get(
            "academic_year"
        )

        if year_id:
            return AcademicYear.objects.filter(
                pk=year_id
            ).first()

        return (
            AcademicYear.objects.filter(active=True)
            .order_by("-start_date")
            .first()
        )


class ReportsSummaryView(ReportsBaseView):
    def get(self, request):
        academic_year = self.get_academic_year(request)

        enrollments = Enrollment.objects.filter(active=True)

        if academic_year:
            enrollments = enrollments.filter(
                academic_year=academic_year
            )

        payments = Payment.objects.all()
        invoices = StudentInvoice.objects.all()
        expenses = Expense.objects.all()
        sponsorships = StudentSponsorship.objects.all()
        promotions = StudentPromotion.objects.all()

        if academic_year:
            if field_exists(
                StudentSponsorship,
                "academic_year",
            ):
                sponsorships = sponsorships.filter(
                    academic_year=academic_year
                )

            promotions = promotions.filter(
                source_academic_year=academic_year
            )

        def currency_totals(queryset, amount_field):
            totals = {}

            for currency in ("LRD", "USD"):
                totals[currency] = (
                    queryset.filter(
                        currency=currency
                    ).aggregate(
                        total=Sum(amount_field)
                    )["total"]
                    or Decimal("0.00")
                )

            return totals

        collected = currency_totals(
            payments,
            "amount",
        )

        invoiced = currency_totals(
            invoices,
            "total_amount",
        )

        expense_totals = currency_totals(
            expenses,
            "amount",
        )

        outstanding = {
            currency: max(
                invoiced[currency] - collected[currency],
                Decimal("0.00"),
            )
            for currency in ("LRD", "USD")
        }

        sponsored_ids = sponsorships.filter(
            funding_status__in=[
                "SPONSORED",
                "PARTIALLY_SPONSORED",
            ]
        ).values_list(
            "student_id",
            flat=True,
        )

        return Response(
            {
                "academic_year": (
                    {
                        "id": academic_year.id,
                        "name": academic_year.name,
                    }
                    if academic_year
                    else None
                ),
                "students": Student.objects.filter(
                    is_active=True
                ).count(),
                "active_enrollments": enrollments.count(),
                "classes": ClassSection.objects.count(),
                "employees": Employee.objects.count(),
                "sponsored": (
                    Student.objects.filter(
                        id__in=sponsored_ids,
                        is_active=True,
                    )
                    .distinct()
                    .count()
                ),
                "unsponsored": (
                    Student.objects.filter(
                        is_active=True
                    )
                    .exclude(id__in=sponsored_ids)
                    .count()
                ),
                "finance_by_currency": {
                    currency: {
                        "collected": decimal_value(
                            collected[currency]
                        ),
                        "invoiced": decimal_value(
                            invoiced[currency]
                        ),
                        "outstanding": decimal_value(
                            outstanding[currency]
                        ),
                        "expenses": decimal_value(
                            expense_totals[currency]
                        ),
                        "net": decimal_value(
                            collected[currency]
                            - expense_totals[currency]
                        ),
                    }
                    for currency in ("LRD", "USD")
                },
                "promotions": promotions.count(),
                "bank_statements": BankStatement.objects.count(),
            }
        )

class StudentRegisterReportView(
    ReportsBaseView
):
    def get(self, request):
        academic_year = self.get_academic_year(
            request
        )

        class_section = request.query_params.get(
            "class_section"
        )

        queryset = (
            Enrollment.objects.select_related(
                "student",
                "class_section",
                "class_section__grade",
                "academic_year",
            )
            .all()
        )

        if academic_year:
            queryset = queryset.filter(
                academic_year=academic_year
            )

        if class_section:
            queryset = queryset.filter(
                class_section_id=class_section
            )

        records = [
            {
                "enrollment_id": item.id,
                "student_id": item.student_id,
                "admission_number": (
                    item.student.admission_number
                ),
                "student_name": full_name(
                    item.student
                ),
                "gender": (
                    item.student.get_gender_display()
                ),
                "date_of_birth": (
                    item.student.date_of_birth
                ),
                "guardian_name": (
                    item.student.guardian.name
                    if item.student.guardian
                    else ""
                ),
                "guardian_phone": (
                    item.student.guardian.phone
                    if item.student.guardian
                    else ""
                ),
                "academic_year": (
                    item.academic_year.name
                ),
                "class_name": class_name(
                    item.class_section
                ),
                "roll_number": (
                    getattr(
                        item,
                        "roll_number",
                        "",
                    )
                    or ""
                ),
                "active": item.active,
            }
            for item in queryset.order_by(
                "class_section__grade__order",
                "class_section__name",
                "student__last_name",
                "student__first_name",
            )
        ]

        return Response(records)


class SponsorshipReportView(ReportsBaseView):
    def get(self, request):
        academic_year = self.get_academic_year(
            request
        )

        funding_status = (
            request.query_params.get(
                "funding_status"
            )
        )

        queryset = (
            StudentSponsorship.objects
            .select_related(
                "student",
                "sponsor",
                "academic_year",
            )
            .all()
        )

        if academic_year:
            queryset = queryset.filter(
                academic_year=academic_year
            )

        if funding_status:
            queryset = queryset.filter(
                funding_status=funding_status
            )

        records = [
            {
                "id": item.id,
                "admission_number": (
                    item.student.admission_number
                ),
                "student_name": full_name(
                    item.student
                ),
                "academic_year": (
                    item.academic_year.name
                ),
                "funding_status": (
                    item.get_funding_status_display()
                ),
                "sponsor": (
                    item.sponsor.name
                    if item.sponsor
                    else ""
                ),
                "coverage_type": (
                    item.get_coverage_type_display()
                    if hasattr(
                        item,
                        "get_coverage_type_display",
                    )
                    else getattr(
                        item,
                        "coverage_type",
                        "",
                    )
                ),
                "coverage_value": decimal_value(
                    getattr(
                        item,
                        "coverage_value",
                        0,
                    )
                ),
                "reference_number": (
                    getattr(
                        item,
                        "reference_number",
                        "",
                    )
                    or ""
                ),
                "active": getattr(
                    item,
                    "active",
                    True,
                ),
            }
            for item in queryset.order_by(
                "student__last_name",
                "student__first_name",
            )
        ]

        return Response(records)


class AttendanceReportView(ReportsBaseView):
    def get(self, request):
        attendance_type = (
            request.query_params.get(
                "type",
                "student",
            )
        )

        date_from = request.query_params.get(
            "date_from"
        )
        date_to = request.query_params.get(
            "date_to"
        )
        class_section = (
            request.query_params.get(
                "class_section"
            )
        )
        status_value = (
            request.query_params.get("status")
        )

        if attendance_type == "employee":
            queryset = (
                EmployeeAttendance.objects
                .select_related(
                    "employee",
                    "employee__department",
                    "employee__position",
                )
                .all()
            )

            if date_from:
                queryset = queryset.filter(
                    date__gte=date_from
                )

            if date_to:
                queryset = queryset.filter(
                    date__lte=date_to
                )

            if status_value:
                queryset = queryset.filter(
                    status=status_value
                )

            return Response(
                [
                    {
                        "id": item.id,
                        "date": item.date,
                        "employee_id": (
                            item.employee.employee_id
                        ),
                        "employee_name": full_name(
                            item.employee
                        ),
                        "department": (
                            item.employee.department.name
                            if item.employee.department
                            else ""
                        ),
                        "position": (
                            item.employee.position.name
                            if item.employee.position
                            else ""
                        ),
                        "status": (
                            item.get_status_display()
                        ),
                        "time_in": item.time_in,
                        "time_out": item.time_out,
                        "remarks": item.remarks,
                    }
                    for item in queryset.order_by(
                        "-date",
                        "employee__last_name",
                    )
                ]
            )

        queryset = (
            StudentAttendance.objects
            .select_related(
                "student",
                "class_section",
                "class_section__grade",
                "term",
                "term__academic_year",
            )
            .all()
        )

        academic_year = self.get_academic_year(
            request
        )

        if academic_year:
            queryset = queryset.filter(
                term__academic_year=academic_year
            )

        if class_section:
            queryset = queryset.filter(
                class_section_id=class_section
            )

        if date_from:
            queryset = queryset.filter(
                date__gte=date_from
            )

        if date_to:
            queryset = queryset.filter(
                date__lte=date_to
            )

        if status_value:
            queryset = queryset.filter(
                status=status_value
            )

        return Response(
            [
                {
                    "id": item.id,
                    "date": item.date,
                    "admission_number": (
                        item.student.admission_number
                    ),
                    "student_name": full_name(
                        item.student
                    ),
                    "class_name": class_name(
                        item.class_section
                    ),
                    "term": item.term.name,
                    "status": (
                        item.get_status_display()
                    ),
                    "time_in": item.time_in,
                    "remarks": item.remarks,
                }
                for item in queryset.order_by(
                    "-date",
                    "student__last_name",
                )
            ]
        )


class FinanceReportView(ReportsBaseView):
    def get(self, request):
        report_type = request.query_params.get(
            "type",
            "payments",
        )

        date_from = request.query_params.get(
            "date_from"
        )
        date_to = request.query_params.get(
            "date_to"
        )
        currency = request.query_params.get(
            "currency"
        )

        if report_type == "outstanding":
            queryset = (
                StudentInvoice.objects
                .select_related(
                    "student",
                    "term",
                    "term__academic_year",
                )
                .all()
            )

            if currency:
                queryset = queryset.filter(
                    currency=currency
                )

            records = []

            for invoice in queryset:
                balance = invoice.balance

                if callable(balance):
                    balance = balance()

                if Decimal(str(balance or 0)) <= 0:
                    continue

                records.append(
                    {
                        "invoice_number": invoice.invoice_number,
                        "admission_number": (
                            invoice.student.admission_number
                        ),
                        "student_name": full_name(
                            invoice.student
                        ),
                        "academic_year": (
                            invoice.term.academic_year.name
                        ),
                        "term": invoice.term.name,
                        "currency": invoice.currency,
                        "total_amount": decimal_value(
                            invoice.total_amount
                        ),
                        "paid_amount": decimal_value(
                            invoice.paid_amount
                        ),
                        "balance": decimal_value(
                            balance
                        ),
                        "due_date": invoice.due_date,
                    }
                )

            return Response(records)

        if report_type == "expenses":
            queryset = Expense.objects.all()

            if date_from:
                queryset = queryset.filter(
                    date__gte=date_from
                )

            if date_to:
                queryset = queryset.filter(
                    date__lte=date_to
                )

            if currency:
                queryset = queryset.filter(
                    currency=currency
                )

            return Response(
                [
                    {
                        "expense_number": getattr(
                            item,
                            "expense_number",
                            item.id,
                        ),
                        "category": getattr(
                            getattr(
                                item,
                                "category",
                                None,
                            ),
                            "name",
                            getattr(
                                item,
                                "category",
                                "",
                            ),
                        ),
                        "description": item.description,
                        "vendor": getattr(
                            item,
                            "vendor",
                            "",
                        ) or "",
                        "currency": item.currency,
                        "amount": decimal_value(
                            item.amount
                        ),
                        "date": item.date,
                        "approved": getattr(
                            item,
                            "approved",
                            True,
                        ),
                    }
                    for item in queryset.order_by("-date")
                ]
            )

        queryset = (
            Payment.objects.select_related(
                "invoice",
                "invoice__student",
            )
            .all()
        )

        if date_from:
            queryset = queryset.filter(
                paid_at__date__gte=date_from
            )

        if date_to:
            queryset = queryset.filter(
                paid_at__date__lte=date_to
            )

        if currency:
            queryset = queryset.filter(
                currency=currency
            )

        return Response(
            [
                {
                    "receipt_number": item.receipt_number,
                    "admission_number": (
                        item.invoice.student.admission_number
                    ),
                    "student_name": full_name(
                        item.invoice.student
                    ),
                    "invoice_number": (
                        item.invoice.invoice_number
                    ),
                    "currency": item.currency,
                    "amount": decimal_value(
                        item.amount
                    ),
                    "method": (
                        item.get_method_display()
                        if hasattr(
                            item,
                            "get_method_display",
                        )
                        else item.method
                    ),
                    "bank_slip_number": getattr(
                        item,
                        "bank_slip_number",
                        "",
                    ) or "",
                    "paid_at": item.paid_at,
                    "verified_against_statement": getattr(
                        item,
                        "verified_against_statement",
                        False,
                    ),
                }
                for item in queryset.order_by("-paid_at")
            ]
        )

class PromotionReportView(ReportsBaseView):
    def get(self, request):
        academic_year = self.get_academic_year(
            request
        )

        decision = request.query_params.get(
            "decision"
        )

        queryset = (
            StudentPromotion.objects
            .select_related(
                "student",
                "source_academic_year",
                "target_academic_year",
                "source_class",
                "target_class",
                "promoted_by",
            )
            .all()
        )

        if academic_year:
            queryset = queryset.filter(
                source_academic_year=academic_year
            )

        if decision:
            queryset = queryset.filter(
                decision=decision
            )

        return Response(
            [
                {
                    "id": item.id,
                    "admission_number": (
                        item.student.admission_number
                    ),
                    "student_name": full_name(
                        item.student
                    ),
                    "source_year": (
                        item.source_academic_year.name
                    ),
                    "source_class": class_name(
                        item.source_class
                    ),
                    "decision": (
                        item.get_decision_display()
                    ),
                    "target_year": (
                        item.target_academic_year.name
                    ),
                    "target_class": class_name(
                        item.target_class
                    ),
                    "yearly_average": decimal_value(
                        item.yearly_average
                    ),
                    "remarks": item.remarks,
                    "processed_at": (
                        item.processed_at
                    ),
                }
                for item in queryset.order_by(
                    "-processed_at"
                )
            ]
        )


class EmployeeReportView(ReportsBaseView):
    def get(self, request):
        queryset = (
            Employee.objects.select_related(
                "department",
                "position",
            )
            .all()
        )

        department = request.query_params.get(
            "department"
        )

        if department:
            queryset = queryset.filter(
                department_id=department
            )

        return Response(
            [
                {
                    "id": item.id,
                    "employee_id": (
                        item.employee_id
                    ),
                    "employee_name": full_name(
                        item
                    ),
                    "department": (
                        item.department.name
                        if item.department
                        else ""
                    ),
                    "position": (
                        item.position.name
                        if item.position
                        else ""
                    ),
                    "phone": getattr(
                        item,
                        "phone",
                        "",
                    ),
                    "email": getattr(
                        item,
                        "email",
                        "",
                    ),
                    "status": (
                        getattr(
                            item,
                            "status",
                            "",
                        )
                    ),
                    "active": getattr(
                        item,
                        "active",
                        True,
                    ),
                }
                for item in queryset.order_by(
                    "last_name",
                    "first_name",
                )
            ]
        )


class AcademicPerformanceReportView(
    ReportsBaseView
):
    def get(self, request):
        academic_year = self.get_academic_year(
            request
        )
        class_section = (
            request.query_params.get(
                "class_section"
            )
        )

        queryset = (
            SubjectResult.objects
            .select_related(
                "enrollment",
                "enrollment__student",
                "enrollment__academic_year",
                "enrollment__class_section",
                "enrollment__class_section__grade",
                "subject",
            )
            .filter(published=True)
        )

        if academic_year:
            queryset = queryset.filter(
                enrollment__academic_year=(
                    academic_year
                )
            )

        if class_section:
            queryset = queryset.filter(
                enrollment__class_section_id=(
                    class_section
                )
            )

        return Response(
            [
                {
                    "id": item.id,
                    "admission_number": (
                        item.enrollment.student
                        .admission_number
                    ),
                    "student_name": full_name(
                        item.enrollment.student
                    ),
                    "academic_year": (
                        item.enrollment
                        .academic_year.name
                    ),
                    "class_name": class_name(
                        item.enrollment
                        .class_section
                    ),
                    "subject": item.subject.name,
                    "yearly_average": decimal_value(
                        getattr(
                            item,
                            "yearly_average",
                            0,
                        )
                    ),
                    "grade": getattr(
                        item,
                        "grade",
                        "",
                    ),
                    "remark": getattr(
                        item,
                        "remark",
                        "",
                    ),
                }
                for item in queryset.order_by(
                    "enrollment__student__last_name",
                    "subject__name",
                )
            ]
        )