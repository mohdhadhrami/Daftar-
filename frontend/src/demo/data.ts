import { User, Company, Account, JournalEntry, Invoice, Payment, AuditLog } from '../types';

export const DEMO_USER: User = {
  id: 'demo-user-001',
  email: 'demo@daftar.app',
  firstName: 'Ahmed',
  lastName: 'Al-Rashid',
};

export const DEMO_COMPANY: Company = {
  id: 'demo-company-001',
  name: 'Daftar Technologies',
  slug: 'daftar-tech',
  currency: 'SAR',
  role: 'owner',
};

export const DEMO_ACCOUNTS: Account[] = [
  { id: 'a1', code: '1000', name: 'Cash', accountType: 'asset', subType: 'current_asset', isActive: true, normalBalance: 'debit' },
  { id: 'a2', code: '1100', name: 'Accounts Receivable', accountType: 'asset', subType: 'current_asset', isActive: true, normalBalance: 'debit' },
  { id: 'a3', code: '1200', name: 'Inventory', accountType: 'asset', subType: 'current_asset', isActive: true, normalBalance: 'debit' },
  { id: 'a4', code: '1500', name: 'Equipment', accountType: 'asset', subType: 'fixed_asset', isActive: true, normalBalance: 'debit' },
  { id: 'a5', code: '1510', name: 'Accumulated Depreciation', accountType: 'asset', subType: 'fixed_asset', isActive: true, normalBalance: 'credit' },
  { id: 'a6', code: '2000', name: 'Accounts Payable', accountType: 'liability', subType: 'current_liability', isActive: true, normalBalance: 'credit' },
  { id: 'a7', code: '2100', name: 'Accrued Expenses', accountType: 'liability', subType: 'current_liability', isActive: true, normalBalance: 'credit' },
  { id: 'a8', code: '2500', name: 'Long-term Loan', accountType: 'liability', subType: 'long_term_liability', isActive: true, normalBalance: 'credit' },
  { id: 'a9', code: '3000', name: 'Owner\'s Capital', accountType: 'equity', isActive: true, normalBalance: 'credit' },
  { id: 'a10', code: '3100', name: 'Retained Earnings', accountType: 'equity', isActive: true, normalBalance: 'credit' },
  { id: 'a11', code: '4000', name: 'Sales Revenue', accountType: 'revenue', isActive: true, normalBalance: 'credit' },
  { id: 'a12', code: '4100', name: 'Service Revenue', accountType: 'revenue', isActive: true, normalBalance: 'credit' },
  { id: 'a13', code: '4200', name: 'Interest Income', accountType: 'revenue', isActive: true, normalBalance: 'credit' },
  { id: 'a14', code: '5000', name: 'Cost of Goods Sold', accountType: 'expense', isActive: true, normalBalance: 'debit' },
  { id: 'a15', code: '6000', name: 'Salaries & Wages', accountType: 'expense', isActive: true, normalBalance: 'debit' },
  { id: 'a16', code: '6100', name: 'Rent Expense', accountType: 'expense', isActive: true, normalBalance: 'debit' },
  { id: 'a17', code: '6200', name: 'Utilities Expense', accountType: 'expense', isActive: true, normalBalance: 'debit' },
  { id: 'a18', code: '6300', name: 'Office Supplies', accountType: 'expense', isActive: true, normalBalance: 'debit' },
  { id: 'a19', code: '6400', name: 'Marketing Expense', accountType: 'expense', isActive: true, normalBalance: 'debit' },
  { id: 'a20', code: '6500', name: 'Depreciation Expense', accountType: 'expense', isActive: true, normalBalance: 'debit' },
  { id: 'a21', code: '6600', name: 'Insurance Expense', accountType: 'expense', isActive: true, normalBalance: 'debit' },
  { id: 'a22', code: '6700', name: 'Travel Expense', accountType: 'expense', isActive: true, normalBalance: 'debit' },
];

