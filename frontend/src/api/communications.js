import api from "./client";

const BASE = "/communications";

export const CommunicationsAPI = {
  getSummary: () => api.get(`${BASE}/dashboard/summary/`),
  getNotices: (params = {}) => api.get(`${BASE}/notices/`, { params }),
  getNoticeStatistics: () => api.get(`${BASE}/notices/statistics/`),
  createNotice: (data) => api.post(`${BASE}/notices/`, data),
  publishNotice: (id) => api.post(`${BASE}/notices/${id}/publish/`),
  archiveNotice: (id) => api.post(`${BASE}/notices/${id}/archive/`),
  deleteNotice: (id) => api.delete(`${BASE}/notices/${id}/`),
  markNoticeRead: (id) => api.post(`${BASE}/notices/${id}/mark-read/`),

  getMessages: (params = {}) => api.get(`${BASE}/messages/`, { params }),
  getMessageStatistics: () => api.get(`${BASE}/messages/statistics/`),
  createMessage: (data) => api.post(`${BASE}/messages/`, data),
  markMessageRead: (id) => api.post(`${BASE}/messages/${id}/mark-read/`),
  archiveMessage: (id) => api.post(`${BASE}/messages/${id}/archive/`),
  restoreMessage: (id) => api.post(`${BASE}/messages/${id}/restore/`),

  getUsers: (params = {}) => api.get(`${BASE}/users/`, { params }),

  getDocuments: (params = {}) => api.get(`${BASE}/documents/`, { params }),
  createDocument: (data) =>
    api.post(`${BASE}/documents/`, data, {
      headers: { "Content-Type": "multipart/form-data" },
    }),
  deleteDocument: (id) => api.delete(`${BASE}/documents/${id}/`),
};