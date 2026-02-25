import React, { useState } from 'react';
import { useSelector } from 'react-redux';
import { aiApi } from '../api/endpoints';
import { RootState } from '../store/store';

const AiAssistantPage: React.FC = () => {
  const { isDemo } = useSelector((state: RootState) => state.auth);
  const [activeTab, setActiveTab] = useState<'query' | 'categorize' | 'anomalies' | 'forecast'>('query');
  const [query, setQuery] = useState('');
  const [expenseDesc, setExpenseDesc] = useState('');
  const [expenseAmount, setExpenseAmount] = useState(0);
  const [dateRange, setDateRange] = useState({
    startDate: new Date(new Date().getFullYear(), 0, 1).toISOString().split('T')[0],
    endDate: new Date().toISOString().split('T')[0],
  });
  const [result, setResult] = useState<any>(null);
  const [loading, setLoading] = useState(false);

  const demoDelay = () => new Promise((r) => setTimeout(r, 500));

  const handleQuery = async () => {
    if (!query.trim()) return;
    setLoading(true);
    setResult(null);
    if (isDemo) {
      await demoDelay();
      setResult({
        answer: `Based on your financial data analysis:\n\nYour company "Daftar Technologies" shows strong performance with total revenue of $215,000 (Sales: $95,000, Services: $120,000) against total expenses of $125,000 (Salaries: $85,000, Rent: $15,000, Marketing: $25,000).\n\nNet income stands at $90,000, representing a healthy 41.9% profit margin. Total assets are $590,000 with no outstanding liabilities, indicating a strong financial position.\n\nKey insights:\n- Service revenue is your primary income source (55.8%)\n- Salaries represent the largest expense (68% of total expenses)\n- The balance sheet is perfectly balanced at $590,000\n- Cash position is strong at $420,000`,
      });
      setLoading(false);
      return;
    }
    try {
      const response: any = await aiApi.queryFinancials(query);
      setResult(response.data);
    } catch {
      setResult({ error: 'Failed to get AI response. Backend server required.' });
    } finally {
      setLoading(false);
    }
  };

  const handleCategorize = async () => {
    if (!expenseDesc.trim()) return;
    setLoading(true);
    setResult(null);
    if (isDemo) {
      await demoDelay();
      const categories: Record<string, { code: string; name: string; confidence: number }> = {
        'office': { code: '6300', name: 'Office Supplies', confidence: 0.92 },
        'travel': { code: '6700', name: 'Travel Expense', confidence: 0.88 },
        'marketing': { code: '6400', name: 'Marketing Expense', confidence: 0.95 },
        'rent': { code: '6100', name: 'Rent Expense', confidence: 0.97 },
        'salary': { code: '6000', name: 'Salaries & Wages', confidence: 0.96 },
        'insurance': { code: '6600', name: 'Insurance Expense', confidence: 0.91 },
      };
      const key = Object.keys(categories).find((k) => expenseDesc.toLowerCase().includes(k)) || 'office';
      setResult({ category: categories[key], description: expenseDesc, amount: expenseAmount });
      setLoading(false);
      return;
    }
    try {
      const response: any = await aiApi.categorizeExpense({ description: expenseDesc, amount: expenseAmount });
      setResult(response.data);
    } catch {
      setResult({ error: 'Failed to categorize expense. Backend server required.' });
    } finally {
      setLoading(false);
    }
  };

  const handleAnomalies = async () => {
    setLoading(true);
    setResult(null);
    if (isDemo) {
      await demoDelay();
      setResult({
        anomalies: [
          { type: 'Unusual Amount', description: 'Equipment purchase of $75,000 is significantly above the average transaction size of $15,000', severity: 'medium', entryNumber: 'JE-0002' },
          { type: 'Large Salary Payment', description: 'Monthly salary of $85,000 is the single largest recurring expense. Consider reviewing staffing costs.', severity: 'low', entryNumber: 'JE-0005' },
        ],
        summary: 'Analysis of 9 journal entries found 2 items worth reviewing. No critical anomalies detected.',
      });
      setLoading(false);
      return;
    }
    try {
      const response: any = await aiApi.detectAnomalies(dateRange.startDate, dateRange.endDate);
      setResult(response.data);
    } catch {
      setResult({ error: 'Failed to detect anomalies. Backend server required.' });
    } finally {
      setLoading(false);
    }
  };

  const handleForecast = async () => {
    setLoading(true);
    setResult(null);
    if (isDemo) {
      await demoDelay();
      setResult({
        forecast: [
          { month: 'March 2026', projectedIncome: 110000, projectedExpenses: 130000, netCashFlow: -20000, endingCash: 400000 },
          { month: 'April 2026', projectedIncome: 125000, projectedExpenses: 128000, netCashFlow: -3000, endingCash: 397000 },
          { month: 'May 2026', projectedIncome: 140000, projectedExpenses: 132000, netCashFlow: 8000, endingCash: 405000 },
        ],
        summary: 'Cash flow is projected to remain positive over the next 3 months. Revenue growth trend suggests improving financial performance by May 2026.',
      });
      setLoading(false);
      return;
    }
    try {
      const response: any = await aiApi.forecastCashFlow(3);
      setResult(response.data);
    } catch {
      setResult({ error: 'Failed to generate forecast. Backend server required.' });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div>
      <div className="flex items-center gap-3 mb-6">
        <h1 className="text-2xl font-bold text-gray-800">AI Assistant</h1>
        {isDemo && (
          <span className="px-2 py-1 text-xs bg-amber-100 text-amber-700 rounded-full font-medium">
            Demo Responses
          </span>
        )}
      </div>

      <div className="flex gap-2 mb-6">
        {[
          { key: 'query', label: 'Ask a Question' },
          { key: 'categorize', label: 'Categorize Expense' },
          { key: 'anomalies', label: 'Detect Anomalies' },
          { key: 'forecast', label: 'Cash Flow Forecast' },
        ].map((tab) => (
          <button key={tab.key}
            onClick={() => { setActiveTab(tab.key as any); setResult(null); }}
            className={`px-4 py-2 text-sm rounded-md ${
              activeTab === tab.key ? 'bg-primary-600 text-white' : 'bg-gray-100 text-gray-600'
            }`}>{tab.label}</button>
        ))}
      </div>

      <div className="bg-white rounded-lg shadow p-6">
        {activeTab === 'query' && (
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Ask about your financial data
              </label>
              <textarea value={query} onChange={(e) => setQuery(e.target.value)}
                className="w-full px-3 py-2 border rounded-md" rows={3}
                placeholder="e.g., What are my top expenses this year?" />
            </div>
            <button onClick={handleQuery} disabled={loading || !query.trim()}
              className="px-6 py-2 bg-primary-600 text-white rounded-md hover:bg-primary-700 disabled:opacity-50">
              {loading ? 'Thinking...' : 'Ask AI'}
            </button>
          </div>
        )}

        {activeTab === 'categorize' && (
          <div className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Description</label>
                <input type="text" value={expenseDesc}
                  onChange={(e) => setExpenseDesc(e.target.value)}
                  className="w-full px-3 py-2 border rounded-md"
                  placeholder="e.g., Office chairs purchase" />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Amount</label>
                <input type="number" value={expenseAmount}
                  onChange={(e) => setExpenseAmount(parseFloat(e.target.value))}
                  className="w-full px-3 py-2 border rounded-md" />
              </div>
            </div>
            <button onClick={handleCategorize} disabled={loading || !expenseDesc.trim()}
              className="px-6 py-2 bg-primary-600 text-white rounded-md hover:bg-primary-700 disabled:opacity-50">
              {loading ? 'Categorizing...' : 'Categorize'}
            </button>
          </div>
        )}

        {activeTab === 'anomalies' && (
          <div className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Start Date</label>
                <input type="date" value={dateRange.startDate}
                  onChange={(e) => setDateRange({ ...dateRange, startDate: e.target.value })}
                  className="w-full px-3 py-2 border rounded-md" />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">End Date</label>
                <input type="date" value={dateRange.endDate}
                  onChange={(e) => setDateRange({ ...dateRange, endDate: e.target.value })}
                  className="w-full px-3 py-2 border rounded-md" />
              </div>
            </div>
            <button onClick={handleAnomalies} disabled={loading}
              className="px-6 py-2 bg-primary-600 text-white rounded-md hover:bg-primary-700 disabled:opacity-50">
              {loading ? 'Analyzing...' : 'Detect Anomalies'}
            </button>
          </div>
        )}

        {activeTab === 'forecast' && (
          <div className="space-y-4">
            <p className="text-sm text-gray-600">
              Generate a 3-month cash flow forecast based on your historical data.
            </p>
            <button onClick={handleForecast} disabled={loading}
              className="px-6 py-2 bg-primary-600 text-white rounded-md hover:bg-primary-700 disabled:opacity-50">
              {loading ? 'Forecasting...' : 'Generate Forecast'}
            </button>
          </div>
        )}

        {/* Result Display */}
        {result && (
          <div className="mt-6 p-4 bg-gray-50 rounded-lg">
            <h3 className="font-semibold mb-2">AI Response</h3>
            {result.answer ? (
              <p className="text-sm whitespace-pre-wrap">{result.answer}</p>
            ) : result.error ? (
              <p className="text-sm text-red-600">{result.error}</p>
            ) : result.category ? (
              <div className="space-y-2">
                <p className="text-sm"><span className="font-medium">Category:</span> {result.category.code} - {result.category.name}</p>
                <p className="text-sm"><span className="font-medium">Confidence:</span> {(result.category.confidence * 100).toFixed(0)}%</p>
                <div className="w-full bg-gray-200 rounded-full h-2">
                  <div className="bg-primary-600 h-2 rounded-full" style={{ width: `${result.category.confidence * 100}%` }}></div>
                </div>
              </div>
            ) : result.anomalies ? (
              <div className="space-y-3">
                <p className="text-sm text-gray-600 mb-3">{result.summary}</p>
                {result.anomalies.map((a: any, i: number) => (
                  <div key={i} className="p-3 border rounded-md">
                    <div className="flex items-center gap-2 mb-1">
                      <span className={`text-xs px-2 py-0.5 rounded font-medium ${
                        a.severity === 'high' ? 'bg-red-100 text-red-700' :
                        a.severity === 'medium' ? 'bg-yellow-100 text-yellow-700' :
                        'bg-blue-100 text-blue-700'
                      }`}>{a.severity}</span>
                      <span className="text-sm font-medium">{a.type}</span>
                      {a.entryNumber && <span className="text-xs text-gray-400 font-mono">{a.entryNumber}</span>}
                    </div>
                    <p className="text-sm text-gray-600">{a.description}</p>
                  </div>
                ))}
              </div>
            ) : result.forecast ? (
              <div className="space-y-3">
                <p className="text-sm text-gray-600 mb-3">{result.summary}</p>
                <table className="min-w-full text-sm">
                  <thead>
                    <tr className="border-b">
                      <th className="text-left py-2">Month</th>
                      <th className="text-right py-2">Income</th>
                      <th className="text-right py-2">Expenses</th>
                      <th className="text-right py-2">Net Cash Flow</th>
                      <th className="text-right py-2">Ending Cash</th>
                    </tr>
                  </thead>
                  <tbody>
                    {result.forecast.map((f: any, i: number) => (
                      <tr key={i} className="border-b">
                        <td className="py-2">{f.month}</td>
                        <td className="text-right font-mono">${f.projectedIncome.toLocaleString()}</td>
                        <td className="text-right font-mono">${f.projectedExpenses.toLocaleString()}</td>
                        <td className={`text-right font-mono ${f.netCashFlow >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                          ${f.netCashFlow.toLocaleString()}
                        </td>
                        <td className="text-right font-mono">${f.endingCash.toLocaleString()}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            ) : (
              <pre className="text-sm overflow-auto">{JSON.stringify(result, null, 2)}</pre>
            )}
          </div>
        )}
      </div>
    </div>
  );
};

export default AiAssistantPage;