export const DEMO_JOURNALS: JournalEntry[] = [
  {
    id: 'j1', entryNumber: 'JE-0001', entryDate: '2026-01-05', description: 'Initial capital investment',
    status: 'posted', source: 'manual', createdAt: '2026-01-05T10:00:00Z',
    createdBy: { id: DEMO_USER.id, firstName: 'Ahmed', lastName: 'Al-Rashid' },
    lines: [
      { id: 'jl1', accountId: 'a1', account: DEMO_ACCOUNTS[0], debit: 500000, credit: 0, currency: 'SAR' },
      { id: 'jl2', accountId: 'a9', account: DEMO_ACCOUNTS[8], debit: 0, credit: 500000, currency: 'SAR' },
    ],
  },
  {
    id: 'j2', entryNumber: 'JE-0002', entryDate: '2026-01-10', description: 'Equipment purchase',
    status: 'posted', source: 'manual', createdAt: '2026-01-10T14:30:00Z',
    createdBy: { id: DEMO_USER.id, firstName: 'Ahmed', lastName: 'Al-Rashid' },
    lines: [
      { id: 'jl3', accountId: 'a4', account: DEMO_ACCOUNTS[3], debit: 75000, credit: 0, currency: 'SAR' },
      { id: 'jl4', accountId: 'a1', account: DEMO_ACCOUNTS[0], debit: 0, credit: 75000, currency: 'SAR' },
    ],
  },
  {
    id: 'j3', entryNumber: 'JE-0003', entryDate: '2026-01-15', description: 'Monthly rent payment',
    status: 'posted', source: 'manual', createdAt: '2026-01-15T09:00:00Z',
    createdBy: { id: DEMO_USER.id, firstName: 'Ahmed', lastName: 'Al-Rashid' },
    lines: [
      { id: 'jl5', accountId: 'a16', account: DEMO_ACCOUNTS[15], debit: 15000, credit: 0, currency: 'SAR' },
      { id: 'jl6', accountId: 'a1', account: DEMO_ACCOUNTS[0], debit: 0, credit: 15000, currency: 'SAR' },
    ],
  },
  {
    id: 'j4', entryNumber: 'JE-0004', entryDate: '2026-01-20', description: 'Service revenue - Project Alpha',
    status: 'posted', source: 'invoice', createdAt: '2026-01-20T11:00:00Z',
    createdBy: { id: DEMO_USER.id, firstName: 'Ahmed', lastName: 'Al-Rashid' },
    lines: [
      { id: 'jl7', accountId: 'a2', account: DEMO_ACCOUNTS[1], debit: 120000, credit: 0, currency: 'SAR' },
      { id: 'jl8', accountId: 'a12', account: DEMO_ACCOUNTS[11], debit: 0, credit: 120000, currency: 'SAR' },
    ],
  },
  {
    id: 'j5', entryNumber: 'JE-0005', entryDate: '2026-01-25', description: 'Salary payments - January',
    status: 'posted', source: 'manual', createdAt: '2026-01-25T16:00:00Z',
    createdBy: { id: DEMO_USER.id, firstName: 'Ahmed', lastName: 'Al-Rashid' },
    lines: [
      { id: 'jl9', accountId: 'a15', account: DEMO_ACCOUNTS[14], debit: 85000, credit: 0, currency: 'SAR' },
      { id: 'jl10', accountId: 'a1', account: DEMO_ACCOUNTS[0], debit: 0, credit: 85000, currency: 'SAR' },
    ],
  },
  {
    id: 'j6', entryNumber: 'JE-0006', entryDate: '2026-02-01', description: 'Product sales - Batch 1',
    status: 'posted', source: 'invoice', createdAt: '2026-02-01T10:00:00Z',
    createdBy: { id: DEMO_USER.id, firstName: 'Ahmed', lastName: 'Al-Rashid' },
    lines: [
      { id: 'jl11', accountId: 'a2', account: DEMO_ACCOUNTS[1], debit: 95000, credit: 0, currency: 'SAR' },
      { id: 'jl12', accountId: 'a11', account: DEMO_ACCOUNTS[10], debit: 0, credit: 95000, currency: 'SAR' },
    ],
  },
  {
    id: 'j7', entryNumber: 'JE-0007', entryDate: '2026-02-05', description: 'Marketing campaign payment',
    status: 'posted', source: 'manual', createdAt: '2026-02-05T14:00:00Z',
    createdBy: { id: DEMO_USER.id, firstName: 'Ahmed', lastName: 'Al-Rashid' },
    lines: [
      { id: 'jl13', accountId: 'a19', account: DEMO_ACCOUNTS[18], debit: 25000, credit: 0, currency: 'SAR' },
      { id: 'jl14', accountId: 'a1', account: DEMO_ACCOUNTS[0], debit: 0, credit: 25000, currency: 'SAR' },
    ],
  },
  {
    id: 'j8', entryNumber: 'JE-0008', entryDate: '2026-02-10', description: 'Client payment received',
    status: 'posted', source: 'payment', createdAt: '2026-02-10T09:30:00Z',
    createdBy: { id: DEMO_USER.id, firstName: 'Ahmed', lastName: 'Al-Rashid' },
    lines: [
      { id: 'jl15', accountId: 'a1', account: DEMO_ACCOUNTS[0], debit: 120000, credit: 0, currency: 'SAR' },
      { id: 'jl16', accountId: 'a2', account: DEMO_ACCOUNTS[1], debit: 0, credit: 120000, currency: 'SAR' },
    ],
  },
  {
    id: 'j9', entryNumber: 'JE-0009', entryDate: '2026-02-15', description: 'Office supplies purchase',
    status: 'draft', source: 'manual', createdAt: '2026-02-15T11:00:00Z',
    createdBy: { id: DEMO_USER.id, firstName: 'Ahmed', lastName: 'Al-Rashid' },
    lines: [
      { id: 'jl17', accountId: 'a18', account: DEMO_ACCOUNTS[17], debit: 3500, credit: 0, currency: 'SAR' },
      { id: 'jl18', accountId: 'a1', account: DEMO_ACCOUNTS[0], debit: 0, credit: 3500, currency: 'SAR' },
    ],
  },
];

