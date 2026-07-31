from django.urls import include,path
from rest_framework.routers import DefaultRouter
from .views import *
r=DefaultRouter(); r.register('fee-types',FeeTypeViewSet); r.register('structures',FeeStructureViewSet); r.register('invoices',InvoiceViewSet); r.register('payments',PaymentViewSet); r.register('expenses',ExpenseViewSet)
urlpatterns=[path('',include(r.urls))]
