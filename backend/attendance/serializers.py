from rest_framework import serializers
from .models import StudentAttendance
class AttendanceSerializer(serializers.ModelSerializer):
 student_name=serializers.CharField(source='student.full_name',read_only=True)
 class Meta: model=StudentAttendance; fields='__all__'
