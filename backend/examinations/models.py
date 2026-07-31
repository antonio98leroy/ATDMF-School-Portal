from django.db import models
from students.models import Student
from academics.models import Subject,ClassSection,Term
class Assessment(models.Model):
    name=models.CharField(max_length=100); term=models.ForeignKey(Term,on_delete=models.CASCADE); class_section=models.ForeignKey(ClassSection,on_delete=models.CASCADE); subject=models.ForeignKey(Subject,on_delete=models.CASCADE); max_score=models.DecimalField(max_digits=6,decimal_places=2,default=100); date=models.DateField(); is_cbt=models.BooleanField(default=False)
class Score(models.Model):
    assessment=models.ForeignKey(Assessment,on_delete=models.CASCADE,related_name='scores'); student=models.ForeignKey(Student,on_delete=models.CASCADE); score=models.DecimalField(max_digits=6,decimal_places=2); remarks=models.CharField(max_length=200,blank=True)
    class Meta: unique_together=('assessment','student')
class GradeScale(models.Model):
    min_score=models.DecimalField(max_digits=5,decimal_places=2); max_score=models.DecimalField(max_digits=5,decimal_places=2); grade=models.CharField(max_length=3); remark=models.CharField(max_length=50)
class CBTQuestion(models.Model):
    assessment=models.ForeignKey(Assessment,on_delete=models.CASCADE,related_name='questions'); text=models.TextField(); marks=models.DecimalField(max_digits=5,decimal_places=2,default=1)
class CBTOption(models.Model):
    question=models.ForeignKey(CBTQuestion,on_delete=models.CASCADE,related_name='options'); text=models.CharField(max_length=255); is_correct=models.BooleanField(default=False)
