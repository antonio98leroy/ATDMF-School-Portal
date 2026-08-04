from django.contrib import admin
from .models import HealthProfile, HealthAssessment, ClinicVisit, Referral, Medicine, MedicineDispense

@admin.register(HealthProfile)
class HealthProfileAdmin(admin.ModelAdmin):
    list_display = ("patient_name", "patient_type", "blood_group", "genotype", "allergies_present", "updated_at")
    list_filter = ("patient_type", "asthma", "allergies_present", "diabetes", "seizure_disorder", "heart_condition")
    search_fields = ("student__first_name", "student__last_name", "employee__first_name", "employee__last_name", "emergency_contact_name", "emergency_contact_phone")

@admin.register(HealthAssessment)
class HealthAssessmentAdmin(admin.ModelAdmin):
    list_display = ("profile", "examination_date", "participation_status", "provider_name")
    list_filter = ("examination_date", "participation_status", "vision_referred", "hearing_referred")
    date_hierarchy = "examination_date"

class DispenseInline(admin.TabularInline):
    model = MedicineDispense
    extra = 0

class ReferralInline(admin.StackedInline):
    model = Referral
    extra = 0
    max_num = 1

@admin.register(ClinicVisit)
class ClinicVisitAdmin(admin.ModelAdmin):
    list_display = ("patient_name", "patient_type", "visit_date", "time_in", "reason", "outcome", "parent_guardian_contacted", "clinic_staff")
    list_filter = ("patient_type", "visit_date", "reason", "outcome", "parent_guardian_contacted", "confidential")
    search_fields = ("student__first_name", "student__last_name", "employee__first_name", "employee__last_name", "symptoms_or_complaint", "assessment_findings", "test_result")
    date_hierarchy = "visit_date"
    inlines = [DispenseInline, ReferralInline]

@admin.register(Medicine)
class MedicineAdmin(admin.ModelAdmin):
    list_display = ("name", "strength", "dosage_form", "quantity_in_stock", "reorder_level", "low_stock", "batch_number", "expiry_date", "active")
    list_filter = ("active", "dosage_form", "expiry_date")
    search_fields = ("name", "strength", "batch_number")

admin.site.register(MedicineDispense)
admin.site.register(Referral)
