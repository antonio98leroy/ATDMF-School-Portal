import shutil
import sys

from django import template
from django.conf import settings
from django.db import connection
from django.db.models import Sum

register = template.Library()


@register.simple_tag
def dashboard_stats():
    from academics.models import ClassSection
    from employees.models import Employee
    from finance.models import Payment
    from school_settings.models import SchoolSettings
    from students.models import Student

    school_settings = SchoolSettings.load()

    revenue_lrd = (
        Payment.objects
        .filter(currency="LRD")
        .aggregate(total=Sum("amount"))
        .get("total")
        or 0
    )

    return {
        "students": Student.objects.filter(
            is_active=True
        ).count(),
        "employees": Employee.objects.filter(
            active=True
        ).count(),
        "classes": ClassSection.objects.count(),
        "revenue_lrd": f"{revenue_lrd:,.2f}",
        "academic_year": (
            str(
                school_settings.active_academic_year
            )
            if school_settings.active_academic_year
            else ""
        ),
        "current_term": (
            str(
                school_settings.active_term
            )
            if school_settings.active_term
            else ""
        ),
    }


@register.simple_tag
def recent_audit_logs(limit=8):
    try:
        from audit.models import AuditLog

        return (
            AuditLog.objects
            .select_related("user")
            .order_by("-created_at")[:limit]
        )
    except Exception:
        return []


@register.simple_tag
def system_status():
    database_ok = False

    try:
        with connection.cursor() as cursor:
            cursor.execute("SELECT 1")
            database_ok = (
                cursor.fetchone()[0] == 1
            )
    except Exception:
        database_ok = False

    usage = shutil.disk_usage(
        settings.BASE_DIR
    )

    return {
        "database": database_ok,
        "disk_free_gb": round(
            usage.free / 1073741824,
            2,
        ),
        "django_version": __import__(
            "django"
        ).get_version(),
        "python_version": (
            sys.version.split()[0]
        ),
        "debug": settings.DEBUG,
    }
