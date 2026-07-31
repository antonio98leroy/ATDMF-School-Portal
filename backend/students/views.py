from rest_framework import viewsets,filters
from .models import Student,Guardian
from .serializers import StudentSerializer,GuardianSerializer
class StudentViewSet(viewsets.ModelViewSet):
    queryset=Student.objects.select_related('guardian').all().order_by('-id'); serializer_class=StudentSerializer; filter_backends=[filters.SearchFilter]; search_fields=['admission_number','first_name','middle_name','last_name']
class GuardianViewSet(viewsets.ModelViewSet): queryset=Guardian.objects.all(); serializer_class=GuardianSerializer
