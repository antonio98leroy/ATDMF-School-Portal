import api from "./client";
export const AuditAPI={
  getLogs:(params={})=>api.get("/audit/logs/",{params}),
  getSummary:(params={})=>api.get("/audit/logs/summary/",{params}),
};
