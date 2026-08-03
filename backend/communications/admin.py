from django.contrib import admin

from .models import (
    Document,
    InternalMessage,
    MessageRecipient,
    Notice,
    NoticeRead,
)


class NoticeReadInline(admin.TabularInline):
    model = NoticeRead
    extra = 0

    readonly_fields = (
        "user",
        "read_at",
    )


@admin.register(Notice)
class NoticeAdmin(admin.ModelAdmin):
    list_display = (
        "title",
        "audience",
        "priority",
        "status",
        "published",
        "pinned",
        "publish_at",
        "expires_at",
        "created_by",
    )

    list_filter = (
        "audience",
        "priority",
        "status",
        "published",
        "pinned",
        "created_at",
    )

    search_fields = (
        "title",
        "body",
        "created_by__username",
        "created_by__first_name",
        "created_by__last_name",
    )

    readonly_fields = (
        "published_at",
        "created_at",
        "updated_at",
    )

    inlines = [NoticeReadInline]


@admin.register(NoticeRead)
class NoticeReadAdmin(admin.ModelAdmin):
    list_display = (
        "notice",
        "user",
        "read_at",
    )

    list_filter = (
        "read_at",
    )

    search_fields = (
        "notice__title",
        "user__username",
        "user__first_name",
        "user__last_name",
    )


class MessageRecipientInline(
    admin.TabularInline
):
    model = MessageRecipient
    extra = 0

    readonly_fields = (
        "recipient",
        "read",
        "read_at",
        "archived",
        "archived_at",
    )


@admin.register(InternalMessage)
class InternalMessageAdmin(
    admin.ModelAdmin
):
    list_display = (
        "subject",
        "sender",
        "priority",
        "created_at",
    )

    list_filter = (
        "priority",
        "created_at",
    )

    search_fields = (
        "subject",
        "body",
        "sender__username",
    )

    readonly_fields = (
        "sender",
        "created_at",
    )

    inlines = [
        MessageRecipientInline,
    ]


@admin.register(MessageRecipient)
class MessageRecipientAdmin(
    admin.ModelAdmin
):
    list_display = (
        "message",
        "recipient",
        "read",
        "read_at",
        "archived",
        "archived_at",
    )

    list_filter = (
        "read",
        "archived",
        "created_at",
    )

    search_fields = (
        "message__subject",
        "recipient__username",
        "recipient__first_name",
        "recipient__last_name",
    )


@admin.register(Document)
class DocumentAdmin(admin.ModelAdmin):
    list_display = (
        "title",
        "category",
        "audience",
        "active",
        "uploaded_by",
        "uploaded_at",
    )

    list_filter = (
        "category",
        "audience",
        "active",
        "uploaded_at",
    )

    search_fields = (
        "title",
        "category",
        "description",
    )

    readonly_fields = (
        "uploaded_by",
        "uploaded_at",
        "updated_at",
    )
