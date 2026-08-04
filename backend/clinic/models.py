from django.conf import settings
from django.core.exceptions import ValidationError
from django.db import models
from django.utils import timezone


class HealthProfile(models.Model):
    class PatientType(models.TextChoices):
        STUDENT = "STUDENT", "Student"
        STAFF = "STAFF", "Staff"

    patient_type = models.CharField(max_length=10, choices=PatientType.choices)
    student = models.OneToOneField("students.Student", on_delete=models.CASCADE, null=True, blank=True, related_name="health_profile")
    employee = models.OneToOneField("employees.Employee", on_delete=models.CASCADE, null=True, blank=True, related_name="health_profile")
    blood_group = models.CharField(max_length=10, blank=True)
    genotype = models.CharField(max_length=10, blank=True)
    asthma = models.BooleanField(default=False)
    allergies_present = models.BooleanField(default=False)
    diabetes = models.BooleanField(default=False)
    seizure_disorder = models.BooleanField(default=False)
    heart_condition = models.BooleanField(default=False)
    vision_problem = models.BooleanField(default=False)
    hearing_problem = models.BooleanField(default=False)
    mobility_limitation = models.BooleanField(default=False)
    allergies = models.TextField(blank=True)
    current_medications = models.TextField(blank=True)
    previous_surgeries_or_hospitalizations = models.TextField(blank=True)
    other_health_information = models.TextField(blank=True)
    emergency_contact_name = models.CharField(max_length=150, blank=True)
    emergency_contact_phone = models.CharField(max_length=30, blank=True)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)
    updated_by = models.ForeignKey(settings.AUTH_USER_MODEL, on_delete=models.SET_NULL, null=True, blank=True, related_name="updated_health_profiles")

    def clean(self):
        if self.patient_type == self.PatientType.STUDENT and (not self.student or self.employee):
            raise ValidationError("A student profile requires one student and no employee.")
        if self.patient_type == self.PatientType.STAFF and (not self.employee or self.student):
            raise ValidationError("A staff profile requires one employee and no student.")

    @property
    def patient_name(self):
        return str(self.student or self.employee or "Unknown patient")

    def __str__(self):
        return f"{self.patient_name} - Health Profile"


class HealthAssessment(models.Model):
    class Result(models.TextChoices):
        NORMAL = "NORMAL", "Normal"
        ABNORMAL = "ABNORMAL", "Abnormal"
        NOT_ASSESSED = "NOT_ASSESSED", "Not Assessed"

    class Participation(models.TextChoices):
        FULL = "FULL", "May participate without restriction"
        RESTRICTED = "RESTRICTED", "May participate with restrictions"
        EVALUATION_REQUIRED = "EVALUATION_REQUIRED", "Additional medical evaluation recommended"

    profile = models.ForeignKey(HealthProfile, on_delete=models.CASCADE, related_name="assessments")
    examination_date = models.DateField(default=timezone.localdate)
    height_cm = models.DecimalField(max_digits=6, decimal_places=2, null=True, blank=True)
    weight_kg = models.DecimalField(max_digits=6, decimal_places=2, null=True, blank=True)
    blood_pressure = models.CharField(max_length=20, blank=True)
    vision_right = models.CharField(max_length=30, blank=True)
    vision_left = models.CharField(max_length=30, blank=True)
    vision_referred = models.BooleanField(default=False)
    hearing_right = models.CharField(max_length=30, blank=True)
    hearing_left = models.CharField(max_length=30, blank=True)
    hearing_referred = models.BooleanField(default=False)
    general_appearance = models.CharField(max_length=20, choices=Result.choices, default=Result.NOT_ASSESSED)
    heart = models.CharField(max_length=20, choices=Result.choices, default=Result.NOT_ASSESSED)
    lungs = models.CharField(max_length=20, choices=Result.choices, default=Result.NOT_ASSESSED)
    abdomen = models.CharField(max_length=20, choices=Result.choices, default=Result.NOT_ASSESSED)
    musculoskeletal = models.CharField(max_length=20, choices=Result.choices, default=Result.NOT_ASSESSED)
    neurological = models.CharField(max_length=20, choices=Result.choices, default=Result.NOT_ASSESSED)
    skin = models.CharField(max_length=20, choices=Result.choices, default=Result.NOT_ASSESSED)
    dental_oral_health = models.CharField(max_length=20, choices=Result.choices, default=Result.NOT_ASSESSED)
    abnormal_findings = models.TextField(blank=True)
    participation_status = models.CharField(max_length=30, choices=Participation.choices, default=Participation.FULL)
    restrictions_or_accommodations = models.TextField(blank=True)
    provider_name = models.CharField(max_length=150, blank=True)
    provider_credentials = models.CharField(max_length=100, blank=True)
    provider_clinic = models.CharField(max_length=150, blank=True)
    provider_phone = models.CharField(max_length=30, blank=True)
    parent_guardian_confirmed = models.BooleanField(default=False)
    created_by = models.ForeignKey(settings.AUTH_USER_MODEL, on_delete=models.SET_NULL, null=True, blank=True, related_name="created_health_assessments")
    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        ordering = ["-examination_date", "-created_at"]

    def __str__(self):
        return f"{self.profile.patient_name} - {self.examination_date}"


