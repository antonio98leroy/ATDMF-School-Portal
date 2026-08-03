from django.conf import settings
from django.core.exceptions import ValidationError
from django.db import models
from django.utils import timezone


class Notice(models.Model):
    class Audience(models.TextChoices):
        ALL = "ALL", "Everyone"
        STAFF = "STAFF", "All Staff"
        TEACHERS = "TEACHERS", "Teachers"
        STUDENTS = "STUDENTS", "Students"
        PARENTS = "PARENTS", "Parents"
        REGISTRAR = "REGISTRAR", "Registrar"
        FINANCE = "FINANCE", "Finance Staff"
        PRINCIPAL = "PRINCIPAL", "Principal and Administration"

    class Priority(models.TextChoices):
        LOW = "LOW", "Low"
        NORMAL = "NORMAL", "Normal"
        HIGH = "HIGH", "High"
        URGENT = "URGENT", "Urgent"

    class Status(models.TextChoices):
        DRAFT = "DRAFT", "Draft"
        SCHEDULED = "SCHEDULED", "Scheduled"
        PUBLISHED = "PUBLISHED", "Published"
        ARCHIVED = "ARCHIVED", "Archived"

    title = models.CharField(
        max_length=200,
    )

    body = models.TextField()

    audience = models.CharField(
        max_length=30,
        choices=Audience.choices,
        default=Audience.ALL,
    )

    priority = models.CharField(
        max_length=20,
        choices=Priority.choices,
        default=Priority.NORMAL,
    )

    status = models.CharField(
        max_length=20,
        choices=Status.choices,
        default=Status.DRAFT,
    )

    published = models.BooleanField(
        default=False,
    )

    publish_at = models.DateTimeField(
        null=True,
        blank=True,
    )

    expires_at = models.DateTimeField(
        null=True,
        blank=True,
    )

    pinned = models.BooleanField(
        default=False,
    )

    allow_email = models.BooleanField(
        default=False,
        help_text="Reserved for future email integration.",
    )

    allow_sms = models.BooleanField(
        default=False,
        help_text="Reserved for future SMS integration.",
    )

    attachment = models.FileField(
        upload_to="communications/notices/%Y/%m/",
        null=True,
        blank=True,
    )

    created_by = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.SET_NULL,
        null=True,
        blank=True,
        related_name="created_notices",
    )

    published_by = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.SET_NULL,
        null=True,
        blank=True,
        related_name="published_notices",
    )

    published_at = models.DateTimeField(
        null=True,
        blank=True,
    )

    created_at = models.DateTimeField(
        auto_now_add=True,
    )

    updated_at = models.DateTimeField(
        auto_now=True,
    )

    class Meta:
        ordering = [
            "-pinned",
            "-published_at",
            "-created_at",
        ]

        indexes = [
            models.Index(fields=["status"]),
            models.Index(fields=["audience"]),
            models.Index(fields=["priority"]),
            models.Index(fields=["publish_at"]),
            models.Index(fields=["expires_at"]),
        ]

    def clean(self):
        errors = {}

        if (
            self.publish_at
            and self.expires_at
            and self.expires_at <= self.publish_at
        ):
            errors["expires_at"] = (
                "The expiry date must be later than the publication date."
            )

        if errors:
            raise ValidationError(errors)

    @property
    def is_expired(self):
        return bool(
            self.expires_at
            and self.expires_at <= timezone.now()
        )

    @property
    def is_visible(self):
        now = timezone.now()

        if self.status != self.Status.PUBLISHED:
            return False

        if not self.published:
            return False

        if self.publish_at and self.publish_at > now:
            return False

        if self.expires_at and self.expires_at <= now:
            return False

        return True

    def save(self, *args, **kwargs):
        if self.status == self.Status.PUBLISHED:
            self.published = True

            if not self.published_at:
                self.published_at = timezone.now()

        elif self.status in {
            self.Status.DRAFT,
            self.Status.SCHEDULED,
            self.Status.ARCHIVED,
        }:
            self.published = False

        self.full_clean()
        super().save(*args, **kwargs)

    def __str__(self):
        return self.title


class NoticeRead(models.Model):
    notice = models.ForeignKey(
        Notice,
        on_delete=models.CASCADE,
        related_name="read_records",
    )

    user = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.CASCADE,
        related_name="notice_read_records",
    )

    read_at = models.DateTimeField(
        auto_now_add=True,
    )

    class Meta:
        constraints = [
            models.UniqueConstraint(
                fields=["notice", "user"],
                name="unique_notice_read_user",
            )
        ]

        ordering = ["-read_at"]

    def __str__(self):
        return f"{self.notice.title} - {self.user}"


class InternalMessage(models.Model):
    class Priority(models.TextChoices):
        LOW = "LOW", "Low"
        NORMAL = "NORMAL", "Normal"
        HIGH = "HIGH", "High"
        URGENT = "URGENT", "Urgent"

    sender = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.CASCADE,
        related_name="sent_internal_messages",
    )

    recipients = models.ManyToManyField(
        settings.AUTH_USER_MODEL,
        through="MessageRecipient",
        related_name="received_internal_messages",
    )

    subject = models.CharField(
        max_length=200,
    )

    body = models.TextField()

    priority = models.CharField(
        max_length=20,
        choices=Priority.choices,
        default=Priority.NORMAL,
    )

    attachment = models.FileField(
        upload_to="communications/messages/%Y/%m/",
        null=True,
        blank=True,
    )

    created_at = models.DateTimeField(
        auto_now_add=True,
    )

    class Meta:
        ordering = ["-created_at"]

    def __str__(self):
        return self.subject


class MessageRecipient(models.Model):
    message = models.ForeignKey(
        InternalMessage,
        on_delete=models.CASCADE,
        related_name="recipient_records",
    )

    recipient = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.CASCADE,
        related_name="message_recipient_records",
    )

    read = models.BooleanField(
        default=False,
    )

    read_at = models.DateTimeField(
        null=True,
        blank=True,
    )

    archived = models.BooleanField(
        default=False,
    )

    archived_at = models.DateTimeField(
        null=True,
        blank=True,
    )

    created_at = models.DateTimeField(
        auto_now_add=True,
    )

    class Meta:
        ordering = ["-created_at"]

        constraints = [
            models.UniqueConstraint(
                fields=["message", "recipient"],
                name="unique_message_recipient",
            )
        ]

    def __str__(self):
        return f"{self.message.subject} - {self.recipient}"


class Document(models.Model):
    class Audience(models.TextChoices):
        ALL = "ALL", "Everyone"
        STAFF = "STAFF", "Staff"
        TEACHERS = "TEACHERS", "Teachers"
        STUDENTS = "STUDENTS", "Students"
        PARENTS = "PARENTS", "Parents"
        ADMINISTRATION = "ADMINISTRATION", "Administration"

    title = models.CharField(
        max_length=200,
    )

    category = models.CharField(
        max_length=100,
    )

    description = models.TextField(
        blank=True,
    )

    file = models.FileField(
        upload_to="documents/%Y/%m/",
    )

    audience = models.CharField(
        max_length=30,
        choices=Audience.choices,
        default=Audience.ALL,
    )

    active = models.BooleanField(
        default=True,
    )

    uploaded_by = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.SET_NULL,
        null=True,
        blank=True,
        related_name="uploaded_communication_documents",
    )

    uploaded_at = models.DateTimeField(
        auto_now_add=True,
    )

    updated_at = models.DateTimeField(
        auto_now=True,
    )

    class Meta:
        ordering = ["-uploaded_at"]

    def __str__(self):
        return self.title
