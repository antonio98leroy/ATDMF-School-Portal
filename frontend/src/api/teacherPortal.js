import api from "./client";

const BASE = "/teacher-assignments/portal";

export const TeacherPortalAPI = {
  getDashboard: () =>
    api.get(`${BASE}/dashboard/`),

  getAssignments: (params = {}) =>
    api.get(`${BASE}/assignments/`, {
      params,
    }),

  getStudents: (
    classSection,
    academicYear
  ) =>
    api.get(`${BASE}/students/`, {
      params: {
        class_section: classSection,
        academic_year: academicYear,
      },
    }),

  getAttendanceSummary: (
    classSection,
    term = ""
  ) =>
    api.get(`${BASE}/attendance-summary/`, {
      params: {
        class_section: classSection,
        ...(term ? { term } : {}),
      },
    }),
};
