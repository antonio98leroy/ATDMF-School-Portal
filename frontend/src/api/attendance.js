import api from "./client";

const BASE = "/attendance";

export const AttendanceAPI = {
  getStudentRecords: (params = {}) =>
    api.get(`${BASE}/records/`, {
      params,
    }),

  getStudentStatistics: (params = {}) =>
    api.get(
      `${BASE}/records/statistics/`,
      {
        params,
      }
    ),

  getClassRegister: (params = {}) =>
    api.get(
      `${BASE}/records/class-register/`,
      {
        params,
      }
    ),

  saveClassAttendance: (data) =>
    api.post(
      `${BASE}/records/bulk-save/`,
      data
    ),

  getDailySummary: (params = {}) =>
    api.get(
      `${BASE}/records/daily-summary/`,
      {
        params,
      }
    ),

  getFrequentAbsentees: (
    params = {}
  ) =>
    api.get(
      `${BASE}/records/frequent-absentees/`,
      {
        params,
      }
    ),

  getEmployeeRecords: (params = {}) =>
    api.get(`${BASE}/employees/`, {
      params,
    }),

  getEmployeeRegister: (
    params = {}
  ) =>
    api.get(
      `${BASE}/employees/daily-register/`,
      {
        params,
      }
    ),

  saveEmployeeAttendance: (data) =>
    api.post(
      `${BASE}/employees/bulk-save/`,
      data
    ),

  getEmployeeStatistics: (
    params = {}
  ) =>
    api.get(
      `${BASE}/employees/statistics/`,
      {
        params,
      }
    ),

  getAcademicYears: (params = {}) =>
    api.get("/academics/years/", {
      params,
    }),

  getTerms: (params = {}) =>
    api.get("/academics/terms/", {
      params,
    }),

  getClasses: (params = {}) =>
    api.get("/academics/classes/", {
      params,
    }),
};
