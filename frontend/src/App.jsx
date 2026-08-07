import {
  Navigate,
  Route,
  Routes,
} from "react-router-dom";

import { useAuth } from "./context/AuthContext";

import Layout from "./layouts/Layout";
import RoleRoute from "./components/RoleRoute";

import Academics from "./pages/Academics";
import Attendance from "./pages/Attendance";
import Dashboard from "./pages/Dashboard";
import Enrollments from "./pages/Enrollments";
import Examinations from "./pages/Examinations";
import Finance from "./pages/Finance";
import Login from "./pages/Login";
import Notices from "./pages/Notices";
import OwnerDashboard from "./pages/OwnerDashboard";
import ParentPortal from "./pages/ParentPortal";
import PrincipalDashboard from "./pages/PrincipalDashboard";
import VicePrincipalDashboard from "./pages/VicePrincipalDashboard";
import TimetableManager from "./pages/TimetableManager";
import Promotions from "./pages/Promotions";
import ReportCards from "./pages/ReportCards";
import ReportsCenter from "./pages/ReportsCenter";
import Staff from "./pages/Staff";
import StudentPortal from "./pages/StudentPortal";
import Students from "./pages/Students";
import TeacherAssignments from "./pages/TeacherAssignments";
import TeacherPortal from "./pages/TeacherPortal";
import TeacherGradeEntry from "./pages/TeacherGradeEntry";
import TeacherSchedule from "./pages/TeacherSchedule";
import Employees from "./pages/employees/Employees";


import AuditLogs from "./pages/AuditLogs";
import SystemSettings from "./pages/SystemSettings";
import ImportCenter from "./pages/ImportCenter";
import AcademicImport from "./pages/AcademicImport";
import LandingPage from "./pages/LandingPage";
import IDCards from "./pages/IDCards";
import Gallery from "./pages/Gallery";
import Certificates from "./pages/Certificates";
import StaffPortal from "./pages/StaffPortal";
import DeveloperDashboard from "./pages/DeveloperDashboard";
import UnifiedImportCenter from "./pages/UnifiedImportCenter";
import ClassroomAttendance from "./pages/ClassroomAttendance";
import Transcript from "./pages/Transcript";
import ClinicDashboard from "./pages/clinic/ClinicDashboard";
import ClinicVisits from "./pages/clinic/ClinicVisits";
import ClinicVisitForm from "./pages/clinic/ClinicVisitForm";
import ClinicMedicines from "./pages/clinic/ClinicMedicines";
import ClinicReferrals from "./pages/clinic/ClinicReferrals";
import ClinicHealthRecords from "./pages/clinic/ClinicHealthRecords";
const EXECUTIVE_ROLES = [
  "OWNER",
  "SUPER_ADMIN",
  "PRINCIPAL",
];

const ACADEMIC_MANAGEMENT_ROLES = [
  "SUPER_ADMIN",
  "PRINCIPAL",
  "VICE_PRINCIPAL",
  "REGISTRAR",
];

const STUDENT_MANAGEMENT_ROLES = [
  "SUPER_ADMIN",
  "PRINCIPAL",
  "VICE_PRINCIPAL",
  "REGISTRAR",
];

const EMPLOYEE_MANAGEMENT_ROLES = [
  "SUPER_ADMIN",
  "PRINCIPAL",
  "VICE_PRINCIPAL",
  "IT_ADMIN",
];

const EXAMINATION_ROLES = [
  "SUPER_ADMIN",
  "PRINCIPAL",
  "VICE_PRINCIPAL",
  "REGISTRAR",
  "TEACHER",
];

const FINANCE_ROLES = [
  "SUPER_ADMIN",
  "PRINCIPAL",
  "ACCOUNTANT",
  "REGISTRAR",
];

const ATTENDANCE_ROLES = [
  "SUPER_ADMIN",
  "PRINCIPAL",
  "VICE_PRINCIPAL",
  "REGISTRAR",
  "TEACHER",
];

