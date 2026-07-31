from rest_framework import viewsets
from .models import Notice,Document
from .serializers import NoticeSerializer,DocumentSerializer
class NoticeViewSet(viewsets.ModelViewSet):
 queryset=Notice.objects.all().order_by('-created_at'); serializer_class=NoticeSerializer
 def perform_create(self,s): s.save(created_by=self.request.user)
class DocumentViewSet(viewsets.ModelViewSet):
 queryset=Document.objects.all().order_by('-uploaded_at'); serializer_class=DocumentSerializer
 def perform_create(self,s): s.save(uploaded_by=self.request.user)
