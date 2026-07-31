# ATDMF School Portal

Complete MVP starter for Annie T. Doe Memorial Foundation High School.

## Backend setup
```bash
cd backend
python3 -m venv venv
source venv/bin/activate
pip install -r requirements.txt
cp .env.example .env
mysql -u root -p -e "CREATE DATABASE atdmf_school CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;"
python manage.py makemigrations
python manage.py migrate
python manage.py createsuperuser
python manage.py runserver
```

## Frontend setup
```bash
cd frontend
npm install
npm run dev
```

Open http://127.0.0.1:5173 and log in with the Django superuser.

## Included modules
Authentication and roles, users, students, guardians, staff, academics, timetable, attendance, assessments, score entry, CBT question bank, fees, invoices, payments, expenses, notices, documents, audit log model, and dashboard.

## Next production work
Add fine-grained role permissions, report-card and transcript PDF templates, CBT attempt/submission screens, SMS/email provider credentials, backup commands, library and discipline apps, validation tests, and deployment hardening.