const COMMUNICATION_ROLES = [
  "SUPER_ADMIN",
  "PRINCIPAL",
  "VICE_PRINCIPAL",
  "REGISTRAR",
  "ACCOUNTANT",
  "TEACHER",
  "IT_ADMIN",
];

const REPORT_ROLES = [
  "SUPER_ADMIN",
  "PRINCIPAL",
  "VICE_PRINCIPAL",
  "REGISTRAR",
  "ACCOUNTANT",
];

const SETTINGS_ROLES = [
  "SUPER_ADMIN",
  "IT_ADMIN",
  "DEVELOPER",
];



const AUDIT_ROLES = [
  "OWNER",
  "SUPER_ADMIN",
  "IT_ADMIN",
  "DEVELOPER",
  "PRINCIPAL",
];

const ID_CARD_ROLES = [
  "OWNER",
  "SUPER_ADMIN",
  "DEVELOPER",
  "IT_ADMIN",
  "PRINCIPAL",
  "VICE_PRINCIPAL",
  "REGISTRAR",
];

const IMPORT_ROLES = ["OWNER", "SUPER_ADMIN", "DEVELOPER", "IT_ADMIN", "REGISTRAR"];


const ACADEMIC_IMPORT_ROLES = [
  "OWNER",
  "SUPER_ADMIN",
  "DEVELOPER",
  "IT_ADMIN",
  "REGISTRAR",
  "PRINCIPAL",
];

const V2_ADMIN_ROLES = [
  "OWNER",
  "SUPER_ADMIN",
  "DEVELOPER",
  "IT_ADMIN",
  "PRINCIPAL",
  "VICE_PRINCIPAL",
  "REGISTRAR",
];

const V2_REPORT_ROLES = [
  "OWNER",
  "SUPER_ADMIN",
  "DEVELOPER",
  "PRINCIPAL",
  "VICE_PRINCIPAL",
  "REGISTRAR",
  "TEACHER",
];

const CLASSROOM_ATTENDANCE_ROLES = [
  "SUPER_ADMIN",
  "PRINCIPAL",
  "VICE_PRINCIPAL",
  "REGISTRAR",
  "TEACHER",
];

const STAFF_PORTAL_ROLES = [
  "SUPER_ADMIN",
  "DEVELOPER",
  "IT_ADMIN",
  "PRINCIPAL",
  "VICE_PRINCIPAL",
];

const CLINIC_ROLES = [
  "OWNER",
  "SUPER_ADMIN",
  "DEVELOPER",
  "IT_ADMIN",
  "PRINCIPAL",
  "VICE_PRINCIPAL",
  "CLINIC_ADMIN",
  "NURSE",
  "DOCTOR",
];

function Placeholder({ title }) {
  return (
    <div>
      <h1>{title}</h1>

      <p>
        This module will be completed in the next
        development stage.
      </p>
    </div>
  );
}


function HomeRedirect() {
  const { user } = useAuth();

  switch (user?.role) {
    case "TEACHER":
      return (
        <Navigate
          to="/teacher-portal"
          replace
        />
      );

    case "STUDENT":
      return (
        <Navigate
          to="/student-portal"
          replace
        />
      );

    case "PARENT":
      return (
        <Navigate
          to="/parent-portal"
          replace
        />
      );

    case "VICE_PRINCIPAL":
      return (
        <Navigate
          to="/vice-principal-dashboard"
          replace
        />
      );

    case "PRINCIPAL":
      return (
        <Navigate
          to="/principal-dashboard"
          replace
        />
      );

    default:
      return <Dashboard />;
  }
}


