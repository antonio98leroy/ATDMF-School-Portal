import os
import django

os.environ.setdefault(
    "DJANGO_SETTINGS_MODULE",
    "config.settings",
)

django.setup()

from accounts.models import User


users = [
    (
        "superadmin",
        "Admin@123",
        "System",
        "Administrator",
        User.Role.SUPER_ADMIN,
        "superadmin@atdmf.org",
    ),
    (
        "principal",
        "Principal@123",
        "John",
        "Principal",
        User.Role.PRINCIPAL,
        "principal@atdmf.org",
    ),
    (
        "viceprincipal",
        "Vice@123",
        "Mary",
        "Vice",
        User.Role.VICE_PRINCIPAL,
        "viceprincipal@atdmf.org",
    ),
    (
        "registrar",
        "Registrar@123",
        "Grace",
        "Registrar",
        User.Role.REGISTRAR,
        "registrar@atdmf.org",
    ),
    (
        "accountant",
        "Account@123",
        "David",
        "Accountant",
        User.Role.ACCOUNTANT,
        "accountant@atdmf.org",
    ),
    (
        "teacher",
        "Teacher@123",
        "Samuel",
        "Teacher",
        User.Role.TEACHER,
        "teacher@atdmf.org",
    ),
    (
        "student",
        "Student@123",
        "Peter",
        "Student",
        User.Role.STUDENT,
        "student@atdmf.org",
    ),
    (
        "parent",
        "Parent@123",
        "Sarah",
        "Parent",
        User.Role.PARENT,
        "parent@atdmf.org",
    ),
    (
        "itadmin",
        "ITAdmin@123",
        "Michael",
        "IT Admin",
        User.Role.IT_ADMIN,
        "itadmin@atdmf.org",
    ),
    (
        "librarian",
        "Library@123",
        "Rebecca",
        "Librarian",
        User.Role.LIBRARIAN,
        "librarian@atdmf.org",
    ),
]


print("=" * 60)
print("Updating test user accounts")
print("=" * 60)

for (
    username,
    password,
    first_name,
    last_name,
    role,
    email,
) in users:
    user, created = User.objects.get_or_create(
        username=username,
    )

    user.first_name = first_name
    user.last_name = last_name
    user.email = email
    user.role = role
    user.is_active = True
    user.is_first_login = False
    user.set_password(password)

    if role == User.Role.SUPER_ADMIN:
        user.is_staff = True
        user.is_superuser = True
    elif role == User.Role.IT_ADMIN:
        user.is_staff = True
        user.is_superuser = False
    else:
        user.is_staff = False
        user.is_superuser = False

    user.save()

    action = "Created" if created else "Updated"

    print(
        f"✓ {action}: "
        f"{username} — {role}"
    )

print("=" * 60)
print("All test accounts are ready.")
print("=" * 60)
