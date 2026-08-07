from rest_framework import parsers, permissions, status
from rest_framework.response import Response
from rest_framework.views import APIView

from .models import SchoolSettings
from .serializers import SchoolSettingsSerializer


DOCUMENT_VIEW_ROLES = {
    "OWNER",
    "SUPER_ADMIN",
    "IT_ADMIN",
    "PRINCIPAL",
    "VICE_PRINCIPAL",
    "REGISTRAR",
    "DEVELOPER",
}

DOCUMENT_EDIT_ROLES = {
    "SUPER_ADMIN",
    "IT_ADMIN",
    "PRINCIPAL",
}


def user_role(user):
    return str(
        getattr(user, "role", "") or ""
    ).upper()


class SchoolSettingsView(APIView):
    permission_classes = [
        permissions.IsAuthenticated,
    ]

    parser_classes = [
        parsers.JSONParser,
        parsers.MultiPartParser,
        parsers.FormParser,
    ]

    def get(self, request):
        role = user_role(request.user)

        if (
            not request.user.is_superuser
            and role not in DOCUMENT_VIEW_ROLES
        ):
            return Response(
                {
                    "detail": (
                        "You are not authorized to view "
                        "school document settings."
                    )
                },
                status=status.HTTP_403_FORBIDDEN,
            )

        obj = SchoolSettings.load()

        return Response(
            SchoolSettingsSerializer(
                obj,
                context={"request": request},
            ).data
        )

    def patch(self, request):
        role = user_role(request.user)

        if (
            not request.user.is_superuser
            and role not in DOCUMENT_EDIT_ROLES
        ):
            return Response(
                {
                    "detail": (
                        "Only authorized administrators "
                        "may change official document settings."
                    )
                },
                status=status.HTTP_403_FORBIDDEN,
            )

        obj = SchoolSettings.load()

        serializer = SchoolSettingsSerializer(
            obj,
            data=request.data,
            partial=True,
            context={"request": request},
        )

        serializer.is_valid(
            raise_exception=True
        )

        serializer.save(
            updated_by=request.user
        )

        return Response(
            serializer.data,
            status=status.HTTP_200_OK,
        )
