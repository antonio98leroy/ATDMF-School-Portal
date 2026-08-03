from rest_framework import permissions, viewsets
from rest_framework.response import Response
from rest_framework.views import APIView

from .models import User
from .permissions import IsSuperAdminOrITAdmin
from .serializers import (
    UserCreateSerializer,
    UserSerializer,
)


class CurrentUserView(APIView):
    permission_classes = [
        permissions.IsAuthenticated,
    ]

    def get(self, request):
        serializer = UserSerializer(
            request.user,
            context={
                "request": request,
            },
        )

        return Response(serializer.data)


class UserViewSet(viewsets.ModelViewSet):
    queryset = (
        User.objects
        .all()
        .order_by("-date_joined")
    )

    permission_classes = [
        permissions.IsAuthenticated,
        IsSuperAdminOrITAdmin,
    ]

    def get_serializer_class(self):
        if self.action == "create":
            return UserCreateSerializer

        return UserSerializer
