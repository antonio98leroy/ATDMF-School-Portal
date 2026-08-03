import api from "./client";

export const PrincipalDashboardAPI = {
  getDashboard: () =>
    api.get(
      "/academics/principal-dashboard/"
    ),
};
