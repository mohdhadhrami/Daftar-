import React, { useState } from 'react';
import { useSelector } from 'react-redux';
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
} from 'recharts';
import { reportsApi } from '../api/endpoints';
import { TrialBalance, IncomeStatement, BalanceSheet } from '../types';
import { RootState } from '../store/store';
import { DEMO_TRIAL_BALANCE, DEMO_INCOME_STATEMENT, DEMO_BALANCE_SHEET } from '../demo/data';

type ReportType = 'trial-balance' | 'income-statement' | 'balance-sheet' | 'cash-flow';

const ReportsPage: React.FC = () => {
  const { isDemo } = useSelector((state: RootState) => state.auth);
  const [activeReport, setActiveReport] = useState<ReportType>('trial-balance');
  const [dateRange, setDateRange] = useState({
    startDate: new Date(new Date().getFullYear(), 0, 1).toISOString().split('T')[0],
    endDate: new Date().toISOString().split('T')[0],
  });
  const [reportData, setReportData] = useState<any>(null);
  const [loading, setLoading] = useState(false);

  const generateReport = async () => {
    setLoading(true);
    setReportData(null);

    if (isDemo) {
      await new Promise((r) => setTimeout(r, 300));
      switch (activeReport) {
        case 'trial-balance':
          setReportData(DEMO_TRIAL_BALANCE);
          break;
        case 'income-statement':
          setReportData(DEMO_INCOME_STATEMENT);
          break;
        case 'balance-sheet':
          setReportData(DEMO_BALANCE_SHEET);
          break;
        case 'cash-flow':
          setReportData({
            period: { startDate: dateRange.startDate, endDate: dateRange.endDate },
            operating: { netIncome: 90000, adjustments: [], netCash: 90000 },
            investing: { items: [{ description: 'Equipment purchase', amount: -75000 }], netCash: -75000 },
            financing: { items: [{ description: 'Capital investment', amount: 500000 }], netCash: 500000 },
            netChange: 515000,
            beginningCash: 0,
            endingCash: 515000,
          });
          break;
      }
      setLoading(false);
      return;
    }

    try {
      let response: any;
      switch (activeReport) {
        case 'trial-balance':
          response = await reportsApi.getTrialBalance(dateRange.endDate);
          break;
        case 'income-statement':
          response = await reportsApi.getIncomeStatement(dateRange.startDate, dateRange.endDate);
          break;
        case 'balance-sheet':
          response = await reportsApi.getBalanceSheet(dateRange.endDate);
          break;
        case 'cash-flow':
          response = await reportsApi.getCashFlow(dateRange.startDate, dateRange.endDate);
          break;
      }
      setReportData(response?.data);
    } catch (error) {
      console.error('Failed to generate report:', error);
    } finally {
      setLoading(false);
    }
  };

  const renderTrialBalance = (data: TrialBalance) => (
    <div>
      <table className="min-w-full divide-y divide-gray-200">
        <thead className="bg-gray-50">
          <tr>
            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Code</th>
            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Account</th>
            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Type</th>
            <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase">Debit</th>
            <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase">Credit</th>
          </tr>
        </thead>
        <tbody className="divide-y divide-gray-200">
          {data.accounts.filter(a => a.debit > 0 || a.credit > 0).map((a) => (
            <tr key={a.accountId}>
              <td className="px-6 py-3 text-sm font-mono">{a.accountCode}</td>
              <td className="px-6 py-3 text-sm">{a.accountName}</td>
              <td className="px-6 py-3 text-sm capitalize">{a.accountType}</td>
              <td className="px-6 py-3 text-sm text-right font-mono">
                {a.debit > 0 ? `$${a.debit.toLocaleString()}` : ''}
              </td>
              <td className="px-6 py-3 text-sm text-right font-mono">
                {a.credit > 0 ? `$${a.credit.toLocaleString()}` : ''}
              </td>
            </tr>
          ))}
          <tr className="bg-gray-50 font-bold">
            <td colSpan={3} className="px-6 py-3 text-sm text-right">Totals:</td>
            <td className="px-6 py-3 text-sm text-right font-mono">${data.totalDebit.toLocaleString()}</td>
            <td className="px-6 py-3 text-sm text-right font-mono">${data.totalCredit.toLocaleString()}</td>
          </tr>
        </tbody>
      </table>
    </div>
  );

  const renderIncomeStatement = (data: IncomeStatement) => (
    <div className="space-y-6">
      <div>
        <h3 className="text-lg font-semibold text-green-700 mb-2">Revenue</h3>
        {data.revenue.map((r, i) => (
          <div key={i} className="flex justify-between py-1 px-4">
            <span className="text-sm">{r.accountName}</span>
            <span className="text-sm font-mono">${r.amount.toLocaleString()}</span>
          </div>
        ))}
        <div className="flex justify-between py-2 px-4 border-t font-semibold">
          <span>Total Revenue</span>
          <span className="font-mono text-green-700">${data.totalRevenue.toLocaleString()}</span>
        </div>
      </div>
      <div>
        <h3 className="text-lg font-semibold text-red-700 mb-2">Expenses</h3>
        {data.expenses.map((e, i) => (
          <div key={i} className="flex justify-between py-1 px-4">
            <span className="text-sm">{e.accountName}</span>
            <span className="text-sm font-mono">${e.amount.toLocaleString()}</span>
          </div>
        ))}
        <div className="flex justify-between py-2 px-4 border-t font-semibold">
          <span>Total Expenses</span>
          <span className="font-mono text-red-700">${data.totalExpenses.toLocaleString()}</span>
        </div>
      </div>
      <div className="flex justify-between py-3 px-4 bg-gray-50 rounded-lg text-lg font-bold">
        <span>Net Income</span>
        <span className={`font-mono ${data.netIncome >= 0 ? 'text-green-700' : 'text-red-700'}`}>
          ${data.netIncome.toLocaleString()}
        </span>
      </div>
      <ResponsiveContainer width="100%" height={250}>
        <BarChart data={[
          { name: 'Revenue', amount: data.totalRevenue },
          { name: 'Expenses', amount: data.totalExpenses },
          { name: 'Net Income', amount: data.netIncome },
        ]}>
          <CartesianGrid strokeDasharray="3 3" />
          <XAxis dataKey="name" />
          <YAxis />
          <Tooltip formatter={(value: number) => `$${value.toLocaleString()}`} />
          <Bar dataKey="amount" fill="#3b82f6" radius={[4, 4, 0, 0]} />
        </BarChart>
      </ResponsiveContainer>
    </div>
  );

  const renderBalanceSheet = (data: BalanceSheet) => (
    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
      <div>
        <h3 className="text-lg font-semibold text-primary-700 mb-2">Assets</h3>
        {data.assets.map((a, i) => (
          <div key={i} className="flex justify-between py-1 px-4">
            <span className="text-sm">{a.accountName}</span>
            <span className="text-sm font-mono">${a.balance.toLocaleString()}</span>
          </div>
        ))}
        <div className="flex justify-between py-2 px-4 border-t font-bold">
          <span>Total Assets</span>
          <span className="font-mono">${data.totalAssets.toLocaleString()}</span>
        </div>
      </div>
      <div>
        <h3 className="text-lg font-semibold text-orange-700 mb-2">Liabilities</h3>
        {data.liabilities.map((l, i) => (
          <div key={i} className="flex justify-between py-1 px-4">
            <span className="text-sm">{l.accountName}</span>
            <span className="text-sm font-mono">${l.balance.toLocaleString()}</span>
          </div>
        ))}
        <div className="flex justify-between py-2 px-4 border-t font-semibold">
          <span>Total Liabilities</span>
          <span className="font-mono">${data.totalLiabilities.toLocaleString()}</span>
        </div>
        <h3 className="text-lg font-semibold text-purple-700 mt-4 mb-2">Equity</h3>
        {data.equity.map((e, i) => (
          <div key={i} className="flex justify-between py-1 px-4">
            <span className="text-sm">{e.accountName}</span>
            <span className="text-sm font-mono">${e.balance.toLocaleString()}</span>
          </div>
        ))}
        <div className="flex justify-between py-2 px-4 border-t font-semibold">
          <span>Total Equity</span>
          <span className="font-mono">${data.totalEquity.toLocaleString()}</span>
        </div>
      </div>
      <div className="col-span-full p-4 bg-gray-50 rounded-lg text-center">
        <span className={`font-bold ${data.isBalanced ? 'text-green-600' : 'text-red-600'}`}>
          {data.isBalanced ? 'Balance Sheet is Balanced' : 'Balance Sheet is NOT Balanced'}
        </span>
      </div>
    </div>
  );

  const renderCashFlow = (data: any) => (
    <div className="space-y-6">
      <div>
        <h3 className="text-lg font-semibold mb-2">Operating Activities</h3>
        <div className="flex justify-between py-1 px-4">
          <span className="text-sm">Net Income</span>
          <span className="text-sm font-mono">${data.operating?.netIncome?.toLocaleString()}</span>
        </div>
        <div className="flex justify-between py-2 px-4 border-t font-semibold">
          <span>Net Cash from Operations</span>
          <span className="font-mono">${data.operating?.netCash?.toLocaleString()}</span>
        </div>
      </div>
      <div>
        <h3 className="text-lg font-semibold mb-2">Investing Activities</h3>
        {data.investing?.items?.map((item: any, i: number) => (
          <div key={i} className="flex justify-between py-1 px-4">
            <span className="text-sm">{item.description}</span>
            <span className="text-sm font-mono">${item.amount?.toLocaleString()}</span>
          </div>
        ))}
        <div className="flex justify-between py-2 px-4 border-t font-semibold">
          <span>Net Cash from Investing</span>
          <span className="font-mono">${data.investing?.netCash?.toLocaleString()}</span>
        </div>
      </div>
      <div>
        <h3 className="text-lg font-semibold mb-2">Financing Activities</h3>
        {data.financing?.items?.map((item: any, i: number) => (
          <div key={i} className="flex justify-between py-1 px-4">
            <span className="text-sm">{item.description}</span>
            <span className="text-sm font-mono">${item.amount?.toLocaleString()}</span>
          </div>
        ))}
        <div className="flex justify-between py-2 px-4 border-t font-semibold">
          <span>Net Cash from Financing</span>
          <span className="font-mono">${data.financing?.netCash?.toLocaleString()}</span>
        </div>
      </div>
      <div className="bg-gray-50 rounded-lg p-4 space-y-2">
        <div className="flex justify-between font-semibold">
          <span>Net Change in Cash</span>
          <span className="font-mono">${data.netChange?.toLocaleString()}</span>
        </div>
        <div className="flex justify-between text-sm">
          <span>Beginning Cash Balance</span>
          <span className="font-mono">${data.beginningCash?.toLocaleString()}</span>
        </div>
        <div className="flex justify-between font-bold text-lg border-t pt-2">
          <span>Ending Cash Balance</span>
          <span className="font-mono">${data.endingCash?.toLocaleString()}</span>
        </div>
      </div>
    </div>
  );

  return (
    <div>
      <h1 className="text-2xl font-bold text-gray-800 mb-6">Financial Reports</h1>

      <div className="flex flex-wrap gap-2 mb-4">
        {[
          { key: 'trial-balance', label: 'Trial Balance' },
          { key: 'income-statement', label: 'Income Statement' },
          { key: 'balance-sheet', label: 'Balance Sheet' },
          { key: 'cash-flow', label: 'Cash Flow' },
        ].map((r) => (
          <button key={r.key} onClick={() => { setActiveReport(r.key as ReportType); setReportData(null); }}
            className={`px-4 py-2 text-sm rounded-md ${
              activeReport === r.key ? 'bg-primary-600 text-white' : 'bg-gray-100 text-gray-600'
            }`}>{r.label}</button>
        ))}
      </div>

      <div className="flex gap-4 mb-6 items-end">
        {activeReport !== 'trial-balance' && activeReport !== 'balance-sheet' && (
          <div>
            <label className="block text-sm text-gray-600 mb-1">Start Date</label>
            <input type="date" value={dateRange.startDate}
              onChange={(e) => setDateRange({ ...dateRange, startDate: e.target.value })}
              className="px-3 py-2 border rounded-md" />
          </div>
        )}
        <div>
          <label className="block text-sm text-gray-600 mb-1">
            {activeReport === 'trial-balance' || activeReport === 'balance-sheet' ? 'As of Date' : 'End Date'}
          </label>
          <input type="date" value={dateRange.endDate}
            onChange={(e) => setDateRange({ ...dateRange, endDate: e.target.value })}
            className="px-3 py-2 border rounded-md" />
        </div>
        <button onClick={generateReport} disabled={loading}
          className="px-6 py-2 bg-primary-600 text-white rounded-md hover:bg-primary-700 disabled:opacity-50">
          {loading ? 'Generating...' : 'Generate Report'}
        </button>
      </div>

      {reportData && (
        <div className="bg-white rounded-lg shadow p-6">
          {activeReport === 'trial-balance' && renderTrialBalance(reportData)}
          {activeReport === 'income-statement' && renderIncomeStatement(reportData)}
          {activeReport === 'balance-sheet' && renderBalanceSheet(reportData)}
          {activeReport === 'cash-flow' && renderCashFlow(reportData)}
        </div>
      )}
    </div>
  );
};

export default ReportsPage;
