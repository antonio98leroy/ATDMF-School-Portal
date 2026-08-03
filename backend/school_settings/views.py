from rest_framework import parsers, permissions, status
from rest_framework.response import Response
from rest_framework.views import APIView

from accounts.permissions import HasAllowedRole
from .models import SchoolSettings
from .serializers import SchoolSettingsSerializer


class SchoolSettingsView(APIView):
    permission_classes = [
        permissions.IsAuthenticated,
        HasAllowedRole,
    ]
    allowed_roles = ["SUPER_ADMIN", "IT_ADMIN"]
    parser_classes = [
        parsers.JSONParser,
        parsers.MultiPartParser,
        parsers.FormParser,
    ]

    def get(self, request):
        obj = SchoolSettings.load()
        return Response(
            SchoolSettingsSerializer(
                obj,
                context={"request": request},
            ).data
        )

    def patch(self, request):
        obj = SchoolSettings.load()
        serializer = SchoolSettingsSerializer(
            obj,
            data=request.data,
            partial=True,
            context={"request": request},
        )
        serializer.is_valid(raise_exception=True)
        serializer.save(updated_by=request.user)
        return Response(serializer.data, status=status.HTTP_200_OK)
