from rest_framework import viewsets
from .models import StudentAttendance
from .serializers import AttendanceSerializer
class AttendanceViewSet(viewsets.ModelViewSet):
 queryset=StudentAttendance.objects.select_related('student','class_section','term').all(); serializer_class=AttendanceSerializer
 def perform_create(self,s): s.save(recorded_by=self.request.user)
