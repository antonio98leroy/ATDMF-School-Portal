from django.db import models
class AuditLog(models.Model):
 user=models.ForeignKey('accounts.User',on_delete=models.SET_NULL,null=True); action=models.CharField(max_length=100); model_name=models.CharField(max_length=100); object_id=models.CharField(max_length=100,blank=True); details=models.JSONField(default=dict,blank=True); ip_address=models.GenericIPAddressField(null=True,blank=True); created_at=models.DateTimeField(auto_now_add=True)
 def __str__(self): return f'{self.user} {self.action} {self.model_name}'
