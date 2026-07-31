from rest_framework import viewsets
from rest_framework.views import APIView
from rest_framework.response import Response
from students.models import Student
from staff.models import StaffMember
from finance.models import Payment,StudentInvoice
from .models import AcademicYear,Term,GradeLevel,ClassSection,Subject,Enrollment,SubjectAssignment,TimetableEntry
from .serializers import *
def view(model,serializer): return type(f'{model.__name__}ViewSet',(viewsets.ModelViewSet,),{'queryset':model.objects.all(),'serializer_class':serializer})
AcademicYearViewSet=view(AcademicYear,AcademicYearSerializer); TermViewSet=view(Term,TermSerializer); GradeLevelViewSet=view(GradeLevel,GradeLevelSerializer); ClassSectionViewSet=view(ClassSection,ClassSectionSerializer); SubjectViewSet=view(Subject,SubjectSerializer); EnrollmentViewSet=view(Enrollment,EnrollmentSerializer); SubjectAssignmentViewSet=view(SubjectAssignment,SubjectAssignmentSerializer); TimetableEntryViewSet=view(TimetableEntry,TimetableEntrySerializer)
class DashboardView(APIView):
 def get(self,request):
  return Response({'students':Student.objects.filter(is_active=True).count(),'staff':StaffMember.objects.filter(active=True).count(),'classes':ClassSection.objects.count(),'subjects':Subject.objects.count(),'payments':float(sum(x.amount for x in Payment.objects.all())),'outstanding':float(sum(x.balance for x in StudentInvoice.objects.all()))})
