from decimal import Decimal

from academics.models import (
    AcademicYear,
    ClassSection,
    Enrollment,
    StudentPromotion,
    Subject,
)

from students.models import Student
from employees.models import Employee

from finance.models import (
    Payment,
    StudentInvoice,
    Expense,
    StudentSponsorship,
)

from attendance.models import (
    StudentAttendance,
    EmployeeAttendance,
)

from communications.models import (
    Notice,
    Document,
)

from django.db.models import Sum
from django.utils import timezone


def money(value):
    return float(value or Decimal("0.00"))


def dashboard_data():
    today = timezone.now().date()

    academic_year = (
        AcademicYear.objects
        .filter(is_active=True)
        .first()
    )

    payments = Payment.objects.all()
    invoices = StudentInvoice.objects.all()
    expenses = Expense.objects.all()

    return {
        "school": {
            "academic_year":
                academic_year.name if academic_year else "",
        },

        "students": {
            "total":
                Student.objects.count(),

            "male":
                Student.objects.filter(
                    gender="M"
                ).count(),

            "female":
                Student.objects.filter(
                    gender="F"
                ).count(),

            "sponsored":
                StudentSponsorship.objects.filter(
                    funding_status="SPONSORED"
                ).count(),

            "unsponsored":
                Student.objects.count()
                -
                StudentSponsorship.objects.filter(
                    funding_status="SPONSORED"
                ).count(),
        },

        "employees": {
            "teachers":
                Employee.objects.filter(
                    employee_type="Teacher"
                ).count(),

            "employees":
                Employee.objects.count(),
        },

        "academics": {
            "classes":
                ClassSection.objects.count(),

            "subjects":
                Subject.objects.count(),

            "enrollments":
                Enrollment.objects.count(),

            "promotions":
                StudentPromotion.objects.count(),
        },

        "finance": {
            "lrd_collected":
                money(
                    payments.filter(
                        currency="LRD"
                    ).aggregate(
                        total=Sum("amount")
                    )["total"]
                ),

            "usd_collected":
                money(
                    payments.filter(
                        currency="USD"
                    ).aggregate(
                        total=Sum("amount")
                    )["total"]
                ),

            "lrd_outstanding":
                money(
                    invoices.filter(
                        currency="LRD"
                    ).aggregate(
                        total=Sum("total_amount")
                    )["total"]
                ),

            "usd_outstanding":
                money(
                    invoices.filter(
                        currency="USD"
                    ).aggregate(
                        total=Sum("total_amount")
                    )["total"]
                ),

            "expenses_lrd":
                money(
                    expenses.filter(
                        currency="LRD"
                    ).aggregate(
                        total=Sum("amount")
                    )["total"]
                ),

            "expenses_usd":
                money(
                    expenses.filter(
                        currency="USD"
                    ).aggregate(
                        total=Sum("amount")
                    )["total"]
                ),
        },

        "attendance": {
            "students_present":
                StudentAttendance.objects.filter(
                    date=today,
                    status="P",
                ).count(),

            "students_absent":
                StudentAttendance.objects.filter(
                    date=today,
                    status="A",
                ).count(),

            "teachers_present":
                EmployeeAttendance.objects.filter(
                    date=today,
                    status="P",
                ).count(),

            "teachers_absent":
                EmployeeAttendance.objects.filter(
                    date=today,
                    status="A",
                ).count(),
        },

        "communications": {
            "notices":
                Notice.objects.count(),

            "documents":
                Document.objects.count(),
        },
    }