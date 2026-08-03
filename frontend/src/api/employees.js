import api from "./client";

const BASE = "/employees";

export const EmployeeAPI = {
  // Employees
  getEmployees: (params = {}) =>
    api.get(`${BASE}/records/`, { params }),

  getEmployee: (id) =>
    api.get(`${BASE}/records/${id}/`),

  createEmployee: (data) =>
    api.post(`${BASE}/records/`, data, {
      headers: {
        "Content-Type": "multipart/form-data",
      },
    }),

  updateEmployee: (id, data) =>
    api.patch(`${BASE}/records/${id}/`, data, {
      headers: {
        "Content-Type": "multipart/form-data",
      },
    }),

  deleteEmployee: (id) =>
    api.delete(`${BASE}/records/${id}/`),

  // Statistics
  getStatistics: () =>
    api.get(`${BASE}/records/statistics/`),

  // Teachers
  getTeachers: () =>
    api.get(`${BASE}/records/teachers/`),

  // Lookup
  lookup: (search) =>
    api.get(`${BASE}/records/lookup/`, {
      params: { search },
    }),

  // Departments
  getDepartments: () =>
    api.get(`${BASE}/departments/`),

  createDepartment: (data) =>
    api.post(`${BASE}/departments/`, data),

  updateDepartment: (id, data) =>
    api.patch(`${BASE}/departments/${id}/`, data),

  deleteDepartment: (id) =>
    api.delete(`${BASE}/departments/${id}/`),

  // Positions
  getPositions: () =>
    api.get(`${BASE}/positions/`),

  createPosition: (data) =>
    api.post(`${BASE}/positions/`, data),

  updatePosition: (id, data) =>
    api.patch(`${BASE}/positions/${id}/`, data),

  deletePosition: (id) =>
    api.delete(`${BASE}/positions/${id}/`),
};