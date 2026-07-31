from django.contrib.auth.models import AbstractUser
from django.db import models
class User(AbstractUser):
    class Role(models.TextChoices):
        SUPER_ADMIN='SUPER_ADMIN','Super Administrator'; PRINCIPAL='PRINCIPAL','Principal'; VICE_PRINCIPAL='VICE_PRINCIPAL','Vice Principal'; REGISTRAR='REGISTRAR','Registrar'; ACCOUNTANT='ACCOUNTANT','Accountant'; TEACHER='TEACHER','Teacher'; STUDENT='STUDENT','Student'; PARENT='PARENT','Parent'; LIBRARIAN='LIBRARIAN','Librarian'; IT_ADMIN='IT_ADMIN','IT Administrator'
    role=models.CharField(max_length=30,choices=Role.choices,default=Role.STUDENT)
    phone_number=models.CharField(max_length=20,blank=True)
    profile_photo=models.ImageField(upload_to='profiles/',blank=True,null=True)
    is_first_login=models.BooleanField(default=True)
    def __str__(self): return f'{self.username} - {self.get_role_display()}'
