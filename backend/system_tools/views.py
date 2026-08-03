import os
import shutil
import subprocess
from pathlib import Path
from django.conf import settings
from django.contrib.sessions.models import Session
from django.db import connection
from django.http import FileResponse
from django.utils import timezone
from rest_framework.permissions import IsAuthenticated
from rest_framework.response import Response
from rest_framework.views import APIView
from audit.models import AuditLog

ALLOWED={"OWNER","SUPER_ADMIN","DEVELOPER","IT_ADMIN"}
def allowed(user):
    return bool(user and user.is_authenticated and (user.is_superuser or getattr(user,"role",None) in ALLOWED))
def denied(request):
    return None if allowed(request.user) else Response({"detail":"Forbidden"},status=403)
def backup_dir():
    p=Path(settings.BASE_DIR).parent/"backups";p.mkdir(parents=True,exist_ok=True);return p

class HealthView(APIView):
    permission_classes=[IsAuthenticated]
    def get(self,request):
        block=denied(request)
        if block:return block
        with connection.cursor() as cursor:
            cursor.execute("SELECT 1"); database_ok=cursor.fetchone()[0]==1
        usage=shutil.disk_usage(Path(settings.BASE_DIR))
        return Response({
            "status":"healthy" if database_ok else "degraded",
            "database":database_ok,
            "debug":settings.DEBUG,
            "django_version":__import__("django").get_version(),
            "python_version":__import__("sys").version.split()[0],
            "disk_total_gb":round(usage.total/1073741824,2),
            "disk_used_gb":round(usage.used/1073741824,2),
            "disk_free_gb":round(usage.free/1073741824,2),
            "active_sessions":Session.objects.filter(expire_date__gte=timezone.now()).count(),
            "audit_events_24h":AuditLog.objects.filter(created_at__gte=timezone.now()-timezone.timedelta(hours=24)).count(),
            "time":timezone.now(),
        })

class BackupView(APIView):
    permission_classes=[IsAuthenticated]
    def get(self,request):
        block=denied(request)
        if block:return block
        files=[]
        for p in sorted(backup_dir().glob("*"),key=lambda x:x.stat().st_mtime,reverse=True):
            if p.is_file(): files.append({"name":p.name,"size":p.stat().st_size,"created":timezone.datetime.fromtimestamp(p.stat().st_mtime,tz=timezone.get_current_timezone())})
        return Response(files)
    def post(self,request):
        block=denied(request)
        if block:return block
        db=settings.DATABASES["default"]
        if db.get("ENGINE")!="django.db.backends.mysql": return Response({"detail":"Automatic SQL backup currently supports MySQL."},status=400)
        filename=f"atdmf_{timezone.localtime().strftime('%Y%m%d_%H%M%S')}.sql";path=backup_dir()/filename
        env=os.environ.copy();env["MYSQL_PWD"]=db.get("PASSWORD","")
        command=["mysqldump","--no-tablespaces","-h",db.get("HOST") or "localhost","-P",str(db.get("PORT") or 3306),"-u",db.get("USER") or "root",db.get("NAME")]
        try:
            with path.open("wb") as output: subprocess.run(command,stdout=output,stderr=subprocess.PIPE,env=env,check=True)
        except subprocess.CalledProcessError as exc:
            path.unlink(missing_ok=True);detail=exc.stderr.decode(errors="replace") if exc.stderr else str(exc);return Response({"detail":f"Backup failed: {detail}"},status=500)
        AuditLog.objects.create(user=request.user,action="CREATE_BACKUP",model_name="System",object_id=filename,details={"size":path.stat().st_size},ip_address=request.META.get("REMOTE_ADDR"))
        return Response({"detail":"Backup created.","name":filename,"size":path.stat().st_size},status=201)

class BackupDownloadView(APIView):
    permission_classes=[IsAuthenticated]
    def get(self,request,filename):
        block=denied(request)
        if block:return block
        path=backup_dir()/Path(filename).name
        if not path.exists() or not path.is_file():return Response({"detail":"Backup not found."},status=404)
        return FileResponse(path.open("rb"),as_attachment=True,filename=path.name)

class SessionsView(APIView):
    permission_classes=[IsAuthenticated]
    def get(self,request):
        block=denied(request)
        if block:return block
        sessions=Session.objects.filter(expire_date__gte=timezone.now()).order_by("-expire_date")[:200]
        return Response([{"session_key":s.session_key,"expire_date":s.expire_date} for s in sessions])

class MaintenanceView(APIView):
    permission_classes=[IsAuthenticated]
    def get(self,request):
        block=denied(request)
        if block:return block
        from school_settings.models import SchoolSettings
        obj=SchoolSettings.load();return Response({"maintenance_mode":obj.maintenance_mode})
    def post(self,request):
        block=denied(request)
        if block:return block
        from school_settings.models import SchoolSettings
        obj=SchoolSettings.load();obj.maintenance_mode=bool(request.data.get("maintenance_mode"));obj.updated_by=request.user;obj.save()
        AuditLog.objects.create(user=request.user,action="UPDATE_MAINTENANCE_MODE",model_name="SchoolSettings",object_id=str(obj.pk),details={"maintenance_mode":obj.maintenance_mode},ip_address=request.META.get("REMOTE_ADDR"))
        return Response({"detail":"Maintenance mode updated.","maintenance_mode":obj.maintenance_mode})
