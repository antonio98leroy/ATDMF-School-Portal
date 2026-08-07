import api from "./client";

const BASE = "/attendance/classroom";

export const ClassroomAttendanceAPI = {
  getRoster: (params = {}) =>
    api.get(`${BASE}/roster/`, { params }),

  submitAttendance: (data) =>
    api.post(`${BASE}/submit/`, data),
};

export default ClassroomAttendanceAPI;
