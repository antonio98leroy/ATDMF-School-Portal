from rest_framework import serializers
from .models import AcademicYear,Term,GradeLevel,ClassSection,Subject,Enrollment,SubjectAssignment,TimetableEntry
class GenericModelSerializer(serializers.ModelSerializer): pass
def make(model): return type(f'{model.__name__}Serializer',(serializers.ModelSerializer,),{'Meta':type('Meta',(),{'model':model,'fields':'__all__'})})
AcademicYearSerializer=make(AcademicYear); TermSerializer=make(Term); GradeLevelSerializer=make(GradeLevel); ClassSectionSerializer=make(ClassSection); SubjectSerializer=make(Subject); EnrollmentSerializer=make(Enrollment); SubjectAssignmentSerializer=make(SubjectAssignment); TimetableEntrySerializer=make(TimetableEntry)
