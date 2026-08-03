import api from "./client";

const BASE = "/academic-import/batches";

export const AcademicImportAPI = {
  list: () => api.get(`${BASE}/`),

  preview: (data) =>
    api.post(`${BASE}/preview/`, data, {
      headers: {
        "Content-Type": "multipart/form-data",
      },
    }),

  confirm: (id) =>
    api.post(`${BASE}/${id}/confirm/`),

  rollback: (id) =>
    api.post(`${BASE}/${id}/rollback/`),
};
