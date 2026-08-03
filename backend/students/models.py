from django.db import models
from accounts.models import User
from django.conf import settings

class Guardian(models.Model):
    user = models.OneToOneField(
        settings.AUTH_USER_MODEL,
        on_delete=models.SET_NULL,
        null=True,
        blank=True,
        related_name="guardian_profile",
    )

    name = models.CharField(max_length=150)

    relationship = models.CharField(
        max_length=50,
    )

    phone = models.CharField(max_length=20)

    email = models.EmailField(blank=True)

    address = models.TextField(blank=True)

    active = models.BooleanField(default=True)

    created_at = models.DateTimeField(
        auto_now_add=True,
    )

    updated_at = models.DateTimeField(
        auto_now=True,
    )

    def __str__(self):
        return self.name
class Student(models.Model):
    class Gender(models.TextChoices): MALE='M','Male'; FEMALE='F','Female'
    admission_number=models.CharField(max_length=30,unique=True,blank=True)
    user=models.OneToOneField(User,on_delete=models.SET_NULL,null=True,blank=True,related_name='student_profile')
    first_name=models.CharField(max_length=80); middle_name=models.CharField(max_length=80,blank=True); last_name=models.CharField(max_length=80)
    gender=models.CharField(max_length=1,choices=Gender.choices); date_of_birth=models.DateField(); phone=models.CharField(max_length=20,blank=True); email=models.EmailField(blank=True); address=models.TextField(); photo=models.ImageField(upload_to='students/',blank=True,null=True)
    guardian=models.ForeignKey(Guardian,on_delete=models.SET_NULL,null=True,blank=True,related_name='students')
    admission_date=models.DateField(); previous_school=models.CharField(max_length=200,blank=True); is_active=models.BooleanField(default=True); created_at=models.DateTimeField(auto_now_add=True)
    def save(self,*args,**kwargs):
        if not self.admission_number:
            year=self.admission_date.year; last=Student.objects.filter(admission_number__startswith=f'ATDMF/{year}/').order_by('id').last(); n=(last.id+1 if last else 1); self.admission_number=f'ATDMF/{year}/{n:04d}'
        super().save(*args,**kwargs)
    @property
    def full_name(self): return ' '.join(x for x in [self.first_name,self.middle_name,self.last_name] if x)
    def __str__(self): return f'{self.admission_number} - {self.full_name}'
