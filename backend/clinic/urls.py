from rest_framework.routers import DefaultRouter
from .views import HealthProfileViewSet, HealthAssessmentViewSet, ClinicVisitViewSet, ReferralViewSet, MedicineViewSet, MedicineDispenseViewSet

router = DefaultRouter()
router.register("profiles", HealthProfileViewSet, basename="clinic-profile")
router.register("assessments", HealthAssessmentViewSet, basename="clinic-assessment")
router.register("visits", ClinicVisitViewSet, basename="clinic-visit")
router.register("referrals", ReferralViewSet, basename="clinic-referral")
router.register("medicines", MedicineViewSet, basename="clinic-medicine")
router.register("dispenses", MedicineDispenseViewSet, basename="clinic-dispense")
urlpatterns = router.urls
