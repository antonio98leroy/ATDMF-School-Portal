import api from "./client";

export const SchoolSettingsAPI = {
  get: () => api.get("/school-settings/"),
  update: (data) =>
    api.patch("/school-settings/", data, {
      headers: {
        "Content-Type": "multipart/form-data",
      },
    }),
};