class ClinicVisit(models.Model):
    class PatientType(models.TextChoices):
        STUDENT = "STUDENT", "Student"
        STAFF = "STAFF", "Staff"

    class Reason(models.TextChoices):
        MENSTRUAL_CRAMPS = "MENSTRUAL_CRAMPS", "Menstrual cramps"
        HEADACHE = "HEADACHE", "Headache"
        DIABETES_TEST = "DIABETES_TEST", "Scheduled diabetes testing"
        MTT = "MTT", "MTT"
        MALARIA_TEST = "MALARIA_TEST", "Malaria testing"
        MALARIA_TREATMENT = "MALARIA_TREATMENT", "Uncomplicated malaria treatment"
        UTI = "UTI", "UTI assessment/treatment"
        PREGNANCY_TEST = "PREGNANCY_TEST", "Pregnancy testing"
        FEVER = "FEVER", "Fever"
        COUGH_COLD = "COUGH_COLD", "Cough/Cold"
        STOMACH_COMPLAINT = "STOMACH_COMPLAINT", "Stomach complaint"
        INJURY_WOUND = "INJURY_WOUND", "Injury/Wound"
        OTHER = "OTHER", "Other"

    class Outcome(models.TextChoices):
        RETURNED_TO_CLASS = "RETURNED_TO_CLASS", "Returned to class"
        SENT_HOME = "SENT_HOME", "Sent home"
        FOLLOW_UP = "FOLLOW_UP", "Follow-up scheduled"
        REFERRED_CLINIC = "REFERRED_CLINIC", "Referred to clinic/health center"
        REFERRED_HOSPITAL = "REFERRED_HOSPITAL", "Referred to hospital"
        EMERGENCY_TRANSFER = "EMERGENCY_TRANSFER", "Emergency transfer"

    patient_type = models.CharField(max_length=10, choices=PatientType.choices)
    student = models.ForeignKey("students.Student", on_delete=models.CASCADE, null=True, blank=True, related_name="clinic_visits")
    employee = models.ForeignKey("employees.Employee", on_delete=models.CASCADE, null=True, blank=True, related_name="clinic_visits")
    visit_date = models.DateField(default=timezone.localdate)
    time_in = models.TimeField(default=timezone.localtime)
    time_out = models.TimeField(null=True, blank=True)
    reason = models.CharField(max_length=40, choices=Reason.choices)
    other_reason = models.CharField(max_length=255, blank=True)
    temperature_c = models.DecimalField(max_digits=4, decimal_places=1, null=True, blank=True)
    pulse_bpm = models.PositiveIntegerField(null=True, blank=True)
    respiratory_rate = models.PositiveIntegerField(null=True, blank=True)
    blood_pressure = models.CharField(max_length=20, blank=True)
    weight_kg = models.DecimalField(max_digits=6, decimal_places=2, null=True, blank=True)
    symptoms_or_complaint = models.TextField(blank=True)
    test_performed = models.CharField(max_length=150, blank=True)
    test_result = models.CharField(max_length=255, blank=True)
    assessment_findings = models.TextField(blank=True)
    treatment_or_medication = models.TextField(blank=True)
    dose = models.CharField(max_length=100, blank=True)
    route = models.CharField(max_length=50, blank=True)
    medication_time = models.TimeField(null=True, blank=True)
    administered_by = models.CharField(max_length=150, blank=True)
    outcome = models.CharField(max_length=30, choices=Outcome.choices, default=Outcome.RETURNED_TO_CLASS)
    follow_up_instructions = models.TextField(blank=True)
    follow_up_date = models.DateField(null=True, blank=True)
    parent_guardian_contacted = models.BooleanField(default=False)
    parent_guardian_contact_name = models.CharField(max_length=150, blank=True)
    parent_guardian_contact_time = models.TimeField(null=True, blank=True)
    clinic_staff = models.ForeignKey(settings.AUTH_USER_MODEL, on_delete=models.SET_NULL, null=True, blank=True, related_name="clinic_visits_recorded")
    confidential = models.BooleanField(default=True)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    def clean(self):
        if self.patient_type == self.PatientType.STUDENT and (not self.student or self.employee):
            raise ValidationError("A student visit requires one student and no employee.")
        if self.patient_type == self.PatientType.STAFF and (not self.employee or self.student):
            raise ValidationError("A staff visit requires one employee and no student.")

    @property
    def patient_name(self):
        return str(self.student or self.employee or "Unknown patient")

    class Meta:
        ordering = ["-visit_date", "-time_in"]

    def __str__(self):
        return f"{self.patient_name} - {self.visit_date}"


