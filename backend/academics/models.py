from django.db import models
from students.models import Student
from staff.models import StaffMember
class AcademicYear(models.Model):
    name=models.CharField(max_length=20,unique=True); start_date=models.DateField(); end_date=models.DateField(); active=models.BooleanField(default=False)
    def __str__(self): return self.name
class Term(models.Model):
    academic_year=models.ForeignKey(AcademicYear,on_delete=models.CASCADE,related_name='terms'); name=models.CharField(max_length=40); start_date=models.DateField(); end_date=models.DateField(); active=models.BooleanField(default=False)
    def __str__(self): return f'{self.academic_year} - {self.name}'
class GradeLevel(models.Model):
    name=models.CharField(max_length=30,unique=True); order=models.PositiveIntegerField(default=1)
    def __str__(self): return self.name
class ClassSection(models.Model):
    grade=models.ForeignKey(GradeLevel,on_delete=models.CASCADE); name=models.CharField(max_length=30); class_teacher=models.ForeignKey(StaffMember,on_delete=models.SET_NULL,null=True,blank=True); capacity=models.PositiveIntegerField(default=40)
    class Meta: unique_together=('grade','name')
    def __str__(self): return f'{self.grade} {self.name}'
class Subject(models.Model):
    code=models.CharField(max_length=20,unique=True); name=models.CharField(max_length=100); description=models.TextField(blank=True)
    def __str__(self): return self.name
class Enrollment(models.Model):
    student=models.ForeignKey(Student,on_delete=models.CASCADE,related_name='enrollments'); class_section=models.ForeignKey(ClassSection,on_delete=models.CASCADE,related_name='enrollments'); academic_year=models.ForeignKey(AcademicYear,on_delete=models.CASCADE); roll_number=models.PositiveIntegerField(blank=True,null=True); active=models.BooleanField(default=True)
    class Meta: unique_together=('student','academic_year')
class SubjectAssignment(models.Model):
    subject=models.ForeignKey(Subject,on_delete=models.CASCADE); class_section=models.ForeignKey(ClassSection,on_delete=models.CASCADE); teacher=models.ForeignKey(StaffMember,on_delete=models.SET_NULL,null=True,blank=True); academic_year=models.ForeignKey(AcademicYear,on_delete=models.CASCADE)
    class Meta: unique_together=('subject','class_section','academic_year')
class TimetableEntry(models.Model):
    DAYS=[(i,n) for i,n in enumerate(['Monday','Tuesday','Wednesday','Thursday','Friday'],1)]
    class_section=models.ForeignKey(ClassSection,on_delete=models.CASCADE); subject=models.ForeignKey(Subject,on_delete=models.CASCADE); teacher=models.ForeignKey(StaffMember,on_delete=models.SET_NULL,null=True); day=models.PositiveSmallIntegerField(choices=DAYS); start_time=models.TimeField(); end_time=models.TimeField(); room=models.CharField(max_length=50,blank=True)
