import api from "../client";

export const clinicApi = {
  getDashboard: () => api.get("/clinic/visits/dashboard/"),
  getVisits: (params = {}) => api.get("/clinic/visits/", { params }),
  createVisit: (payload) => api.post("/clinic/visits/", payload),
  getProfiles: (params = {}) => api.get("/clinic/profiles/", { params }),
  getMedicines: (params = {}) => api.get("/clinic/medicines/", { params }),
  getReferrals: (params = {}) => api.get("/clinic/referrals/", { params }),
};
