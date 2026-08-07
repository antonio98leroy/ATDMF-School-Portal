from .teacher_grade_views import (
    TeacherAssessmentListCreateView,
    TeacherAssessmentStudentsView,
    TeacherAssessmentScoresView,
)

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

    path(
        "teacher/assessments/",
        TeacherAssessmentListCreateView.as_view(),
        name="teacher-assessments",
    ),
    path(
        "teacher/assessments/<int:assessment_id>/students/",
        TeacherAssessmentStudentsView.as_view(),
        name="teacher-assessment-students",
    ),
    path(
        "teacher/assessments/<int:assessment_id>/scores/",
        TeacherAssessmentScoresView.as_view(),
        name="teacher-assessment-scores",
    ),

    path("", include(router.urls)),
]