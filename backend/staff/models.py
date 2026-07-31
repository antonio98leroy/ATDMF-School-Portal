from django.db import models
from accounts.models import User
class Department(models.Model):
    name=models.CharField(max_length=120,unique=True); description=models.TextField(blank=True)
    def __str__(self): return self.name
class StaffMember(models.Model):
    class Type(models.TextChoices): TEACHER='TEACHER','Teacher'; ADMIN='ADMIN','Administrative Staff'; SUPPORT='SUPPORT','Support Staff'
    employee_id=models.CharField(max_length=30,unique=True); user=models.OneToOneField(User,on_delete=models.SET_NULL,null=True,blank=True); first_name=models.CharField(max_length=80); last_name=models.CharField(max_length=80); staff_type=models.CharField(max_length=20,choices=Type.choices); department=models.ForeignKey(Department,on_delete=models.SET_NULL,null=True,blank=True); phone=models.CharField(max_length=20); email=models.EmailField(blank=True); qualification=models.CharField(max_length=150,blank=True); hire_date=models.DateField(); active=models.BooleanField(default=True)
    @property
    def full_name(self): return f'{self.first_name} {self.last_name}'
    def __str__(self): return f'{self.employee_id} - {self.full_name}'
