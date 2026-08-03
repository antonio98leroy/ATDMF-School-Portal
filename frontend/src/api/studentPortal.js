import api from "./client";

const BASE = "/students/portal";

export const StudentPortalAPI = {
  getDashboard: () =>
    api.get(`${BASE}/dashboard/`),

  getEnrollments: () =>
    api.get(`${BASE}/enrollments/`),

  getAttendance: (params = {}) =>
    api.get(`${BASE}/attendance/`, {
      params,
    }),

  getResults: (academicYear = "") =>
    api.get(`${BASE}/results/`, {
      params: academicYear
        ? {
            academic_year: academicYear,
          }
        : {},
    }),
};
