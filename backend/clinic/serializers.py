from rest_framework import serializers
from .models import HealthProfile, HealthAssessment, ClinicVisit, Referral, Medicine, MedicineDispense

class HealthProfileSerializer(serializers.ModelSerializer):
    patient_name = serializers.CharField(read_only=True)
    class Meta:
        model = HealthProfile
        fields = "__all__"
        read_only_fields = ["updated_by", "created_at", "updated_at"]

class HealthAssessmentSerializer(serializers.ModelSerializer):
    patient_name = serializers.CharField(source="profile.patient_name", read_only=True)
    class Meta:
        model = HealthAssessment
        fields = "__all__"
        read_only_fields = ["created_by", "created_at"]

class ClinicVisitSerializer(serializers.ModelSerializer):
    patient_name = serializers.CharField(read_only=True)
    reason_display = serializers.CharField(source="get_reason_display", read_only=True)
    outcome_display = serializers.CharField(source="get_outcome_display", read_only=True)
    class Meta:
        model = ClinicVisit
        fields = "__all__"
        read_only_fields = ["clinic_staff", "created_at", "updated_at"]

class ReferralSerializer(serializers.ModelSerializer):
    patient_name = serializers.CharField(source="visit.patient_name", read_only=True)
    class Meta:
        model = Referral
        fields = "__all__"

class MedicineSerializer(serializers.ModelSerializer):
    low_stock = serializers.BooleanField(read_only=True)
    class Meta:
        model = Medicine
        fields = "__all__"

class MedicineDispenseSerializer(serializers.ModelSerializer):
    patient_name = serializers.CharField(source="visit.patient_name", read_only=True)
    medicine_name = serializers.CharField(source="medicine.name", read_only=True)
    class Meta:
        model = MedicineDispense
        fields = "__all__"
        read_only_fields = ["dispensed_by", "dispensed_at"]
