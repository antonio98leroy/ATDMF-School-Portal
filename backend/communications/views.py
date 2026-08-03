from django.db.models import Count, Q
from django.utils import timezone

from rest_framework import (
    filters,
    permissions,
    status,
    viewsets,
)
from rest_framework.decorators import action
from rest_framework.response import Response

from .models import (
    Document,
    InternalMessage,
    MessageRecipient,
    Notice,
    NoticeRead,
)
from .serializers import (
    DocumentSerializer,
    InternalMessageSerializer,
    MessageRecipientSerializer,
    NoticeSerializer,
    UserCommunicationSerializer,
)


def user_role(user):
    return str(
        getattr(user, "role", "") or ""
    ).upper()


def allowed_notice_audiences(user):
    role = user_role(user)

    audiences = [Notice.Audience.ALL]

    if role in {
        "ADMIN",
        "SUPER_ADMIN",
        "OWNER",
        "PRINCIPAL",
        "REGISTRAR",
        "FINANCE",
        "TEACHER",
        "STAFF",
        "EMPLOYEE",
    }:
        audiences.append(Notice.Audience.STAFF)

    if role == "TEACHER":
        audiences.append(Notice.Audience.TEACHERS)

    if role == "STUDENT":
        audiences.append(Notice.Audience.STUDENTS)

    if role == "PARENT":
        audiences.append(Notice.Audience.PARENTS)

    if role == "REGISTRAR":
        audiences.append(Notice.Audience.REGISTRAR)

    if role == "FINANCE":
        audiences.append(Notice.Audience.FINANCE)

    if role in {
        "ADMIN",
        "SUPER_ADMIN",
        "OWNER",
        "PRINCIPAL",
    }:
        audiences.extend(
            [
                Notice.Audience.PRINCIPAL,
                Notice.Audience.STAFF,
                Notice.Audience.TEACHERS,
                Notice.Audience.STUDENTS,
                Notice.Audience.PARENTS,
                Notice.Audience.REGISTRAR,
                Notice.Audience.FINANCE,
            ]
        )

    return list(set(audiences))


class CommunicationBaseViewSet(
    viewsets.ModelViewSet
):
    permission_classes = [
        permissions.IsAuthenticated,
    ]

    filter_backends = [
        filters.SearchFilter,
        filters.OrderingFilter,
    ]


