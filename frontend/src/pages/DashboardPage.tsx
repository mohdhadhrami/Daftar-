import React, { useEffect, useState } from 'react';
import { useSelector } from 'react-redux';
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
} from 'recharts';
import { RootState } from '../store/store';
import { reportsApi, journalsApi, invoicesApi } from '../api/endpoints';
import { useWebSocket } from '../websocket/useWebSocket';
import { DEMO_INCOME_STATEMENT, DEMO_BALANCE_SHEET, DEMO_JOURNALS, DEMO_INVOICES } from '../demo/data';

const COLORS = ['#3b82f6', '#10b981', '#f59e0b', '#ef4444', '#8b5cf6'];

const DashboardPage: React.FC = () => {
  const { currentCompany } = useSelector((state: RootState) => state.company);
  const { isDemo } = useSelector((state: RootState) => state.auth);
  const { subscribe } = useWebSocket();

  const [incomeData, setIncomeData] = useState<any>(null);
  const [balanceData, setBalanceData] = useState<any>(null);
  const [recentJournals, setRecentJournals] = useState<any[]>([]);
  const [recentInvoices, setRecentInvoices] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!currentCompany) return;

    if (isDemo) {
      setIncomeData(DEMO_INCOME_STATEMENT);
      setBalanceData(DEMO_BALANCE_SHEET);
      setRecentJournals(DEMO_JOURNALS.slice(0, 5));
      setRecentInvoices(DEMO_INVOICES.slice(0, 5));
      setLoading(false);
      return;
    }

    const loadDashboard = async () => {
      setLoading(true);
      try {
        const now = new Date();
        const yearStart = new Date(now.getFullYear(), 0, 1)
          .toISOString()
          .split('T')[0];
        const today = now.toISOString().split('T')[0];

        const [income, balance, journals, invoices] = await Promise.all([
          reportsApi.getIncomeStatement(yearStart, today).catch(() => null),
          reportsApi.getBalanceSheet(today).catch(() => null),
          journalsApi.getAll({ limit: 5 }).catch(() => null),
          invoicesApi.getAll({ limit: 5 }).catch(() => null),
        ]);

        if (income) setIncomeData((income as any).data);
        if (balance) setBalanceData((balance as any).data);
        if (journals) setRecentJournals((journals as any).data?.entries || []);
        if (invoices) setRecentInvoices((invoices as any).data?.invoices || []);
      } catch {
        // Dashboard data is optional
      } finally {
        setLoading(false);
      }
    };

    loadDashboard();
  }, [currentCompany, isDemo]);

  // Real-time updates
  useEffect(() => {
    if (isDemo) return;
    const unsubs = [
      subscribe('journal:created', () => {
        journalsApi.getAll({ limit: 5 }).then((r: any) => {
          setRecentJournals(r.data?.entries || []);
        });
      }),
      subscribe('invoice:created', () => {
        invoicesApi.getAll({ limit: 5 }).then((r: any) => {
          setRecentInvoices(r.data?.invoices || []);
        });
      }),
    ];
    return () => unsubs.forEach((u) => u());
  }, [subscribe, isDemo]);

  if (!currentCompany) {
    return (
      <div className="text-center py-20">
        <h2 className="text-xl text-gray-500">Select a company to get started</h2>
      </div>
    );
  }

  const summaryCards = [
    {
      label: 'Total Revenue',
      value: incomeData ? `$${incomeData.totalRevenue?.toLocaleString() || '0'}` : '$0',
      color: 'text-green-600',
      bg: 'bg-green-50',
    },
    {
      label: 'Total Expenses',
      value: incomeData ? `$${incomeData.totalExpenses?.toLocaleString() || '0'}` : '$0',
      color: 'text-red-600',
      bg: 'bg-red-50',
    },
    {
      label: 'Net Income',
      value: incomeData ? `$${incomeData.netIncome?.toLocaleString() || '0'}` : '$0',
      color: incomeData?.netIncome >= 0 ? 'text-green-600' : 'text-red-600',
      bg: 'bg-blue-50',
    },
    {
      label: 'Total Assets',
      value: balanceData ? `$${balanceData.totalAssets?.toLocaleString() || '0'}` : '$0',
      color: 'text-primary-600',
      bg: 'bg-primary-50',
    },
  ];

  const expenseBreakdown =
    incomeData?.expenses?.map((e: any, i: number) => ({
      name: e.accountName,
      value: Math.abs(e.amount),
      color: COLORS[i % COLORS.length],
    })) || [];

  const revenueVsExpenses = [
    { name: 'Revenue', amount: incomeData?.totalRevenue || 0 },
    { name: 'Expenses', amount: incomeData?.totalExpenses || 0 },
    { name: 'Net Income', amount: incomeData?.netIncome || 0 },
  ];

  return (
    <div>
      <div className="flex items-center gap-3 mb-6">
        <h1 className="text-2xl font-bold text-gray-800">
          Dashboard - {currentCompany.name}
        </h1>
        {isDemo && (
          <span className="px-2 py-1 text-xs bg-amber-100 text-amber-700 rounded-full font-medium">
            Demo Mode
          </span>
        )}
      </div>

      {loading ? (
        <div className="flex items-center justify-center py-20">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary-600"></div>
        </div>
      ) : (
        <>
          {/* Summary Cards */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
            {summaryCards.map((card) => (
              <div key={card.label} className={`${card.bg} rounded-lg p-6`}>
                <p className="text-sm text-gray-500">{card.label}</p>
                <p className={`text-2xl font-bold ${card.color} mt-1`}>
                  {card.value}
                </p>
              </div>
            ))}
          </div>

          {/* Charts */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
            <div className="bg-white rounded-lg shadow p-6">
              <h3 className="text-lg font-semibold mb-4">Revenue vs Expenses</h3>
              <ResponsiveContainer width="100%" height={300}>
                <BarChart data={revenueVsExpenses}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="name" />
                  <YAxis />
                  <Tooltip formatter={(value: number) => `$${value.toLocaleString()}`} />
                  <Bar dataKey="amount" fill="#3b82f6" radius={[4, 4, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </div>

            <div className="bg-white rounded-lg shadow p-6">
              <h3 className="text-lg font-semibold mb-4">Expense Breakdown</h3>
              {expenseBreakdown.length > 0 ? (
                <ResponsiveContainer width="100%" height={300}>
                  <PieChart>
                    <Pie
                      data={expenseBreakdown}
                      cx="50%"
                      cy="50%"
                      outerRadius={100}
                      dataKey="value"
                      label={({ name, percent }) =>
                        `${name} (${(percent * 100).toFixed(0)}%)`
                      }
                    >
                      {expenseBreakdown.map((_: any, index: number) => (
                        <Cell key={index} fill={COLORS[index % COLORS.length]} />
                      ))}
                    </Pie>
                    <Tooltip formatter={(value: number) => `$${value.toLocaleString()}`} />
                  </PieChart>
                </ResponsiveContainer>
              ) : (
                <p className="text-gray-400 text-center py-20">No expense data</p>
              )}
            </div>
          </div>

          {/* Recent Activity */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <div className="bg-white rounded-lg shadow">
              <div className="p-4 border-b">
                <h3 className="font-semibold">Recent Journal Entries</h3>
              </div>
              <div className="divide-y">
                {recentJournals.length > 0 ? (
                  recentJournals.map((j: any) => (
                    <div key={j.id} className="p-4 flex justify-between items-center">
                      <div>
                        <p className="font-medium text-sm">{j.entryNumber}</p>
                        <p className="text-xs text-gray-500">{j.description}</p>
                      </div>
                      <span
                        className={`text-xs px-2 py-1 rounded ${
                          j.status === 'posted'
                            ? 'bg-green-100 text-green-700'
                            : j.status === 'draft'
                              ? 'bg-yellow-100 text-yellow-700'
                              : 'bg-red-100 text-red-700'
                        }`}
                      >
                        {j.status}
                      </span>
                    </div>
                  ))
                ) : (
                  <p className="p-4 text-gray-400 text-sm">No journal entries yet</p>
                )}
              </div>
            </div>

            <div className="bg-white rounded-lg shadow">
              <div className="p-4 border-b">
                <h3 className="font-semibold">Recent Invoices</h3>
              </div>
              <div className="divide-y">
                {recentInvoices.length > 0 ? (
                  recentInvoices.map((inv: any) => (
                    <div key={inv.id} className="p-4 flex justify-between items-center">
                      <div>
                        <p className="font-medium text-sm">{inv.invoiceNumber}</p>
                        <p className="text-xs text-gray-500">
                          {inv.contact?.name} - ${Number(inv.totalAmount).toLocaleString()}
                        </p>
                      </div>
                      <span
                        className={`text-xs px-2 py-1 rounded ${
                          inv.status === 'paid'
                            ? 'bg-green-100 text-green-700'
                            : inv.status === 'overdue'
                              ? 'bg-red-100 text-red-700'
                              : 'bg-blue-100 text-blue-700'
                        }`}
                      >
                        {inv.status}
                      </span>
                    </div>
                  ))
                ) : (
                  <p className="p-4 text-gray-400 text-sm">No invoices yet</p>
                )}
              </div>
            </div>
          </div>
        </>
      )}
    </div>
  );
};

export default DashboardPage;
