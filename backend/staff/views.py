from rest_framework import viewsets
from .models import Department,StaffMember
from .serializers import DepartmentSerializer,StaffSerializer
class DepartmentViewSet(viewsets.ModelViewSet): queryset=Department.objects.all(); serializer_class=DepartmentSerializer
class StaffViewSet(viewsets.ModelViewSet): queryset=StaffMember.objects.select_related('department').all(); serializer_class=StaffSerializer
