from django.contrib import admin
from .models import *
admin.site.register([FeeType,FeeStructure,StudentInvoice,Payment,Expense])
