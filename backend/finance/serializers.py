from rest_framework import serializers
from .models import FeeType,FeeStructure,StudentInvoice,Payment,Expense
def make(m): return type(f'{m.__name__}Serializer',(serializers.ModelSerializer,),{'Meta':type('Meta',(),{'model':m,'fields':'__all__'})})
FeeTypeSerializer=make(FeeType); FeeStructureSerializer=make(FeeStructure); PaymentSerializer=make(Payment); ExpenseSerializer=make(Expense)
class InvoiceSerializer(serializers.ModelSerializer):
 paid_amount=serializers.DecimalField(max_digits=12,decimal_places=2,read_only=True); balance=serializers.DecimalField(max_digits=12,decimal_places=2,read_only=True); student_name=serializers.CharField(source='student.full_name',read_only=True)
 class Meta: model=StudentInvoice; fields='__all__'
