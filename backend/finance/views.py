from rest_framework import viewsets
from .models import *
from .serializers import *
def v(m,s): return type(f'{m.__name__}ViewSet',(viewsets.ModelViewSet,),{'queryset':m.objects.all(),'serializer_class':s})
FeeTypeViewSet=v(FeeType,FeeTypeSerializer); FeeStructureViewSet=v(FeeStructure,FeeStructureSerializer); InvoiceViewSet=v(StudentInvoice,InvoiceSerializer); ExpenseViewSet=v(Expense,ExpenseSerializer)
class PaymentViewSet(viewsets.ModelViewSet):
 queryset=Payment.objects.all(); serializer_class=PaymentSerializer
 def perform_create(self,s): s.save(received_by=self.request.user)
