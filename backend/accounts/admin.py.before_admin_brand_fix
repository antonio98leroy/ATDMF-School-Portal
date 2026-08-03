from django.contrib import admin
from django.contrib.auth.admin import UserAdmin
from .models import User
@admin.register(User)
class CustomUserAdmin(UserAdmin):
    fieldsets=UserAdmin.fieldsets+(('School Portal',{'fields':('role','phone_number','profile_photo','is_first_login')}),)
    list_display=('username','first_name','last_name','email','role','is_active')
