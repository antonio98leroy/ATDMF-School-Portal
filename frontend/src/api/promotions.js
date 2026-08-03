import api from "./client";

const BASE = "/academics/promotions";

export const PromotionAPI = {
  getRecords: (params = {}) =>
    api.get(`${BASE}/`, { params }),

  getClassStudents: (
    academicYear,
    classSection
  ) =>
    api.get(`${BASE}/class-students/`, {
      params: {
        academic_year: academicYear,
        class_section: classSection,
      },
    }),

  processStudents: (data) =>
    api.post(`${BASE}/bulk-process/`, data),

  getStatistics: (params = {}) =>
    api.get(`${BASE}/statistics/`, {
      params,
    }),

  getAcademicYears: () =>
    api.get("/academics/years/"),

  getGrades: () =>
    api.get("/academics/grades/"),

  getClasses: () =>
    api.get("/academics/classes/"),
};
