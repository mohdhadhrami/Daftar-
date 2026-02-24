export interface User {
  id: string;
  email: string;
  firstName: string;
  lastName: string;
}

export interface Company {
  id: string;
  name: string;
  slug: string;
  currency: string;
  role?: string;
}

export interface Account {
  id: string;
  code: string;
  name: string;
  accountType: 'asset' | 'liability' | 'equity' | 'revenue' | 'expense';
  subType?: string;
  parentId?: string;
  isActive: boolean;
  normalBalance: 'debit' | 'credit';
  description?: string;
}

export interface JournalLine {
  id: string;
  accountId: string;
  account?: Account;
  description?: string;
  debit: number;
  credit: number;
  currency: string;
}

export interface JournalEntry {
  id: string;
  entryNumber: string;
  entryDate: string;
  description: string;
  reference?: string;
  status: 'draft' | 'posted' | 'voided';
  source: string;
  lines: JournalLine[];
  createdBy?: { id: string; firstName: string; lastName: string };
  createdAt: string;
}

export interface InvoiceLine {
  id: string;
  description: string;
  quantity: number;
  unitPrice: number;
  taxRate: number;
  taxAmount: number;
  lineTotal: number;
  accountId: string;
}

export interface Invoice {
  id: string;
  invoiceNumber: string;
  type: 'sales' | 'purchase';
  status: string;
  contactId: string;
  contact?: { id: string; name: string; email?: string };
  issueDate: string;
  dueDate: string;
  subtotal: number;
  taxAmount: number;
  totalAmount: number;
  amountPaid: number;
  amountDue: number;
  lines: InvoiceLine[];
  createdAt: string;
}

export interface Payment {
  id: string;
  paymentNumber: string;
  type: 'received' | 'made';
  invoiceId?: string;
  contactId: string;
  contact?: { id: string; name: string };
  amount: number;
  paymentDate: string;
  paymentMethod: string;
  reference?: string;
}

export interface AuditLog {
  id: string;
  userId: string;
  user?: User;
  action: string;
  entity: string;
  entityId?: string;
  oldValues?: Record<string, unknown>;
  newValues?: Record<string, unknown>;
  createdAt: string;
}

export interface Pagination {
  page: number;
  limit: number;
  total: number;
  pages: number;
}

export interface ApiResponse<T> {
  success: boolean;
  data: T;
  timestamp: string;
}

export interface TrialBalance {
  accounts: Array<{
    accountId: string;
    accountCode: string;
    accountName: string;
    accountType: string;
    debit: number;
    credit: number;
    balance: number;
  }>;
  totalDebit: number;
  totalCredit: number;
}

export interface IncomeStatement {
  period: { startDate: string; endDate: string };
  revenue: Array<{ accountCode: string; accountName: string; amount: number }>;
  totalRevenue: number;
  expenses: Array<{ accountCode: string; accountName: string; amount: number }>;
  totalExpenses: number;
  netIncome: number;
}

export interface BalanceSheet {
  asOfDate: string;
  assets: Array<{ accountCode: string; accountName: string; balance: number }>;
  totalAssets: number;
  liabilities: Array<{ accountCode: string; accountName: string; balance: number }>;
  totalLiabilities: number;
  equity: Array<{ accountCode: string; accountName: string; balance: number }>;
  totalEquity: number;
  isBalanced: boolean;
}
