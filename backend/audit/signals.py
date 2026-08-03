from django.contrib.auth.signals import user_logged_in,user_logged_out
from django.db.models.signals import post_save,post_delete
from django.dispatch import receiver
from .context import get_current_request
from .models import AuditLog
TRACKED_APPS={"accounts","students","employees","staff","teacher_assignments","academics","attendance","examinations","finance","communications"}
def ip(request):
    if not request: return None
    forwarded=request.META.get("HTTP_X_FORWARDED_FOR")
    return forwarded.split(",")[0].strip() if forwarded else request.META.get("REMOTE_ADDR")
def user_from(request):
    user=getattr(request,"user",None) if request else None
    return user if user and user.is_authenticated else None
def log(action,instance=None,user=None,details=None,request=None):
    AuditLog.objects.create(user=user or user_from(request),action=action,model_name=(instance._meta.label if instance else "UserSession"),object_id=str(getattr(instance,"pk","") or ""),details=details or {},ip_address=ip(request))
@receiver(post_save,dispatch_uid="audit_save")
def saved(sender,instance,created,raw=False,**kwargs):
    if raw or isinstance(instance,AuditLog) or instance._meta.app_label not in TRACKED_APPS: return
    log("CREATE" if created else "UPDATE",instance=instance,request=get_current_request(),details={"display":str(instance)[:250]})
@receiver(post_delete,dispatch_uid="audit_delete")
def deleted(sender,instance,**kwargs):
    if isinstance(instance,AuditLog) or instance._meta.app_label not in TRACKED_APPS: return
    log("DELETE",instance=instance,request=get_current_request(),details={"display":str(instance)[:250]})
@receiver(user_logged_in,dispatch_uid="audit_login")
def logged_in(sender,request,user,**kwargs): log("LOGIN",user=user,request=request,details={"username":user.username})
@receiver(user_logged_out,dispatch_uid="audit_logout")
def logged_out(sender,request,user,**kwargs): log("LOGOUT",user=user,request=request,details={"username":getattr(user,"username","")})
