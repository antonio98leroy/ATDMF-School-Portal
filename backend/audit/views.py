from django.db.models import Count
from rest_framework import filters,permissions,viewsets
from rest_framework.decorators import action
from rest_framework.response import Response
from accounts.permissions import HasAllowedRole
from .models import AuditLog
from .serializers import AuditLogSerializer
class AuditLogViewSet(viewsets.ReadOnlyModelViewSet):
    serializer_class=AuditLogSerializer
    permission_classes=[permissions.IsAuthenticated,HasAllowedRole]
    allowed_roles=["SUPER_ADMIN","IT_ADMIN","PRINCIPAL"]
    filter_backends=[filters.SearchFilter,filters.OrderingFilter]
    search_fields=["user__username","user__first_name","user__last_name","action","model_name","object_id","ip_address"]
    ordering_fields=["created_at","action","model_name","user__username"]
    ordering=["-created_at"]
    def get_queryset(self):
        q=AuditLog.objects.select_related("user").all()
        p=self.request.query_params
        if p.get("action"): q=q.filter(action=p["action"])
        if p.get("username"): q=q.filter(user__username__icontains=p["username"])
        if p.get("date_from"): q=q.filter(created_at__date__gte=p["date_from"])
        if p.get("date_to"): q=q.filter(created_at__date__lte=p["date_to"])
        return q
    @action(detail=False,methods=["get"],url_path="summary")
    def summary(self,request):
        q=self.get_queryset()
        return Response({"total":q.count(),"by_action":list(q.values("action").annotate(total=Count("id")).order_by("action"))})