class Referral(models.Model):
    visit = models.OneToOneField(ClinicVisit, on_delete=models.CASCADE, related_name="referral")
    facility_name = models.CharField(max_length=200)
    reason_for_referral = models.TextField()
    treatment_already_given = models.TextField(blank=True)
    urgent = models.BooleanField(default=False)
    referred_at = models.DateTimeField(default=timezone.now)
    received_by = models.CharField(max_length=150, blank=True)
    notes = models.TextField(blank=True)

    def __str__(self):
        return f"Referral: {self.visit.patient_name}"


class Medicine(models.Model):
    name = models.CharField(max_length=150, unique=True)
    strength = models.CharField(max_length=100, blank=True)
    dosage_form = models.CharField(max_length=100, blank=True)
    quantity_in_stock = models.PositiveIntegerField(default=0)
    reorder_level = models.PositiveIntegerField(default=10)
    batch_number = models.CharField(max_length=100, blank=True)
    expiry_date = models.DateField(null=True, blank=True)
    active = models.BooleanField(default=True)
    updated_at = models.DateTimeField(auto_now=True)

    @property
    def low_stock(self):
        return self.quantity_in_stock <= self.reorder_level

    def __str__(self):
        return f"{self.name} {self.strength}".strip()


class MedicineDispense(models.Model):
    visit = models.ForeignKey(ClinicVisit, on_delete=models.CASCADE, related_name="dispensed_medicines")
    medicine = models.ForeignKey(Medicine, on_delete=models.PROTECT, related_name="dispenses")
    quantity = models.PositiveIntegerField(default=1)
    dose_instruction = models.CharField(max_length=255, blank=True)
    dispensed_by = models.ForeignKey(settings.AUTH_USER_MODEL, on_delete=models.SET_NULL, null=True, blank=True, related_name="medicine_dispenses")
    dispensed_at = models.DateTimeField(auto_now_add=True)

    def clean(self):
        previous = MedicineDispense.objects.get(pk=self.pk).quantity if self.pk else 0
        required = self.quantity - previous
        if required > self.medicine.quantity_in_stock:
            raise ValidationError("Insufficient medicine stock.")

    def save(self, *args, **kwargs):
        self.full_clean()
        previous = MedicineDispense.objects.get(pk=self.pk).quantity if self.pk else 0
        difference = self.quantity - previous
        super().save(*args, **kwargs)
        if difference:
            self.medicine.quantity_in_stock -= difference
            self.medicine.save(update_fields=["quantity_in_stock", "updated_at"])

    def __str__(self):
        return f"{self.medicine} for {self.visit.patient_name}"
