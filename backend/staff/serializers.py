from rest_framework import serializers
from .models import Department,StaffMember
class DepartmentSerializer(serializers.ModelSerializer):
 class Meta: model=Department; fields='__all__'
class StaffSerializer(serializers.ModelSerializer):
 full_name=serializers.CharField(read_only=True); department_name=serializers.CharField(source='department.name',read_only=True)
 class Meta: model=StaffMember; fields='__all__'
