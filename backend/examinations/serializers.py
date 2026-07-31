from rest_framework import serializers
from .models import Assessment,Score,GradeScale,CBTQuestion,CBTOption
def make(m): return type(f'{m.__name__}Serializer',(serializers.ModelSerializer,),{'Meta':type('Meta',(),{'model':m,'fields':'__all__'})})
AssessmentSerializer=make(Assessment); ScoreSerializer=make(Score); GradeScaleSerializer=make(GradeScale); CBTQuestionSerializer=make(CBTQuestion); CBTOptionSerializer=make(CBTOption)
