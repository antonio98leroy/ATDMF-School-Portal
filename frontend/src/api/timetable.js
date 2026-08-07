import api from "./client";

const BASE = "/teacher-assignments";

export const TimetableAPI = {
  getPeriods: () =>
    api.get(`${BASE}/timetable/periods/`),

  getEntries: (params = {}) =>
    api.get(`${BASE}/timetable/entries/`, {
      params,
    }),

  createEntry: (data) =>
    api.post(`${BASE}/timetable/entries/`, data),

  updateEntry: (id, data) =>
    api.patch(
      `${BASE}/timetable/entries/${id}/`,
      data
    ),

  deleteEntry: (id) =>
    api.delete(
      `${BASE}/timetable/entries/${id}/`
    ),

  getMyTimetable: (params = {}) =>
    api.get(`${BASE}/portal/my-timetable/`, {
      params,
    }),
};

export default TimetableAPI;