class NoticeViewSet(CommunicationBaseViewSet):
    serializer_class = NoticeSerializer

    search_fields = [
        "title",
        "body",
        "created_by__username",
        "created_by__first_name",
        "created_by__last_name",
    ]

    ordering_fields = [
        "created_at",
        "published_at",
        "publish_at",
        "expires_at",
        "priority",
        "title",
    ]

    ordering = [
        "-pinned",
        "-created_at",
    ]

    def get_queryset(self):
        queryset = (
            Notice.objects
            .select_related(
                "created_by",
                "published_by",
            )
            .prefetch_related(
                "read_records",
            )
            .all()
        )

        audience = self.request.query_params.get(
            "audience"
        )

        notice_status = self.request.query_params.get(
            "status"
        )

        priority = self.request.query_params.get(
            "priority"
        )

        published = self.request.query_params.get(
            "published"
        )

        pinned = self.request.query_params.get(
            "pinned"
        )

        active_only = self.request.query_params.get(
            "active_only"
        )

        mine = self.request.query_params.get(
            "mine"
        )

        if audience:
            queryset = queryset.filter(
                audience=audience
            )

        if notice_status:
            queryset = queryset.filter(
                status=notice_status
            )

        if priority:
            queryset = queryset.filter(
                priority=priority
            )

        if published in {"true", "false"}:
            queryset = queryset.filter(
                published=published == "true"
            )

        if pinned in {"true", "false"}:
            queryset = queryset.filter(
                pinned=pinned == "true"
            )

        if mine == "true":
            queryset = queryset.filter(
                created_by=self.request.user
            )

        if active_only == "true":
            now = timezone.now()

            queryset = (
                queryset.filter(
                    status=Notice.Status.PUBLISHED,
                    published=True,
                    audience__in=(
                        allowed_notice_audiences(
                            self.request.user
                        )
                    ),
                )
                .filter(
                    Q(publish_at__isnull=True)
                    | Q(publish_at__lte=now)
                )
                .filter(
                    Q(expires_at__isnull=True)
                    | Q(expires_at__gt=now)
                )
            )

        return queryset

    def perform_create(self, serializer):
        status_value = serializer.validated_data.get(
            "status",
            Notice.Status.DRAFT,
        )

        serializer.save(
            created_by=self.request.user,
            published_by=(
                self.request.user
                if status_value
                == Notice.Status.PUBLISHED
                else None
            ),
        )

    def perform_update(self, serializer):
        status_value = serializer.validated_data.get(
            "status",
            serializer.instance.status,
        )

        serializer.save(
            published_by=(
                self.request.user
                if status_value
                == Notice.Status.PUBLISHED
                else serializer.instance.published_by
            )
        )

    @action(
        detail=True,
        methods=["post"],
        url_path="publish",
    )
    def publish(self, request, pk=None):
        notice = self.get_object()

        notice.status = Notice.Status.PUBLISHED
        notice.published = True
        notice.published_by = request.user
        notice.published_at = timezone.now()

        if not notice.publish_at:
            notice.publish_at = timezone.now()

        notice.save()

        return Response(
            self.get_serializer(notice).data
        )

    @action(
        detail=True,
        methods=["post"],
        url_path="archive",
    )
    def archive(self, request, pk=None):
        notice = self.get_object()

        notice.status = Notice.Status.ARCHIVED
        notice.published = False
        notice.save(
            update_fields=[
                "status",
                "published",
                "updated_at",
            ]
        )

        return Response(
            self.get_serializer(notice).data
        )

    @action(
        detail=True,
        methods=["post"],
        url_path="mark-read",
    )
    def mark_read(self, request, pk=None):
        notice = self.get_object()

        read_record, created = (
            NoticeRead.objects.get_or_create(
                notice=notice,
                user=request.user,
            )
        )

        return Response(
            {
                "created": created,
                "read_at": read_record.read_at,
            }
        )

    @action(
        detail=False,
        methods=["get"],
        url_path="my-feed",
    )
    def my_feed(self, request):
        now = timezone.now()

        queryset = (
            self.get_queryset()
            .filter(
                status=Notice.Status.PUBLISHED,
                published=True,
                audience__in=(
                    allowed_notice_audiences(
                        request.user
                    )
                ),
            )
            .filter(
                Q(publish_at__isnull=True)
                | Q(publish_at__lte=now)
            )
            .filter(
                Q(expires_at__isnull=True)
                | Q(expires_at__gt=now)
            )
        )

        page = self.paginate_queryset(queryset)

        if page is not None:
            serializer = self.get_serializer(
                page,
                many=True,
            )

            return self.get_paginated_response(
                serializer.data
            )

        return Response(
            self.get_serializer(
                queryset,
                many=True,
            ).data
        )

    @action(
        detail=False,
        methods=["get"],
        url_path="statistics",
    )
    def statistics(self, request):
        queryset = self.get_queryset()
        now = timezone.now()

        active = (
            queryset.filter(
                status=Notice.Status.PUBLISHED,
                published=True,
            )
            .filter(
                Q(expires_at__isnull=True)
                | Q(expires_at__gt=now)
            )
        )

        return Response(
            {
                "total": queryset.count(),
                "drafts": queryset.filter(
                    status=Notice.Status.DRAFT
                ).count(),
                "scheduled": queryset.filter(
                    status=Notice.Status.SCHEDULED
                ).count(),
                "published": active.count(),
                "archived": queryset.filter(
                    status=Notice.Status.ARCHIVED
                ).count(),
                "expired": queryset.filter(
                    expires_at__lte=now
                ).count(),
                "urgent": active.filter(
                    priority=Notice.Priority.URGENT
                ).count(),
                "pinned": active.filter(
                    pinned=True
                ).count(),
                "my_unread": active.exclude(
                    read_records__user=request.user
                ).count(),
            }
        )


