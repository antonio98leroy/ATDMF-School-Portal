from django.conf import settings
from django.db import models


class SchoolSettings(models.Model):
    class Currency(models.TextChoices):
        LRD = "LRD", "Liberian Dollar"
        USD = "USD", "United States Dollar"
        BOTH = "BOTH", "LRD and USD"

    school_name = models.CharField(
        max_length=255,
        default="Annie T. Doe Memorial Academy",
    )
    short_name = models.CharField(max_length=100, default="ATDMF-SMIS")
    motto = models.CharField(max_length=255, blank=True)
    logo = models.ImageField(upload_to="school/", blank=True, null=True)
    address = models.TextField(blank=True)
    phone = models.CharField(max_length=50, blank=True)
    email = models.EmailField(blank=True)
    website = models.URLField(blank=True)
    principal_name = models.CharField(max_length=150, blank=True)
    registrar_name = models.CharField(max_length=150, blank=True)

    # --------------------------------------------------
    # Official document signatures
    # --------------------------------------------------
    principal_signature = models.ImageField(
        upload_to="school/signatures/",
        blank=True,
        null=True,
    )

    registrar_signature = models.ImageField(
        upload_to="school/signatures/",
        blank=True,
        null=True,
    )

    principal_title = models.CharField(
        max_length=120,
        default="Principal",
        blank=True,
    )

    registrar_title = models.CharField(
        max_length=120,
        default="Registrar",
        blank=True,
    )

    # --------------------------------------------------
    # ID Card template
    # --------------------------------------------------
    id_card_title = models.CharField(
        max_length=150,
        default="OFFICIAL IDENTIFICATION CARD",
    )

    id_card_footer = models.CharField(
        max_length=255,
        default=(
            "This card remains the property of "
            "Annie T. Doe Memorial Academy."
        ),
        blank=True,
    )

    id_card_address = models.CharField(
        max_length=255,
        default=(
            "Lower Buchanan, Grand Bassa County, Liberia"
        ),
        blank=True,
    )

    id_card_show_signature = models.BooleanField(
        default=True,
    )

    # --------------------------------------------------
    # Certificate template
    # --------------------------------------------------
    certificate_school_name = models.CharField(
        max_length=255,
        blank=True,
        default="Annie T. Doe Memorial Academy",
    )

    certificate_address = models.CharField(
        max_length=255,
        blank=True,
        default=(
            "Lower Buchanan, Grand Bassa County, Liberia"
        ),
    )

    certificate_intro_text = models.CharField(
        max_length=255,
        default=(
            "This certificate is proudly presented to"
        ),
        blank=True,
    )

    certificate_footer = models.CharField(
        max_length=255,
        blank=True,
    )

    certificate_show_principal_signature = models.BooleanField(
        default=True,
    )

    certificate_show_registrar_signature = models.BooleanField(
        default=True,
    )
    default_currency = models.CharField(
        max_length=10,
        choices=Currency.choices,
        default=Currency.BOTH,
    )
    bank_name = models.CharField(max_length=150, blank=True, default="LBDI Bank")
    bank_account_name = models.CharField(max_length=150, blank=True)
    bank_account_number_lrd = models.CharField(max_length=100, blank=True)
    bank_account_number_usd = models.CharField(max_length=100, blank=True)
    receipt_footer = models.TextField(blank=True)
    report_footer = models.TextField(blank=True)
    maintenance_mode = models.BooleanField(default=False)
    allow_online_registration = models.BooleanField(default=False)
    active_academic_year = models.ForeignKey(
        "academics.AcademicYear",
        on_delete=models.SET_NULL,
        null=True,
        blank=True,
        related_name="school_settings_records",
    )
    active_term = models.ForeignKey(
        "academics.Term",
        on_delete=models.SET_NULL,
        null=True,
        blank=True,
        related_name="school_settings_records",
    )
    updated_by = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.SET_NULL,
        null=True,
        blank=True,
        related_name="updated_school_settings",
    )
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        verbose_name = "School Settings"
        verbose_name_plural = "School Settings"

    def save(self, *args, **kwargs):
        self.pk = 1
        super().save(*args, **kwargs)

    @classmethod
    def load(cls):
        obj, _ = cls.objects.get_or_create(pk=1)
        return obj

    def __str__(self):
        return self.school_name
