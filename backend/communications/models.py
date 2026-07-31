from django.db import models
class Notice(models.Model):
    AUDIENCE=[('ALL','All'),('STAFF','Staff'),('STUDENTS','Students'),('PARENTS','Parents')]
    title=models.CharField(max_length=200); body=models.TextField(); audience=models.CharField(max_length=20,choices=AUDIENCE,default='ALL'); published=models.BooleanField(default=True); expires_at=models.DateTimeField(null=True,blank=True); created_by=models.ForeignKey('accounts.User',on_delete=models.SET_NULL,null=True); created_at=models.DateTimeField(auto_now_add=True)
class Document(models.Model):
    title=models.CharField(max_length=200); category=models.CharField(max_length=100); file=models.FileField(upload_to='documents/'); uploaded_by=models.ForeignKey('accounts.User',on_delete=models.SET_NULL,null=True); uploaded_at=models.DateTimeField(auto_now_add=True)
