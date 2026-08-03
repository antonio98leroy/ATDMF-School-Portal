import api from "./client";

const BASE = "/finance";

export const FinanceAPI = {
  getDashboard: (params = {}) =>
    api.get(`${BASE}/reports/dashboard/`, { params }),

  getOutstandingStudents: (params = {}) =>
    api.get(`${BASE}/reports/outstanding-students/`, {
      params,
    }),

  getUnsponsoredReport: (params = {}) =>
    api.get(
      `${BASE}/sponsorships/unsponsored-report/`,
      { params }
    ),

  getStudents: (params = {}) =>
    api.get("/students/records/", { params }),

  getAcademicYears: (params = {}) =>
    api.get("/academics/years/", { params }),

  getTerms: (params = {}) =>
    api.get("/academics/terms/", { params }),

  getSponsors: (params = {}) =>
    api.get(`${BASE}/sponsors/`, { params }),

  createSponsor: (data) =>
    api.post(`${BASE}/sponsors/`, data),

  updateSponsor: (id, data) =>
    api.patch(`${BASE}/sponsors/${id}/`, data),

  getSponsorships: (params = {}) =>
    api.get(`${BASE}/sponsorships/`, { params }),

  createSponsorship: (data) =>
    api.post(`${BASE}/sponsorships/`, data),

  updateSponsorship: (id, data) =>
    api.patch(`${BASE}/sponsorships/${id}/`, data),

  getBankAccounts: (params = {}) =>
    api.get(`${BASE}/bank-accounts/`, { params }),

  createBankAccount: (data) =>
    api.post(`${BASE}/bank-accounts/`, data),

  getBankDeposits: (params = {}) =>
    api.get(`${BASE}/bank-deposits/`, { params }),

  getBankDepositSummary: (params = {}) =>
    api.get(`${BASE}/bank-deposits/summary/`, {
      params,
    }),

  createBankDeposit: (data) =>
    api.post(`${BASE}/bank-deposits/`, data),

  verifyBankDeposit: (id) =>
    api.post(`${BASE}/bank-deposits/${id}/verify/`),

  rejectBankDeposit: (id, reason) =>
    api.post(`${BASE}/bank-deposits/${id}/reject/`, {
      reason,
    }),

  reconcileBankDeposit: (id) =>
    api.post(
      `${BASE}/bank-deposits/${id}/reconcile/`
    ),

  getBankStatements: (params = {}) =>
    api.get(`${BASE}/bank-statements/`, { params }),

  getBankStatement: (id) =>
    api.get(`${BASE}/bank-statements/${id}/`),

  uploadBankStatement: (data) =>
    api.post(`${BASE}/bank-statements/`, data, {
      headers: {
        "Content-Type": "multipart/form-data",
      },
    }),

  autoMatchBankStatement: (id) =>
    api.post(
      `${BASE}/bank-statements/${id}/auto-match/`
    ),

  getStatementTransactions: (params = {}) =>
    api.get(
      `${BASE}/bank-statement-transactions/`,
      { params }
    ),

  createStatementTransaction: (data) =>
    api.post(
      `${BASE}/bank-statement-transactions/`,
      data
    ),

  getInvoices: (params = {}) =>
    api.get(`${BASE}/invoices/`, { params }),

  createInvoice: (data) =>
    api.post(`${BASE}/invoices/`, data),

  getInvoiceStatement: (id) =>
    api.get(`${BASE}/invoices/${id}/statement/`),

  getPayments: (params = {}) =>
    api.get(`${BASE}/payments/`, { params }),

  getOfficialReceipt: (id) =>
    api.get(
      `${BASE}/payments/${id}/official-receipt/`
    ),

  markReceiptPrinted: (id) =>
    api.post(
      `${BASE}/payments/${id}/mark-receipt-printed/`
    ),

  getExpenseCategories: (params = {}) =>
    api.get(`${BASE}/expense-categories/`, {
      params,
    }),

  createExpenseCategory: (data) =>
    api.post(`${BASE}/expense-categories/`, data),

  getExpenses: (params = {}) =>
    api.get(`${BASE}/expenses/`, { params }),

  createExpense: (data) =>
    api.post(`${BASE}/expenses/`, data),

  approveExpenses: (expenseIds) =>
    api.post(`${BASE}/expenses/approve/`, {
      expense_ids: expenseIds,
    }),
};