export default function App() {
  const { user, loading } = useAuth();

  if (loading) {
    return null;
  }

  return (
    <Routes>
      <Route
        path="/welcome"
        element={<LandingPage />}
      />

      <Route
        path="/login"
        element={
          user ? (
            <Navigate
              to="/"
              replace
            />
          ) : (
            <Login />
          )
        }
      />

      <Route
        element={
          user ? (
            <Layout />
          ) : (
            <Navigate
              to="/login"
              replace
            />
          )
        }
      >
        <Route
          path="/"
          element={<HomeRedirect />}
        />

        <Route
          path="/students"
          element={
            <RoleRoute
              roles={
                STUDENT_MANAGEMENT_ROLES
              }
            >
              <Students />
            </RoleRoute>
          }
        />

        <Route
          path="/enrollments"
          element={
            <RoleRoute
              roles={
                STUDENT_MANAGEMENT_ROLES
              }
            >
              <Enrollments />
            </RoleRoute>
          }
        />

        <Route
          path="/staff"
          element={
            <RoleRoute
              roles={
                EMPLOYEE_MANAGEMENT_ROLES
              }
            >
              <Staff />
            </RoleRoute>
          }
        />

        <Route
          path="/employees"
          element={
            <RoleRoute
              roles={
                EMPLOYEE_MANAGEMENT_ROLES
              }
            >
              <Employees />
            </RoleRoute>
          }
        />

        <Route
          path="/academics"
          element={
            <RoleRoute
              roles={
                ACADEMIC_MANAGEMENT_ROLES
              }
            >
              <Academics />
            </RoleRoute>
          }
        />

        <Route
          path="/teacher-assignments"
          element={
            <RoleRoute
              roles={
                ACADEMIC_MANAGEMENT_ROLES
              }
            >
              <TeacherAssignments />
            </RoleRoute>
          }
        />

        <Route
          path="/examinations"
          element={
            <RoleRoute
              roles={EXAMINATION_ROLES}
            >
              <Examinations />
            </RoleRoute>
          }
        />

        <Route
          path="/report-cards"
          element={
            <RoleRoute
              roles={EXAMINATION_ROLES}
            >
              <ReportCards />
            </RoleRoute>
          }
        />

        <Route
          path="/promotions"
          element={
            <RoleRoute
              roles={
                ACADEMIC_MANAGEMENT_ROLES
              }
            >
              <Promotions />
            </RoleRoute>
          }
        />

        <Route
          path="/finance"
          element={
            <RoleRoute
              roles={FINANCE_ROLES}
            >
              <Finance />
            </RoleRoute>
          }
        />

        <Route
          path="/attendance"
          element={
            <RoleRoute
              roles={ATTENDANCE_ROLES}
            >
              <Attendance />
            </RoleRoute>
          }
        />

        <Route
          path="/communications"
          element={
            <RoleRoute
              roles={COMMUNICATION_ROLES}
            >
              <Notices />
            </RoleRoute>
          }
        />

        <Route
          path="/teacher-schedule"
          element={
            <RoleRoute roles={["TEACHER"]}>
              <TeacherSchedule />
            </RoleRoute>
          }
        />

        <Route
          path="/teacher-grade-entry"
          element={
            <RoleRoute roles={["TEACHER"]}>
              <TeacherGradeEntry />
            </RoleRoute>
          }
        />

        <Route
          path="/teacher-portal"
          element={
            <RoleRoute
              roles={["TEACHER"]}
            >
              <TeacherPortal />
            </RoleRoute>
          }
        />

        <Route
          path="/student-portal"
          element={
            <RoleRoute
              roles={["STUDENT"]}
            >
              <StudentPortal />
            </RoleRoute>
          }
        />

        <Route
          path="/parent-portal"
          element={
            <RoleRoute
              roles={["PARENT"]}
            >
              <ParentPortal />
            </RoleRoute>
          }
        />

        <Route
          path="/vice-principal-dashboard"
          element={
            <RoleRoute
              roles={[
                "OWNER",
                "SUPER_ADMIN",
                "VICE_PRINCIPAL",
              ]}
            >
              <VicePrincipalDashboard />
            </RoleRoute>
          }
        />

        <Route
          path="/timetable"
          element={
            <RoleRoute
              roles={[
                "OWNER",
                "SUPER_ADMIN",
                "PRINCIPAL",
                "VICE_PRINCIPAL",
              ]}
            >
              <TimetableManager />
            </RoleRoute>
          }
        />

        <Route
          path="/principal-dashboard"
          element={
            <RoleRoute
              roles={EXECUTIVE_ROLES}
            >
              <PrincipalDashboard />
            </RoleRoute>
          }
        />

        <Route
          path="/owner-dashboard"
          element={
            <RoleRoute
              roles={["OWNER", "SUPER_ADMIN"]}
            >
              <OwnerDashboard />
            </RoleRoute>
          }
        />

        <Route
          path="/reports"
          element={
            <RoleRoute
              roles={REPORT_ROLES}
            >
              <ReportsCenter />
            </RoleRoute>
          }
        />


        <Route
          path="/audit-logs"
          element={
            <RoleRoute roles={AUDIT_ROLES}>
              <AuditLogs />
            </RoleRoute>
          }
        />

        <Route
          path="/import-center"
          element={
            <RoleRoute roles={IMPORT_ROLES}>
              <ImportCenter />
            </RoleRoute>
          }
        />


        <Route
          path="/academic-import"
          element={
            <RoleRoute roles={ACADEMIC_IMPORT_ROLES}>
              <AcademicImport />
            </RoleRoute>
          }
        />

        <Route
          path="/gallery"
          element={
            <RoleRoute roles={V2_ADMIN_ROLES}>
              <Gallery />
            </RoleRoute>
          }
        />

        <Route
          path="/certificates"
          element={
            <RoleRoute roles={V2_REPORT_ROLES}>
              <Certificates />
            </RoleRoute>
          }
        />

        <Route
          path="/transcripts"
          element={
            <RoleRoute roles={V2_REPORT_ROLES}>
              <Transcript />
            </RoleRoute>
          }
        />

        <Route
          path="/staff-portal"
          element={
            <RoleRoute roles={STAFF_PORTAL_ROLES}>
              <StaffPortal />
            </RoleRoute>
          }
        />

        <Route
          path="/developer-dashboard"
          element={
            <RoleRoute roles={["DEVELOPER", "SUPER_ADMIN"]}>
              <DeveloperDashboard />
            </RoleRoute>
          }
        />

        <Route
          path="/unified-import"
          element={
            <RoleRoute roles={V2_ADMIN_ROLES}>
              <UnifiedImportCenter />
            </RoleRoute>
          }
        />

        <Route
          path="/classroom-attendance"
          element={
            <RoleRoute roles={CLASSROOM_ATTENDANCE_ROLES}>
              <ClassroomAttendance />
            </RoleRoute>
          }
        />

        <Route
          path="/clinic"
          element={
            <RoleRoute roles={CLINIC_ROLES}>
              <ClinicDashboard />
            </RoleRoute>
          }
        />

        <Route
          path="/clinic/visits"
          element={
            <RoleRoute roles={CLINIC_ROLES}>
              <ClinicVisits />
            </RoleRoute>
          }
        />

        <Route
          path="/clinic/visits/new"
          element={
            <RoleRoute roles={CLINIC_ROLES}>
              <ClinicVisitForm />
            </RoleRoute>
          }
        />

        <Route
          path="/clinic/medicines"
          element={
            <RoleRoute roles={CLINIC_ROLES}>
              <ClinicMedicines />
            </RoleRoute>
          }
        />

        <Route
          path="/clinic/referrals"
          element={
            <RoleRoute roles={CLINIC_ROLES}>
              <ClinicReferrals />
            </RoleRoute>
          }
        />

        <Route
          path="/clinic/health-records"
          element={
            <RoleRoute roles={CLINIC_ROLES}>
              <ClinicHealthRecords />
            </RoleRoute>
          }
        />

        <Route
          path="/profile"
          element={
            <Placeholder title="My Profile" />
          }
        />

        <Route
          path="/id-cards"
          element={
            <RoleRoute roles={ID_CARD_ROLES}>
              <IDCards />
            </RoleRoute>
          }
        />

        <Route
          path="/settings"
          element={
            <RoleRoute
              roles={SETTINGS_ROLES}
            >
              <SystemSettings />
            </RoleRoute>
          }
        />
      </Route>

      <Route
        path="*"
        element={
          <Navigate
            to="/"
            replace
          />
        }
      />
    </Routes>
  );
}
