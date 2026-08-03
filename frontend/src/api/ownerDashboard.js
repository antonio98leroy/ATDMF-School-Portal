import api from "./client";

export const OwnerDashboardAPI = {
  getDashboard: () =>
    api.get("/academics/owner-dashboard/"),
};