class InternalMessageViewSet(
    CommunicationBaseViewSet
):
    serializer_class = InternalMessageSerializer

    search_fields = [
        "subject",
        "body",
        "sender__username",
        "sender__first_name",
        "sender__last_name",
    ]

    ordering_fields = [
        "created_at",
        "priority",
        "subject",
    ]

    ordering = ["-created_at"]

    def get_queryset(self):
        user = self.request.user

        queryset = (
            InternalMessage.objects
            .select_related("sender")
            .prefetch_related(
                "recipient_records",
                "recipient_records__recipient",
            )
            .filter(
                Q(sender=user)
                | Q(recipient_records__recipient=user)
            )
            .distinct()
        )

        box = self.request.query_params.get(
            "box",
            "inbox",
        )

        priority = self.request.query_params.get(
            "priority"
        )

        unread = self.request.query_params.get(
            "unread"
        )

        if box == "sent":
            queryset = queryset.filter(
                sender=user
            )

        elif box == "archived":
            queryset = queryset.filter(
                recipient_records__recipient=user,
                recipient_records__archived=True,
            )

        else:
            queryset = queryset.filter(
                recipient_records__recipient=user,
                recipient_records__archived=False,
            )

        if priority:
            queryset = queryset.filter(
                priority=priority
            )

        if unread == "true":
            queryset = queryset.filter(
                recipient_records__recipient=user,
                recipient_records__read=False,
            )

        return queryset.distinct()

    @action(
        detail=True,
        methods=["post"],
        url_path="mark-read",
    )
    def mark_read(self, request, pk=None):
        message = self.get_object()

        recipient_record = (
            MessageRecipient.objects.filter(
                message=message,
                recipient=request.user,
            ).first()
        )

        if not recipient_record:
            return Response(
                {
                    "detail": (
                        "You are not a recipient of this message."
                    )
                },
                status=status.HTTP_403_FORBIDDEN,
            )

        recipient_record.read = True
        recipient_record.read_at = timezone.now()
        recipient_record.save(
            update_fields=[
                "read",
                "read_at",
            ]
        )

        return Response(
            MessageRecipientSerializer(
                recipient_record
            ).data
        )

    @action(
        detail=True,
        methods=["post"],
        url_path="archive",
    )
    def archive(self, request, pk=None):
        message = self.get_object()

        recipient_record = (
            MessageRecipient.objects.filter(
                message=message,
                recipient=request.user,
            ).first()
        )

        if not recipient_record:
            return Response(
                {
                    "detail": (
                        "Only message recipients can archive messages."
                    )
                },
                status=status.HTTP_403_FORBIDDEN,
            )

        recipient_record.archived = True
        recipient_record.archived_at = timezone.now()
        recipient_record.save(
            update_fields=[
                "archived",
                "archived_at",
            ]
        )

        return Response(
            MessageRecipientSerializer(
                recipient_record
            ).data
        )

    @action(
        detail=True,
        methods=["post"],
        url_path="restore",
    )
    def restore(self, request, pk=None):
        message = self.get_object()

        recipient_record = (
            MessageRecipient.objects.filter(
                message=message,
                recipient=request.user,
            ).first()
        )

        if not recipient_record:
            return Response(
                {
                    "detail": (
                        "Only message recipients can restore messages."
                    )
                },
                status=status.HTTP_403_FORBIDDEN,
            )

        recipient_record.archived = False
        recipient_record.archived_at = None
        recipient_record.save(
            update_fields=[
                "archived",
                "archived_at",
            ]
        )

        return Response(
            MessageRecipientSerializer(
                recipient_record
            ).data
        )

    @action(
        detail=False,
        methods=["get"],
        url_path="statistics",
    )
    def statistics(self, request):
        user = request.user

        recipient_records = (
            MessageRecipient.objects.filter(
                recipient=user
            )
        )

        return Response(
            {
                "inbox": recipient_records.filter(
                    archived=False
                ).count(),
                "unread": recipient_records.filter(
                    read=False,
                    archived=False,
                ).count(),
                "archived": recipient_records.filter(
                    archived=True
                ).count(),
                "sent": InternalMessage.objects.filter(
                    sender=user
                ).count(),
                "urgent_unread": (
                    recipient_records.filter(
                        read=False,
                        archived=False,
                        message__priority=(
                            InternalMessage
                            .Priority.URGENT
                        ),
                    ).count()
                ),
            }
        )


