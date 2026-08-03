from rest_framework import serializers
from .models import AuditLog
class AuditLogSerializer(serializers.ModelSerializer):
    username=serializers.CharField(source="user.username",read_only=True,default="System")
    user_full_name=serializers.SerializerMethodField()
    def get_user_full_name(self,obj):
        return obj.user.get_full_name() or obj.user.username if obj.user else "System"
    class Meta:
        model=AuditLog
        fields="__all__"
