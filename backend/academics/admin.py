from django.contrib import admin
from .models import *
admin.site.register([AcademicYear,Term,GradeLevel,ClassSection,Subject,Enrollment,SubjectAssignment,TimetableEntry])
