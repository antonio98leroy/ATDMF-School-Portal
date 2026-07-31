from rest_framework import serializers
from .models import Notice,Document
class NoticeSerializer(serializers.ModelSerializer):
 class Meta: model=Notice; fields='__all__'; read_only_fields=['created_by']
class DocumentSerializer(serializers.ModelSerializer):
 class Meta: model=Document; fields='__all__'; read_only_fields=['uploaded_by']
