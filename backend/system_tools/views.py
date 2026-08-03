import os
import shutil
import subprocess
from pathlib import Path
from django.conf import settings
from django.db import connection
from django.http import FileResponse
from django.utils import timezone
from rest_framework.permissions import IsAuthenticated
from rest_framework.response import Response
from rest_framework.views import APIView

ALLOWED = {"OWNER", "SUPER_ADMIN", "DEVELOPER", "IT_ADMIN"}

def allowed(user):
    return bool(user and user.is_authenticated and (user.is_superuser or user.role in ALLOWED))

class HealthView(APIView):
    permission_classes = [IsAuthenticated]
    def get(self, request):
        if not allowed(request.user):
            return Response({"detail": "Forbidden"}, status=403)
        with connection.cursor() as cursor:
            cursor.execute("SELECT 1")
            database_ok = cursor.fetchone()[0] == 1
        root = Path(settings.BASE_DIR)
        usage = shutil.disk_usage(root)
        return Response({
            "status": "healthy" if database_ok else "degraded",
            "database": database_ok,
            "debug": settings.DEBUG,
            "django_version": __import__("django").get_version(),
            "disk_total_gb": round(usage.total / 1073741824, 2),
            "disk_free_gb": round(usage.free / 1073741824, 2),
            "time": timezone.now(),
        })

class BackupView(APIView):
    permission_classes = [IsAuthenticated]
    def get(self, request):
        if not allowed(request.user):
            return Response({"detail": "Forbidden"}, status=403)
        backup_dir = Path(settings.BASE_DIR).parent / "backups"
        backup_dir.mkdir(parents=True, exist_ok=True)
        files = [{"name": p.name, "size": p.stat().st_size, "created": timezone.datetime.fromtimestamp(p.stat().st_mtime, tz=timezone.get_current_timezone())} for p in sorted(backup_dir.glob("*.sql"), key=lambda p: p.stat().st_mtime, reverse=True)]
        return Response(files)

    def post(self, request):
        if not allowed(request.user):
            return Response({"detail": "Forbidden"}, status=403)
        db = settings.DATABASES["default"]
        if db.get("ENGINE") != "django.db.backends.mysql":
            return Response({"detail": "Automatic SQL backup currently supports MySQL."}, status=400)
        backup_dir = Path(settings.BASE_DIR).parent / "backups"
        backup_dir.mkdir(parents=True, exist_ok=True)
        filename = f"atdmf_{timezone.localtime().strftime('%Y%m%d_%H%M%S')}.sql"
        path = backup_dir / filename
        env = os.environ.copy()
        env["MYSQL_PWD"] = db.get("PASSWORD", "")
        command = ["mysqldump", "--no-tablespaces", "-h", db.get("HOST") or "localhost", "-P", str(db.get("PORT") or 3306), "-u", db.get("USER") or "root", db.get("NAME")]
        try:
            with path.open("wb") as output:
                subprocess.run(command, stdout=output, stderr=subprocess.PIPE, env=env, check=True)
        except Exception as exc:
            path.unlink(missing_ok=True)
            return Response({"detail": f"Backup failed: {exc}"}, status=500)
        return Response({"detail": "Backup created.", "name": filename, "size": path.stat().st_size}, status=201)
