import os
import django

os.environ.setdefault("DJANGO_SETTINGS_MODULE", "config.settings")
django.setup()

from accounts.models import User

users = [
    ("superadmin", "Admin@123", "System", "Administrator", User.Role.SUPER_ADMIN, "superadmin@atdmf.org"),
    ("principal", "Principal@123", "John", "Principal", User.Role.PRINCIPAL, "principal@atdmf.org"),
    ("viceprincipal", "Vice@123", "Mary", "Vice", User.Role.VICE_PRINCIPAL, "viceprincipal@atdmf.org"),
    ("registrar", "Registrar@123", "Grace", "Registrar", User.Role.REGISTRAR, "registrar@atdmf.org"),
    ("accountant", "Account@123", "David", "Accountant", User.Role.ACCOUNTANT, "accountant@atdmf.org"),
    ("teacher", "Teacher@123", "Samuel", "Teacher", User.Role.TEACHER, "teacher@atdmf.org"),
    ("student", "Student@123", "Peter", "Student", User.Role.STUDENT, "student@atdmf.org"),
    ("parent", "Parent@123", "Sarah", "Parent", User.Role.PARENT, "parent@atdmf.org"),
    ("itadmin", "ITAdmin@123", "Michael", "IT Admin", User.Role.IT_ADMIN, "itadmin@atdmf.org"),
    ("librarian", "Library@123", "Rebecca", "Librarian", User.Role.LIBRARIAN, "librarian@atdmf.org"),
]

print("=" * 60)
print("Creating Demo Users")
print("=" * 60)

for username, password, first, last, role, email in users:

    if User.objects.filter(username=username).exists():
        print(f"✓ {username} already exists")
        continue

    user = User.objects.create_user(
        username=username,
        password=password,
        first_name=first,
        last_name=last,
        email=email,
        role=role,
        is_active=True,
    )

    print(f"✓ Created {username}")

print("=" * 60)
print("Finished.")
print("=" * 60)