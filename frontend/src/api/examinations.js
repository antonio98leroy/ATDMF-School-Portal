import api from "./client";

const BASE = "/examinations";

export const ExaminationAPI = {
  // Result periods
  getPeriods: (params = {}) =>
    api.get(`${BASE}/periods/`, { params }),

  createYearPeriods: (academicYear) =>
    api.post(`${BASE}/periods/create-year-periods/`, {
      academic_year: academicYear,
    }),

  updatePeriod: (id, data) =>
    api.patch(`${BASE}/periods/${id}/`, data),

  // Subject results
  getResults: (params = {}) =>
    api.get(`${BASE}/results/`, { params }),

  createResult: (data) =>
    api.post(`${BASE}/results/`, data),

  updateResult: (id, data) =>
    api.patch(`${BASE}/results/${id}/`, data),

  deleteResult: (id) =>
    api.delete(`${BASE}/results/${id}/`),

  bulkSaveResults: (records) =>
    api.post(`${BASE}/results/bulk-save/`, {
      records,
    }),

  approveResults: (resultIds) =>
    api.post(`${BASE}/results/approve/`, {
      result_ids: resultIds,
    }),

  publishResults: (resultIds) =>
    api.post(`${BASE}/results/publish/`, {
      result_ids: resultIds,
    }),

 getReportCard: (student, academicYear) =>
  api.get("/examinations/results/report-card/", {
    params: {student, academic_year: academicYear,
    },
  }),

getClassSummary: (classSection, academicYear) =>
  api.get("/examinations/results/class-summary/", {
    params: {
      class_section: classSection,
      academic_year: academicYear,
    },
  }),

  // Grade scales
  getGradeScales: (params = {}) =>
    api.get(`${BASE}/grades/`, { params }),

  createGradeScale: (data) =>
    api.post(`${BASE}/grades/`, data),

  updateGradeScale: (id, data) =>
    api.patch(`${BASE}/grades/${id}/`, data),

  deleteGradeScale: (id) =>
    api.delete(`${BASE}/grades/${id}/`),

  // Academic reference data
  getAcademicYears: () =>
    api.get("/academics/years/"),

  getGrades: () =>
    api.get("/academics/grades/"),

  getClasses: () =>
    api.get("/academics/classes/"),

  getSubjects: () =>
    api.get("/academics/subjects/"),

  getEnrollments: () =>
    api.get("/academics/enrollments/"),

  getStudents: () =>
    api.get("/students/records/"),
};
