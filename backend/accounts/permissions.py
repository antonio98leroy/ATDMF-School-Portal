from rest_framework.permissions import BasePermission


class HasAllowedRole(BasePermission):
    """
    Reusable DRF permission.

    Usage:

        permission_classes = [
            IsAuthenticated,
            HasAllowedRole,
        ]

        allowed_roles = [
            "SUPER_ADMIN",
            "PRINCIPAL",
        ]
    """

    message = (
        "You do not have permission to access this resource."
    )

    def has_permission(self, request, view):
        user = request.user

        if not user or not user.is_authenticated:
            return False

        if user.is_superuser:
            return True

        allowed_roles = getattr(
            view,
            "allowed_roles",
            None,
        )

        if not allowed_roles:
            return True

        return user.role in allowed_roles


class IsSuperAdminOrITAdmin(BasePermission):
    message = (
        "Only a super administrator or IT administrator "
        "can perform this action."
    )

    def has_permission(self, request, view):
        user = request.user

        if not user or not user.is_authenticated:
            return False

        return (
            user.is_superuser
            or user.role
            in {
                "SUPER_ADMIN",
                "IT_ADMIN",
                "DEVELOPER",
            }
        )


class IsExecutiveUser(BasePermission):
    message = (
        "Only the school owner, principal, or super "
        "administrator can access this resource."
    )

    def has_permission(self, request, view):
        user = request.user

        if not user or not user.is_authenticated:
            return False

        return (
            user.is_superuser
            or user.role
            in {
                "OWNER",
                "SUPER_ADMIN",
                "PRINCIPAL",
            }
        )
