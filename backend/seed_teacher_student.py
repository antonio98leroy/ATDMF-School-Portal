from datetime import date

from django.db import transaction

from accounts.models import User
from academics.models import (
    AcademicYear,
    ClassSection,
    Enrollment,
    GradeLevel,
    Subject,
    Term,
)
from employees.models import (
    Department,
    Employee,
    Position,
)
from students.models import Guardian, Student
from teacher_assignments.models import TeacherAssignment


TEACHER_USERNAME = "teacher1"
TEACHER_PASSWORD = "Teacher@123"

STUDENT_USERNAME = "student1"
STUDENT_PASSWORD = "Student@123"


@transaction.atomic
def create_sample_records():
    print("Creating school sample records...")

    # ---------------------------------------------------------
    # 1. Department
    # ---------------------------------------------------------
    department, _ = Department.objects.update_or_create(
        name="Academic Department",
        defaults={
            "code": "ACAD",
            "description": (
                "Department responsible for teaching and "
                "academic activities."
            ),
            "active": True,
        },
    )

    # ---------------------------------------------------------
    # 2. Teacher position
    # ---------------------------------------------------------
    position, _ = Position.objects.update_or_create(
        name="Classroom Teacher",
        defaults={
            "description": "Academic classroom teacher.",
            "active": True,
        },
    )

    # ---------------------------------------------------------
    # 3. Teacher employee record
    # ---------------------------------------------------------
    teacher_employee, teacher_created = (
        Employee.objects.update_or_create(
            email="teacher1@atdmf.edu.lr",
            defaults={
                "first_name": "Samuel",
                "middle_name": "K.",
                "last_name": "Johnson",
                "gender": Employee.Gender.MALE,
                "date_of_birth": date(1990, 5, 15),
                "phone": "0770123456",
                "alternative_phone": "",
                "address": "Harper City, Maryland County",
                "emergency_contact_name": "Mary Johnson",
                "emergency_contact_phone": "0880123456",
                "qualification": "Bachelor of Education",
                "specialization": "Mathematics",
                "department": department,
                "position": position,
                "employment_type": (
                    Employee.EmploymentType.FULL_TIME
                ),
                "hire_date": date(2026, 1, 5),
                "status": Employee.Status.ACTIVE,
                "is_teacher": True,
                "active": True,
                "notes": "Sample teacher account.",
            },
        )
    )

    print(
        "Teacher employee:",
        teacher_employee.employee_id,
        teacher_employee.full_name,
    )

    # ---------------------------------------------------------
    # 4. Teacher login account
    # ---------------------------------------------------------
    teacher_user, _ = User.objects.get_or_create(
        username=TEACHER_USERNAME,
        defaults={
            "first_name": teacher_employee.first_name,
            "last_name": teacher_employee.last_name,
            "email": teacher_employee.email,
            "role": User.Role.TEACHER,
            "phone_number": teacher_employee.phone,
            "is_active": True,
        },
    )

    teacher_user.first_name = teacher_employee.first_name
    teacher_user.last_name = teacher_employee.last_name
    teacher_user.email = teacher_employee.email
    teacher_user.role = User.Role.TEACHER
    teacher_user.phone_number = teacher_employee.phone
    teacher_user.employee = teacher_employee
    teacher_user.is_active = True
    teacher_user.set_password(TEACHER_PASSWORD)
    teacher_user.save()

    print("Teacher user:", teacher_user.username)

    # ---------------------------------------------------------
    # 5. Student login account
    # ---------------------------------------------------------
    student_user, _ = User.objects.get_or_create(
        username=STUDENT_USERNAME,
        defaults={
            "first_name": "Grace",
            "last_name": "Doe",
            "email": "student1@atdmf.edu.lr",
            "role": User.Role.STUDENT,
            "phone_number": "",
            "is_active": True,
        },
    )

    student_user.first_name = "Grace"
    student_user.last_name = "Doe"
    student_user.email = "student1@atdmf.edu.lr"
    student_user.role = User.Role.STUDENT
    student_user.is_active = True
    student_user.set_password(STUDENT_PASSWORD)
    student_user.save()

    print("Student user:", student_user.username)

    # ---------------------------------------------------------
    # 6. Guardian
    # ---------------------------------------------------------
    guardian, _ = Guardian.objects.update_or_create(
        phone="0770654321",
        defaults={
            "name": "Rebecca Doe",
            "relationship": "Mother",
            "email": "rebecca.doe@example.com",
            "address": "Harper City, Maryland County",
        },
    )

    # ---------------------------------------------------------
    # 7. Student record
    # ---------------------------------------------------------
    student, _ = Student.objects.update_or_create(
        user=student_user,
        defaults={
            "first_name": "Grace",
            "middle_name": "M.",
            "last_name": "Doe",
            "gender": Student.Gender.FEMALE,
            "date_of_birth": date(2012, 8, 10),
            "phone": "",
            "email": "student1@atdmf.edu.lr",
            "address": "Harper City, Maryland County",
            "guardian": guardian,
            "admission_date": date(2026, 8, 1),
            "previous_school": "Example Elementary School",
            "is_active": True,
        },
    )

    print(
        "Student:",
        student.admission_number,
        student.full_name,
    )

    # ---------------------------------------------------------
    # 8. Academic year
    # ---------------------------------------------------------
    academic_year, _ = AcademicYear.objects.update_or_create(
        name="2026/2027",
        defaults={
            "start_date": date(2026, 9, 1),
            "end_date": date(2027, 7, 31),
            "active": True,
        },
    )

    # Make other academic years inactive.
    AcademicYear.objects.exclude(
        id=academic_year.id
    ).update(active=False)

    # ---------------------------------------------------------
    # 9. Academic term
    # ---------------------------------------------------------
    term, _ = Term.objects.update_or_create(
        academic_year=academic_year,
        name="First Semester",
        defaults={
            "start_date": date(2026, 9, 1),
            "end_date": date(2027, 1, 31),
            "active": True,
        },
    )

    # ---------------------------------------------------------
    # 10. Grade level
    # ---------------------------------------------------------
    grade, _ = GradeLevel.objects.update_or_create(
        name="Grade 7",
        defaults={
            "order": 7,
            "grading_system": "NUMERIC",
            "active": True,
        },
    )

    # ---------------------------------------------------------
    # 11. Class section
    # ---------------------------------------------------------
    class_section, _ = ClassSection.objects.update_or_create(
        grade=grade,
        name="A",
        defaults={
            "capacity": 40,
        },
    )

    # ---------------------------------------------------------
    # 12. Subject
    # ---------------------------------------------------------
    subject, _ = Subject.objects.update_or_create(
        code="MATH-07",
        defaults={
            "name": "Mathematics",
            "description": "Grade 7 Mathematics",
        },
    )

    # ---------------------------------------------------------
    # 13. Enroll the student
    # ---------------------------------------------------------
    enrollment, _ = Enrollment.objects.update_or_create(
        student=student,
        academic_year=academic_year,
        defaults={
            "class_section": class_section,
            "roll_number": 1,
            "active": True,
        },
    )

    print(
        "Enrollment:",
        student.full_name,
        "->",
        class_section,
        academic_year,
    )

    # ---------------------------------------------------------
    # 14. Assign teacher to subject and class
    # ---------------------------------------------------------
    assignment, _ = TeacherAssignment.objects.update_or_create(
        academic_year=academic_year,
        term=term,
        class_section=class_section,
        subject=subject,
        defaults={
            "teacher": teacher_employee,
            "weekly_periods": 5,
            "is_class_teacher": True,
            "active": True,
            "notes": "Sample Grade 7 Mathematics assignment.",
        },
    )

    print(
        "Teacher assignment:",
        assignment.teacher.full_name,
        "->",
        assignment.subject.name,
        "->",
        assignment.class_section,
    )

    print()
    print("Sample accounts created successfully.")
    print("--------------------------------------")
    print("Teacher username:", TEACHER_USERNAME)
    print("Teacher password:", TEACHER_PASSWORD)
    print()
    print("Student username:", STUDENT_USERNAME)
    print("Student password:", STUDENT_PASSWORD)
    print("--------------------------------------")


create_sample_records()
