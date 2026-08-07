import api from "./client";

const BASE = "/examinations/teacher";

export const TeacherGradeAPI = {
  getAssessments: (params = {}) =>
    api.get(`${BASE}/assessments/`, {
      params,
    }),

  createAssessment: (data) =>
    api.post(`${BASE}/assessments/`, data),

  getStudents: (
    assessmentId,
    params = {}
  ) =>
    api.get(
      `${BASE}/assessments/${assessmentId}/students/`,
      { params }
    ),

  saveScores: (
    assessmentId,
    data
  ) =>
    api.post(
      `${BASE}/assessments/${assessmentId}/scores/`,
      data
    ),
};

export default TeacherGradeAPI;