export const DEMO_INVOICES: Invoice[] = [
  {
    id: 'inv1', invoiceNumber: 'INV-0001', type: 'sales', status: 'paid',
    contactId: 'c1', contact: { id: 'c1', name: 'Acme Corporation', email: 'billing@acme.com' },
    issueDate: '2026-01-20', dueDate: '2026-02-20',
    subtotal: 120000, taxAmount: 18000, totalAmount: 138000, amountPaid: 138000, amountDue: 0,
    lines: [{ id: 'il1', description: 'Project Alpha - Consulting Services', quantity: 1, unitPrice: 120000, taxRate: 15, taxAmount: 18000, lineTotal: 138000, accountId: 'a12' }],
    createdAt: '2026-01-20T11:00:00Z',
  },
  {
    id: 'inv2', invoiceNumber: 'INV-0002', type: 'sales', status: 'sent',
    contactId: 'c2', contact: { id: 'c2', name: 'Beta Industries', email: 'ap@beta.com' },
    issueDate: '2026-02-01', dueDate: '2026-03-01',
    subtotal: 95000, taxAmount: 14250, totalAmount: 109250, amountPaid: 0, amountDue: 109250,
    lines: [{ id: 'il2', description: 'Product Batch 1 - Software Licenses', quantity: 50, unitPrice: 1900, taxRate: 15, taxAmount: 14250, lineTotal: 109250, accountId: 'a11' }],
    createdAt: '2026-02-01T10:00:00Z',
  },
  {
    id: 'inv3', invoiceNumber: 'INV-0003', type: 'purchase', status: 'paid',
    contactId: 'c3', contact: { id: 'c3', name: 'Office World Supplies', email: 'sales@officeworld.com' },
    issueDate: '2026-01-10', dueDate: '2026-02-10',
    subtotal: 75000, taxAmount: 11250, totalAmount: 86250, amountPaid: 86250, amountDue: 0,
    lines: [{ id: 'il3', description: 'Office Equipment - Workstations', quantity: 10, unitPrice: 7500, taxRate: 15, taxAmount: 11250, lineTotal: 86250, accountId: 'a4' }],
    createdAt: '2026-01-10T14:30:00Z',
  },
  {
    id: 'inv4', invoiceNumber: 'INV-0004', type: 'sales', status: 'draft',
    contactId: 'c4', contact: { id: 'c4', name: 'Delta Solutions', email: 'finance@delta.com' },
    issueDate: '2026-02-20', dueDate: '2026-03-20',
    subtotal: 45000, taxAmount: 6750, totalAmount: 51750, amountPaid: 0, amountDue: 51750,
    lines: [{ id: 'il4', description: 'Cloud Infrastructure Setup', quantity: 1, unitPrice: 45000, taxRate: 15, taxAmount: 6750, lineTotal: 51750, accountId: 'a12' }],
    createdAt: '2026-02-20T15:00:00Z',
  },
];

