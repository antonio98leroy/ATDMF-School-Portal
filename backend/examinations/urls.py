from django.urls import include,path
from rest_framework.routers import DefaultRouter
from .views import *
r=DefaultRouter(); r.register('assessments',AssessmentViewSet); r.register('scores',ScoreViewSet); r.register('grades',GradeScaleViewSet); r.register('questions',CBTQuestionViewSet); r.register('options',CBTOptionViewSet)
urlpatterns=[path('',include(r.urls))]
