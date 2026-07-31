from django.contrib import admin
from .models import *
admin.site.register([Assessment,Score,GradeScale,CBTQuestion,CBTOption])
