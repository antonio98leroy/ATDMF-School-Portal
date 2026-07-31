from decimal import Decimal
from django.db import models
from students.models import Student
from academics.models import AcademicYear,Term,GradeLevel
class FeeType(models.Model):
 name=models.CharField(max_length=100,unique=True); description=models.TextField(blank=True)
 def __str__(self): return self.name
class FeeStructure(models.Model):
 fee_type=models.ForeignKey(FeeType,on_delete=models.CASCADE); grade=models.ForeignKey(GradeLevel,on_delete=models.CASCADE); academic_year=models.ForeignKey(AcademicYear,on_delete=models.CASCADE); term=models.ForeignKey(Term,on_delete=models.CASCADE); amount=models.DecimalField(max_digits=12,decimal_places=2)
class StudentInvoice(models.Model):
 student=models.ForeignKey(Student,on_delete=models.CASCADE,related_name='invoices'); term=models.ForeignKey(Term,on_delete=models.CASCADE); invoice_number=models.CharField(max_length=40,unique=True); total_amount=models.DecimalField(max_digits=12,decimal_places=2); due_date=models.DateField(); created_at=models.DateTimeField(auto_now_add=True)
 @property
 def paid_amount(self): return sum((p.amount for p in self.payments.all()),Decimal('0'))
 @property
 def balance(self): return self.total_amount-self.paid_amount
class Payment(models.Model):
 invoice=models.ForeignKey(StudentInvoice,on_delete=models.CASCADE,related_name='payments'); receipt_number=models.CharField(max_length=40,unique=True); amount=models.DecimalField(max_digits=12,decimal_places=2); method=models.CharField(max_length=30,default='Cash'); reference=models.CharField(max_length=100,blank=True); paid_at=models.DateTimeField(auto_now_add=True); received_by=models.ForeignKey('accounts.User',on_delete=models.SET_NULL,null=True)
class Expense(models.Model):
 category=models.CharField(max_length=100); description=models.TextField(); amount=models.DecimalField(max_digits=12,decimal_places=2); date=models.DateField(); recorded_by=models.ForeignKey('accounts.User',on_delete=models.SET_NULL,null=True)