class CommunicationUserViewSet(
    viewsets.ReadOnlyModelViewSet
):
    permission_classes = [
        permissions.IsAuthenticated,
    ]

    serializer_class = UserCommunicationSerializer

    filter_backends = [
        filters.SearchFilter,
        filters.OrderingFilter,
    ]

    search_fields = [
        "username",
        "first_name",
        "last_name",
        "email",
        "role",
    ]

    ordering = [
        "first_name",
        "last_name",
        "username",
    ]

    def get_queryset(self):
        queryset = (
            self.request.user.__class__
            .objects.filter(
                is_active=True
            )
            .exclude(
                id=self.request.user.id
            )
        )

        role = self.request.query_params.get(
            "role"
        )

        if role:
            queryset = queryset.filter(
                role=role
            )

        return queryset


class DocumentViewSet(
    CommunicationBaseViewSet
):
    serializer_class = DocumentSerializer

    search_fields = [
        "title",
        "category",
        "description",
        "uploaded_by__username",
    ]

    ordering_fields = [
        "uploaded_at",
        "title",
        "category",
    ]

    ordering = ["-uploaded_at"]

    def get_queryset(self):
        queryset = (
            Document.objects
            .select_related("uploaded_by")
            .all()
        )

        category = self.request.query_params.get(
            "category"
        )

        audience = self.request.query_params.get(
            "audience"
        )

        active = self.request.query_params.get(
            "active"
        )

        if category:
            queryset = queryset.filter(
                category=category
            )

        if audience:
            queryset = queryset.filter(
                audience=audience
            )

        if active in {"true", "false"}:
            queryset = queryset.filter(
                active=active == "true"
            )

        return queryset

    def perform_create(self, serializer):
        serializer.save(
            uploaded_by=self.request.user
        )


class CommunicationDashboardViewSet(
    viewsets.ViewSet
):
    permission_classes = [
        permissions.IsAuthenticated,
    ]

    @action(
        detail=False,
        methods=["get"],
        url_path="summary",
    )
    def summary(self, request):
        now = timezone.now()

        active_notices = (
            Notice.objects.filter(
                status=Notice.Status.PUBLISHED,
                published=True,
                audience__in=(
                    allowed_notice_audiences(
                        request.user
                    )
                ),
            )
            .filter(
                Q(publish_at__isnull=True)
                | Q(publish_at__lte=now)
            )
            .filter(
                Q(expires_at__isnull=True)
                | Q(expires_at__gt=now)
            )
        )

        inbox = MessageRecipient.objects.filter(
            recipient=request.user,
            archived=False,
        )

        return Response(
            {
                "active_notices": active_notices.count(),
                "unread_notices": active_notices.exclude(
                    read_records__user=request.user
                ).count(),
                "urgent_notices": active_notices.filter(
                    priority=Notice.Priority.URGENT
                ).count(),
                "inbox_messages": inbox.count(),
                "unread_messages": inbox.filter(
                    read=False
                ).count(),
                "sent_messages": (
                    InternalMessage.objects.filter(
                        sender=request.user
                    ).count()
                ),
                "documents": Document.objects.filter(
                    active=True
                ).count(),
            }
        )