export const DEMO_PAYMENTS: Payment[] = [
  {
    id: 'p1', paymentNumber: 'PAY-0001', type: 'received', invoiceId: 'inv1',
    contactId: 'c1', contact: { id: 'c1', name: 'Acme Corporation' },
    amount: 138000, paymentDate: '2026-02-10', paymentMethod: 'bank_transfer', reference: 'TRF-20260210-001',
  },
  {
    id: 'p2', paymentNumber: 'PAY-0002', type: 'made', invoiceId: 'inv3',
    contactId: 'c3', contact: { id: 'c3', name: 'Office World Supplies' },
    amount: 86250, paymentDate: '2026-01-10', paymentMethod: 'bank_transfer', reference: 'TRF-20260110-001',
  },
  {
    id: 'p3', paymentNumber: 'PAY-0003', type: 'made',
    contactId: 'c5', contact: { id: 'c5', name: 'Property Management Co.' },
    amount: 15000, paymentDate: '2026-01-15', paymentMethod: 'bank_transfer', reference: 'RENT-JAN-2026',
  },
  {
    id: 'p4', paymentNumber: 'PAY-0004', type: 'made',
    contactId: 'c6', contact: { id: 'c6', name: 'Marketing Agency' },
    amount: 25000, paymentDate: '2026-02-05', paymentMethod: 'bank_transfer', reference: 'MKT-FEB-2026',
  },
];

export const DEMO_AUDIT_LOGS: AuditLog[] = [
  { id: 'al1', userId: DEMO_USER.id, user: DEMO_USER, action: 'CREATE', entity: 'company', entityId: DEMO_COMPANY.id, createdAt: '2026-01-05T09:00:00Z' },
  { id: 'al2', userId: DEMO_USER.id, user: DEMO_USER, action: 'CREATE', entity: 'journal_entry', entityId: 'j1', createdAt: '2026-01-05T10:00:00Z' },
  { id: 'al3', userId: DEMO_USER.id, user: DEMO_USER, action: 'POST', entity: 'journal_entry', entityId: 'j1', createdAt: '2026-01-05T10:01:00Z' },
  { id: 'al4', userId: DEMO_USER.id, user: DEMO_USER, action: 'CREATE', entity: 'journal_entry', entityId: 'j2', createdAt: '2026-01-10T14:30:00Z' },
  { id: 'al5', userId: DEMO_USER.id, user: DEMO_USER, action: 'POST', entity: 'journal_entry', entityId: 'j2', createdAt: '2026-01-10T14:31:00Z' },
  { id: 'al6', userId: DEMO_USER.id, user: DEMO_USER, action: 'CREATE', entity: 'invoice', entityId: 'inv1', createdAt: '2026-01-20T11:00:00Z' },
  { id: 'al7', userId: DEMO_USER.id, user: DEMO_USER, action: 'POST', entity: 'invoice', entityId: 'inv1', createdAt: '2026-01-20T11:01:00Z' },
  { id: 'al8', userId: DEMO_USER.id, user: DEMO_USER, action: 'CREATE', entity: 'payment', entityId: 'p1', createdAt: '2026-02-10T09:30:00Z' },
  { id: 'al9', userId: DEMO_USER.id, user: DEMO_USER, action: 'CREATE', entity: 'invoice', entityId: 'inv2', createdAt: '2026-02-01T10:00:00Z' },
  { id: 'al10', userId: DEMO_USER.id, user: DEMO_USER, action: 'UPDATE', entity: 'company', entityId: DEMO_COMPANY.id, createdAt: '2026-02-15T08:00:00Z' },
];

