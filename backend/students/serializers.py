from rest_framework import serializers
from .models import Student,Guardian
class GuardianSerializer(serializers.ModelSerializer):
    class Meta: model=Guardian; fields='__all__'
class StudentSerializer(serializers.ModelSerializer):
    full_name=serializers.CharField(read_only=True); guardian_detail=GuardianSerializer(source='guardian',read_only=True)
    class Meta: model=Student; fields='__all__'
