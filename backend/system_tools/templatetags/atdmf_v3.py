import shutil, sys
from django import template
from django.conf import settings
from django.contrib.sessions.models import Session
from django.db import connection
from django.db.models import Sum
from django.utils import timezone

register = template.Library()

def safe_count(model, **filters):
    try:
        return model.objects.filter(**filters).count()
    except Exception:
        try:
            return model.objects.count()
        except Exception:
            return 0

@register.simple_tag
def atdmf_v3_stats():
    from accounts.models import User
    from academics.models import ClassSection
    from attendance.models import StudentAttendance
    from employees.models import Employee
    from finance.models import Payment
    from school_settings.models import SchoolSettings
    from students.models import Student

    school = SchoolSettings.load()
    sf = {f.name for f in Student._meta.fields}
    ef = {f.name for f in Employee._meta.fields}

    try:
        revenue = Payment.objects.filter(currency="LRD").aggregate(total=Sum("amount")).get("total") or 0
    except Exception:
        revenue = 0

    absent = 0
    try:
        fields = {f.name for f in StudentAttendance._meta.fields}
        query = {}
        if "date" in fields:
            query["date"] = timezone.localdate()
        if "status" in fields:
            query["status__iexact"] = "ABSENT"
        absent = StudentAttendance.objects.filter(**query).count()
    except Exception:
        pass

    return {
        "students": safe_count(Student, **({"is_active": True} if "is_active" in sf else {})),
        "employees": safe_count(Employee, **({"active": True} if "active" in ef else {})),
        "classes": safe_count(ClassSection),
        "revenue_lrd": f"{revenue:,.2f}",
        "absent_today": absent,
        "active_users": User.objects.filter(is_active=True).count(),
        "academic_year": str(school.active_academic_year) if school.active_academic_year else "",
        "current_term": str(school.active_term) if school.active_term else "",
    }

@register.simple_tag
def atdmf_v3_activity(limit=8):
    try:
        from audit.models import AuditLog
        return AuditLog.objects.select_related("user").order_by("-created_at")[:limit]
    except Exception:
        return []

@register.simple_tag
def atdmf_v3_status():
    ok = False
    try:
        with connection.cursor() as cursor:
            cursor.execute("SELECT 1")
            ok = cursor.fetchone()[0] == 1
    except Exception:
        pass

    usage = shutil.disk_usage(settings.BASE_DIR)

    try:
        from audit.models import AuditLog
        events = AuditLog.objects.filter(
            created_at__gte=timezone.now() - timezone.timedelta(hours=24)
        ).count()
    except Exception:
        events = 0

    return {
        "database": ok,
        "disk_free_gb": round(usage.free / 1073741824, 2),
        "django_version": __import__("django").get_version(),
        "python_version": sys.version.split()[0],
        "active_sessions": Session.objects.filter(expire_date__gte=timezone.now()).count(),
        "audit_events_24h": events,
    }
