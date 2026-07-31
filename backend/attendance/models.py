from django.db import models
from students.models import Student
from academics.models import ClassSection,Term
class StudentAttendance(models.Model):
    STATUS=[('P','Present'),('A','Absent'),('L','Late'),('E','Excused')]
    student=models.ForeignKey(Student,on_delete=models.CASCADE); class_section=models.ForeignKey(ClassSection,on_delete=models.CASCADE); term=models.ForeignKey(Term,on_delete=models.CASCADE); date=models.DateField(); status=models.CharField(max_length=1,choices=STATUS); remarks=models.CharField(max_length=200,blank=True); recorded_by=models.ForeignKey('accounts.User',on_delete=models.SET_NULL,null=True)
    class Meta: unique_together=('student','date')
