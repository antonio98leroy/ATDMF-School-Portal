from rest_framework.permissions import BasePermission

WRITE_ROLES = {"OWNER", "SUPER_ADMIN", "DEVELOPER", "IT_ADMIN", "CLINIC_ADMIN", "NURSE", "DOCTOR"}
READ_ROLES = WRITE_ROLES | {"PRINCIPAL", "VICE_PRINCIPAL"}

class ClinicAccessPermission(BasePermission):
    def has_permission(self, request, view):
        user = request.user
        if not user or not user.is_authenticated:
            return False
        if user.is_superuser:
            return True
        role = getattr(user, "role", None)
        return role in (READ_ROLES if request.method in {"GET", "HEAD", "OPTIONS"} else WRITE_ROLES)
