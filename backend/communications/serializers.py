from django.contrib.auth import get_user_model
from django.db import transaction

from rest_framework import serializers

from .models import (
    Document,
    InternalMessage,
    MessageRecipient,
    Notice,
    NoticeRead,
)


User = get_user_model()


def user_display_name(user):
    if not user:
        return ""

    return user.get_full_name() or user.username


class NoticeSerializer(serializers.ModelSerializer):
    audience_display = serializers.CharField(
        source="get_audience_display",
        read_only=True,
    )

    priority_display = serializers.CharField(
        source="get_priority_display",
        read_only=True,
    )

    status_display = serializers.CharField(
        source="get_status_display",
        read_only=True,
    )

    created_by_name = serializers.SerializerMethodField()
    published_by_name = serializers.SerializerMethodField()

    read_count = serializers.IntegerField(
        source="read_records.count",
        read_only=True,
    )

    is_read = serializers.SerializerMethodField()

    is_expired = serializers.BooleanField(
        read_only=True,
    )

    is_visible = serializers.BooleanField(
        read_only=True,
    )

    class Meta:
        model = Notice
        fields = "__all__"

        read_only_fields = [
            "created_by",
            "published_by",
            "published_at",
            "published",
        ]

    def get_created_by_name(self, obj):
        return user_display_name(obj.created_by)

    def get_published_by_name(self, obj):
        return user_display_name(obj.published_by)

    def get_is_read(self, obj):
        request = self.context.get("request")

        if not request or not request.user.is_authenticated:
            return False

        return obj.read_records.filter(
            user=request.user
        ).exists()


class NoticeReadSerializer(serializers.ModelSerializer):
    user_name = serializers.SerializerMethodField()

    class Meta:
        model = NoticeRead
        fields = "__all__"

    def get_user_name(self, obj):
        return user_display_name(obj.user)


class MessageRecipientSerializer(
    serializers.ModelSerializer
):
    recipient_name = serializers.SerializerMethodField()
    recipient_username = serializers.CharField(
        source="recipient.username",
        read_only=True,
    )

    class Meta:
        model = MessageRecipient
        fields = "__all__"

    def get_recipient_name(self, obj):
        return user_display_name(obj.recipient)


class InternalMessageSerializer(
    serializers.ModelSerializer
):
    recipient_ids = serializers.PrimaryKeyRelatedField(
        source="recipients",
        many=True,
        queryset=User.objects.filter(is_active=True),
        write_only=True,
    )

    sender_name = serializers.SerializerMethodField()

    priority_display = serializers.CharField(
        source="get_priority_display",
        read_only=True,
    )

    recipient_records = MessageRecipientSerializer(
        many=True,
        read_only=True,
    )

    current_recipient_status = serializers.SerializerMethodField()

    class Meta:
        model = InternalMessage
        fields = [
            "id",
            "sender",
            "sender_name",
            "recipient_ids",
            "subject",
            "body",
            "priority",
            "priority_display",
            "attachment",
            "recipient_records",
            "current_recipient_status",
            "created_at",
        ]

        read_only_fields = [
            "sender",
            "created_at",
        ]

    def get_sender_name(self, obj):
        return user_display_name(obj.sender)

    def get_current_recipient_status(self, obj):
        request = self.context.get("request")

        if not request or not request.user.is_authenticated:
            return None

        recipient_record = obj.recipient_records.filter(
            recipient=request.user
        ).first()

        if not recipient_record:
            return None

        return {
            "read": recipient_record.read,
            "read_at": recipient_record.read_at,
            "archived": recipient_record.archived,
            "archived_at": recipient_record.archived_at,
        }

    @transaction.atomic
    def create(self, validated_data):
        recipients = validated_data.pop(
            "recipients",
            [],
        )

        request = self.context["request"]

        message = InternalMessage.objects.create(
            sender=request.user,
            **validated_data,
        )

        MessageRecipient.objects.bulk_create(
            [
                MessageRecipient(
                    message=message,
                    recipient=recipient,
                )
                for recipient in recipients
                if recipient.id != request.user.id
            ],
            ignore_conflicts=True,
        )

        return message


class UserCommunicationSerializer(
    serializers.ModelSerializer
):
    full_name = serializers.SerializerMethodField()

    class Meta:
        model = User

        fields = [
            "id",
            "username",
            "first_name",
            "last_name",
            "full_name",
            "email",
            "role",
        ]

    def get_full_name(self, obj):
        return user_display_name(obj)


class DocumentSerializer(serializers.ModelSerializer):
    audience_display = serializers.CharField(
        source="get_audience_display",
        read_only=True,
    )

    uploaded_by_name = serializers.SerializerMethodField()

    class Meta:
        model = Document
        fields = "__all__"

        read_only_fields = [
            "uploaded_by",
        ]

    def get_uploaded_by_name(self, obj):
        return user_display_name(obj.uploaded_by)
