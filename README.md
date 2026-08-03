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



ATDMF OWNER DASHBOARD INSTALLATION

1. Copy backend/academics/owner_views.py to:
   ~/ATDMF-School-Portal/backend/academics/owner_views.py

2. In backend/academics/urls.py add:
   from .owner_views import OwnerDashboardView

   Then add before path("", include(router.urls)):
   path(
       "owner-dashboard/",
       OwnerDashboardView.as_view(),
       name="owner-dashboard",
   ),

3. Copy frontend/src/api/ownerDashboard.js to:
   ~/ATDMF-School-Portal/frontend/src/api/ownerDashboard.js

4. Copy frontend/src/pages/OwnerDashboard.jsx to:
   ~/ATDMF-School-Portal/frontend/src/pages/OwnerDashboard.jsx

5. In src/App.jsx add:
   import OwnerDashboard from "./pages/OwnerDashboard";

   <Route
     path="/owner-dashboard"
     element={<OwnerDashboard />}
   />

6. In src/layouts/Layout.jsx add a sidebar item:
   {
     label: "Owner Dashboard",
     path: "/owner-dashboard",
     icon: <DashboardCustomize />,
   }

   Also import DashboardCustomize from @mui/icons-material.

7. Run:
   cd ~/ATDMF-School-Portal/backend
   python manage.py check
   python manage.py runserver

   cd ~/ATDMF-School-Portal/frontend
   npm run build
   npm run dev

Use SUPER_ADMIN for the school owner's account until the dedicated OWNER
role is added during the role-permission phase.



ATDMF REPORTS CENTER INSTALLATION
================================

FILES
-----
backend/academics/reports_views.py
frontend/src/api/reports.js
frontend/src/pages/ReportsCenter.jsx

BACKEND
-------
1. Copy reports_views.py into backend/academics/.

2. Add this import to academics/urls.py:

   from .reports_views import (
       AcademicPerformanceReportView,
       AttendanceReportView,
       EmployeeReportView,
       FinanceReportView,
       PromotionReportView,
       ReportsSummaryView,
       SponsorshipReportView,
       StudentRegisterReportView,
   )

3. Add these paths before path("", include(router.urls)):

   path(
       "reports/summary/",
       ReportsSummaryView.as_view(),
   ),
   path(
       "reports/students/",
       StudentRegisterReportView.as_view(),
   ),
   path(
       "reports/sponsorships/",
       SponsorshipReportView.as_view(),
   ),
   path(
       "reports/attendance/",
       AttendanceReportView.as_view(),
   ),
   path(
       "reports/finance/",
       FinanceReportView.as_view(),
   ),
   path(
       "reports/promotions/",
       PromotionReportView.as_view(),
   ),
   path(
       "reports/employees/",
       EmployeeReportView.as_view(),
   ),
   path(
       "reports/academic-performance/",
       AcademicPerformanceReportView.as_view(),
   ),

4. IMPORTANT: Ensure academics/urls.py ends with:

   ]

5. Run:

   cd ~/ATDMF-School-Portal/backend
   python manage.py check
   python manage.py runserver

FRONTEND
--------
1. Copy reports.js to frontend/src/api/reports.js.

2. Copy ReportsCenter.jsx to frontend/src/pages/ReportsCenter.jsx.

3. Add to src/App.jsx:

   import ReportsCenter from "./pages/ReportsCenter";

   <Route
     path="/reports"
     element={<ReportsCenter />}
   />

4. Add to src/layouts/Layout.jsx:

   import { Summarize } from "@mui/icons-material";

   {
     label: "Reports Center",
     path: "/reports",
     icon: <Summarize />,
   },

5. Run:

   cd ~/ATDMF-School-Portal/frontend
   npm run build
   npm run dev

REPORT EXPORTS
--------------
The page supports:
- Print-ready reports
- CSV downloads
- Student register
- Sponsorship reports
- Student and employee attendance
- Payments, expenses, and outstanding balances
- Promotions
- Employee register
- Academic performance
