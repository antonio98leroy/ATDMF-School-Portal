import api from "./client";

const BASE = "/teacher-assignments";

export const TeacherAssignmentAPI = {
  getAssignments: (params = {}) =>
    api.get(`${BASE}/records/`, { params }),

  createAssignment: (data) =>
    api.post(`${BASE}/records/`, data),

  updateAssignment: (id, data) =>
    api.patch(`${BASE}/records/${id}/`, data),

  deleteAssignment: (id) =>
    api.delete(`${BASE}/records/${id}/`),

  getStatistics: (params = {}) =>
    api.get(`${BASE}/records/statistics/`, {
      params,
    }),

  getWorkload: (params = {}) =>
    api.get(`${BASE}/records/workload/`, {
      params,
    }),

  getTeachers: () =>
    api.get("/employees/records/teachers/"),

  getAcademicYears: () =>
    api.get("/academics/years/"),

  getTerms: () =>
    api.get("/academics/terms/"),

  getGrades: () =>
    api.get("/academics/grades/"),

  getClasses: () =>
    api.get("/academics/classes/"),

  getSubjects: () =>
    api.get("/academics/subjects/"),
};
