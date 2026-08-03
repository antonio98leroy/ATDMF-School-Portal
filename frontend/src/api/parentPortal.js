import api from "./client";

const BASE = "/students/parent-portal";

export const ParentPortalAPI = {
  getDashboard: () =>
    api.get(`${BASE}/dashboard/`),

  getAttendance: (
    student,
    params = {}
  ) =>
    api.get(`${BASE}/attendance/`, {
      params: {
        student,
        ...params,
      },
    }),

  getResults: (
    student,
    academicYear = ""
  ) =>
    api.get(`${BASE}/results/`, {
      params: {
        student,
        ...(academicYear
          ? {
              academic_year:
                academicYear,
            }
          : {}),
      },
    }),

  getEnrollments: (student) =>
    api.get(`${BASE}/enrollments/`, {
      params: {
        student,
      },
    }),
};
