from rest_framework import viewsets
from .models import *
from .serializers import *
def v(m,s): return type(f'{m.__name__}ViewSet',(viewsets.ModelViewSet,),{'queryset':m.objects.all(),'serializer_class':s})
AssessmentViewSet=v(Assessment,AssessmentSerializer); ScoreViewSet=v(Score,ScoreSerializer); GradeScaleViewSet=v(GradeScale,GradeScaleSerializer); CBTQuestionViewSet=v(CBTQuestion,CBTQuestionSerializer); CBTOptionViewSet=v(CBTOption,CBTOptionSerializer)
