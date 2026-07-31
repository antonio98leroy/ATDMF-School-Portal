from rest_framework import permissions,viewsets
from rest_framework.views import APIView
from rest_framework.response import Response
from .models import User
from .serializers import UserSerializer,UserCreateSerializer
class CurrentUserView(APIView):
    def get(self,request): return Response(UserSerializer(request.user,context={'request':request}).data)
class UserViewSet(viewsets.ModelViewSet):
    queryset=User.objects.all().order_by('-date_joined')
    def get_serializer_class(self): return UserCreateSerializer if self.action=='create' else UserSerializer
    def get_permissions(self):
        if self.request.user.role not in [User.Role.SUPER_ADMIN,User.Role.IT_ADMIN]: return [permissions.IsAdminUser()]
        return [permissions.IsAuthenticated()]
