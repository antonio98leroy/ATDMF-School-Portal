from django.db import models
from django.db.models import Count
from django.utils import timezone
from rest_framework.decorators import action
from rest_framework.response import Response
from rest_framework.viewsets import ModelViewSet
from .models import HealthProfile, HealthAssessment, ClinicVisit, Referral, Medicine, MedicineDispense
from .permissions import ClinicAccessPermission
from .serializers import HealthProfileSerializer, HealthAssessmentSerializer, ClinicVisitSerializer, ReferralSerializer, MedicineSerializer, MedicineDispenseSerializer

class HealthProfileViewSet(ModelViewSet):
    queryset = HealthProfile.objects.select_related("student", "employee").all()
    serializer_class = HealthProfileSerializer
    permission_classes = [ClinicAccessPermission]
    def perform_create(self, serializer): serializer.save(updated_by=self.request.user)
    def perform_update(self, serializer): serializer.save(updated_by=self.request.user)

class HealthAssessmentViewSet(ModelViewSet):
    queryset = HealthAssessment.objects.select_related("profile", "profile__student", "profile__employee").all()
    serializer_class = HealthAssessmentSerializer
    permission_classes = [ClinicAccessPermission]
    def perform_create(self, serializer): serializer.save(created_by=self.request.user)

class ClinicVisitViewSet(ModelViewSet):
    queryset = ClinicVisit.objects.select_related("student", "employee", "clinic_staff").all()
    serializer_class = ClinicVisitSerializer
    permission_classes = [ClinicAccessPermission]
    def perform_create(self, serializer): serializer.save(clinic_staff=self.request.user)

    @action(detail=False, methods=["get"])
    def dashboard(self, request):
        today = timezone.localdate()
        month_start = today.replace(day=1)
        visits = ClinicVisit.objects.all()
        return Response({
            "visits_today": visits.filter(visit_date=today).count(),
            "student_visits_today": visits.filter(visit_date=today, patient_type="STUDENT").count(),
            "staff_visits_today": visits.filter(visit_date=today, patient_type="STAFF").count(),
            "referrals_this_month": Referral.objects.filter(referred_at__date__gte=month_start).count(),
            "follow_ups_pending": visits.filter(follow_up_date__gte=today).count(),
            "low_stock_medicines": Medicine.objects.filter(quantity_in_stock__lte=models.F("reorder_level"), active=True).count(),
            "monthly_reasons": list(visits.filter(visit_date__gte=month_start).values("reason").annotate(total=Count("id")).order_by("-total")),
        })

class ReferralViewSet(ModelViewSet):
    queryset = Referral.objects.select_related("visit", "visit__student", "visit__employee").all()
    serializer_class = ReferralSerializer
    permission_classes = [ClinicAccessPermission]

class MedicineViewSet(ModelViewSet):
    queryset = Medicine.objects.all().order_by("name")
    serializer_class = MedicineSerializer
    permission_classes = [ClinicAccessPermission]

class MedicineDispenseViewSet(ModelViewSet):
    queryset = MedicineDispense.objects.select_related("visit", "medicine", "dispensed_by").all()
    serializer_class = MedicineDispenseSerializer
    permission_classes = [ClinicAccessPermission]
    def perform_create(self, serializer): serializer.save(dispensed_by=self.request.user)
