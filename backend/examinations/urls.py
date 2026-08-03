from django.urls import include, path
from rest_framework.routers import DefaultRouter

from .views import (
    AssessmentViewSet,
    CBTOptionViewSet,
    CBTQuestionViewSet,
    GradeScaleViewSet,
    ResultPeriodViewSet,
    ScoreViewSet,
    SubjectResultViewSet,
)


router = DefaultRouter()

router.register(
    "assessments",
    AssessmentViewSet,
    basename="assessment",
)

router.register(
    "scores",
    ScoreViewSet,
    basename="score",
)

router.register(
    "grades",
    GradeScaleViewSet,
    basename="grade-scale",
)

router.register(
    "periods",
    ResultPeriodViewSet,
    basename="result-period",
)

router.register(
    "results",
    SubjectResultViewSet,
    basename="subject-result",
)

router.register(
    "questions",
    CBTQuestionViewSet,
    basename="cbt-question",
)

router.register(
    "options",
    CBTOptionViewSet,
    basename="cbt-option",
)


urlpatterns = [
    path("", include(router.urls)),
]