import api from "./client";

const BASE = "/academics/reports";

export const ReportsAPI = {
  getSummary: (params = {}) =>
    api.get(`${BASE}/summary/`, { params }),

  getStudents: (params = {}) =>
    api.get(`${BASE}/students/`, { params }),

  getSponsorships: (params = {}) =>
    api.get(`${BASE}/sponsorships/`, {
      params,
    }),

  getAttendance: (params = {}) =>
    api.get(`${BASE}/attendance/`, {
      params,
    }),

  getFinance: (params = {}) =>
    api.get(`${BASE}/finance/`, { params }),

  getPromotions: (params = {}) =>
    api.get(`${BASE}/promotions/`, {
      params,
    }),

  getEmployees: (params = {}) =>
    api.get(`${BASE}/employees/`, {
      params,
    }),

  getAcademicPerformance: (params = {}) =>
    api.get(
      `${BASE}/academic-performance/`,
      { params }
    ),

  getAcademicYears: (params = {}) =>
    api.get("/academics/years/", { params }),

  getClasses: (params = {}) =>
    api.get("/academics/classes/", { params }),
};