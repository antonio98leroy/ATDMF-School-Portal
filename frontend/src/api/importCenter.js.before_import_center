import api from "./client";

const BASE = "/import-center/batches";

export const ImportCenterAPI = {
  list: (params = {}) => api.get(`${BASE}/`, { params }),
  preview: (formData) => api.post(`${BASE}/preview/`, formData, { headers: { "Content-Type": "multipart/form-data" } }),
  confirm: (id) => api.post(`${BASE}/${id}/confirm/`),
  rollback: (id) => api.post(`${BASE}/${id}/rollback/`),
};
