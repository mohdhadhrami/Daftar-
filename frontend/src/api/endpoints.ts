import apiClient from './client';

// Auth
export const authApi = {
  login: (data: { email: string; password: string }) =>
    apiClient.post('/auth/login', data),
  register: (data: {
    email: string;
    password: string;
    firstName: string;
    lastName: string;
    companyName?: string;
  }) => apiClient.post('/auth/register', data),
  logout: () => apiClient.post('/auth/logout'),
  refresh: (refreshToken: string) =>
    apiClient.post('/auth/refresh', { refreshToken }),
};

// Companies
export const companiesApi = {
  getCurrent: () => apiClient.get('/companies/current'),
  getMyCompanies: () => apiClient.get('/companies/my'),
  getMembers: () => apiClient.get('/companies/current/members'),
  inviteMember: (data: { email: string; role: string }) =>
    apiClient.post('/companies/current/members', data),
};

// Chart of Accounts
export const accountsApi = {
  getAll: (type?: string) =>
    apiClient.get('/accounts', { params: { type } }),
  getById: (id: string) => apiClient.get(`/accounts/${id}`),
  create: (data: any) => apiClient.post('/accounts', data),
  update: (id: string, data: any) => apiClient.put(`/accounts/${id}`, data),
  delete: (id: string) => apiClient.delete(`/accounts/${id}`),
  seedDefaults: () => apiClient.post('/accounts/seed'),
};

// Journal Entries
export const journalsApi = {
  getAll: (params?: any) => apiClient.get('/journals', { params }),
  getById: (id: string) => apiClient.get(`/journals/${id}`),
  create: (data: any) => apiClient.post('/journals', data),
  post: (id: string) => apiClient.post(`/journals/${id}/post`),
  void: (id: string, reason: string) =>
    apiClient.post(`/journals/${id}/void`, { reason }),
};

// Invoices
export const invoicesApi = {
  getAll: (params?: any) => apiClient.get('/invoices', { params }),
  getById: (id: string) => apiClient.get(`/invoices/${id}`),
  create: (data: any) => apiClient.post('/invoices', data),
  post: (id: string) => apiClient.post(`/invoices/${id}/post`),
};

// Payments
export const paymentsApi = {
  getAll: (params?: any) => apiClient.get('/payments', { params }),
  getById: (id: string) => apiClient.get(`/payments/${id}`),
  create: (data: any) => apiClient.post('/payments', data),
};

// Reports
export const reportsApi = {
  getTrialBalance: (asOfDate?: string) =>
    apiClient.get('/reports/trial-balance', { params: { asOfDate } }),
  getIncomeStatement: (startDate: string, endDate: string) =>
    apiClient.get('/reports/income-statement', { params: { startDate, endDate } }),
  getBalanceSheet: (asOfDate?: string) =>
    apiClient.get('/reports/balance-sheet', { params: { asOfDate } }),
  getCashFlow: (startDate: string, endDate: string) =>
    apiClient.get('/reports/cash-flow', { params: { startDate, endDate } }),
};

// AI
export const aiApi = {
  categorizeExpense: (data: { description: string; amount: number }) =>
    apiClient.post('/ai/categorize-expense', data),
  detectAnomalies: (startDate: string, endDate: string) =>
    apiClient.get('/ai/anomalies', { params: { startDate, endDate } }),
  forecastCashFlow: (months?: number) =>
    apiClient.get('/ai/forecast', { params: { months } }),
  queryFinancials: (question: string) =>
    apiClient.post('/ai/query', { question }),
};

// Audit Logs
export const auditApi = {
  getAll: (params?: any) => apiClient.get('/audit-logs', { params }),
};

// Fiscal Periods
export const periodsApi = {
  getAll: () => apiClient.get('/fiscal-periods'),
  create: (data: { name: string; startDate: string; endDate: string }) =>
    apiClient.post('/fiscal-periods', data),
  lock: (id: string) => apiClient.post(`/fiscal-periods/${id}/lock`),
  unlock: (id: string) => apiClient.post(`/fiscal-periods/${id}/unlock`),
};