// Report data
export const DEMO_TRIAL_BALANCE = {
  accounts: [
    { accountId: 'a1', accountCode: '1000', accountName: 'Cash', accountType: 'asset', debit: 420000, credit: 0, balance: 420000 },
    { accountId: 'a2', accountCode: '1100', accountName: 'Accounts Receivable', accountType: 'asset', debit: 95000, credit: 0, balance: 95000 },
    { accountId: 'a4', accountCode: '1500', accountName: 'Equipment', accountType: 'asset', debit: 75000, credit: 0, balance: 75000 },
    { accountId: 'a6', accountCode: '2000', accountName: 'Accounts Payable', accountType: 'liability', debit: 0, credit: 0, balance: 0 },
    { accountId: 'a9', accountCode: '3000', accountName: "Owner's Capital", accountType: 'equity', debit: 0, credit: 500000, balance: -500000 },
    { accountId: 'a11', accountCode: '4000', accountName: 'Sales Revenue', accountType: 'revenue', debit: 0, credit: 95000, balance: -95000 },
    { accountId: 'a12', accountCode: '4100', accountName: 'Service Revenue', accountType: 'revenue', debit: 0, credit: 120000, balance: -120000 },
    { accountId: 'a14', accountCode: '5000', accountName: 'Cost of Goods Sold', accountType: 'expense', debit: 0, credit: 0, balance: 0 },
    { accountId: 'a15', accountCode: '6000', accountName: 'Salaries & Wages', accountType: 'expense', debit: 85000, credit: 0, balance: 85000 },
    { accountId: 'a16', accountCode: '6100', accountName: 'Rent Expense', accountType: 'expense', debit: 15000, credit: 0, balance: 15000 },
    { accountId: 'a19', accountCode: '6400', accountName: 'Marketing Expense', accountType: 'expense', debit: 25000, credit: 0, balance: 25000 },
  ],
  totalDebit: 715000,
  totalCredit: 715000,
};

export const DEMO_INCOME_STATEMENT = {
  period: { startDate: '2026-01-01', endDate: '2026-02-28' },
  revenue: [
    { accountCode: '4000', accountName: 'Sales Revenue', amount: 95000 },
    { accountCode: '4100', accountName: 'Service Revenue', amount: 120000 },
  ],
  totalRevenue: 215000,
  expenses: [
    { accountCode: '6000', accountName: 'Salaries & Wages', amount: 85000 },
    { accountCode: '6100', accountName: 'Rent Expense', amount: 15000 },
    { accountCode: '6400', accountName: 'Marketing Expense', amount: 25000 },
  ],
  totalExpenses: 125000,
  netIncome: 90000,
};

export const DEMO_BALANCE_SHEET = {
  asOfDate: '2026-02-25',
  assets: [
    { accountCode: '1000', accountName: 'Cash', balance: 420000 },
    { accountCode: '1100', accountName: 'Accounts Receivable', balance: 95000 },
    { accountCode: '1500', accountName: 'Equipment', balance: 75000 },
  ],
  totalAssets: 590000,
  liabilities: [
    { accountCode: '2000', accountName: 'Accounts Payable', balance: 0 },
  ],
  totalLiabilities: 0,
  equity: [
    { accountCode: '3000', accountName: "Owner's Capital", balance: 500000 },
    { accountCode: '3100', accountName: 'Retained Earnings (Current)', balance: 90000 },
  ],
  totalEquity: 590000,
  isBalanced: true,
};
