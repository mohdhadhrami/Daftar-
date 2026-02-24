import React, { useState } from 'react';
import { aiApi } from '../api/endpoints';

const AiAssistantPage: React.FC = () => {
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

  const handleQuery = async () => {
    if (!query.trim()) return;
    setLoading(true);
    setResult(null);
    try {
      const response: any = await aiApi.queryFinancials(query);
      setResult(response.data);
    } catch (error) {
      setResult({ error: 'Failed to get AI response' });
    } finally {
      setLoading(false);
    }
  };

  const handleCategorize = async () => {
    if (!expenseDesc.trim()) return;
    setLoading(true);
    setResult(null);
    try {
      const response: any = await aiApi.categorizeExpense({
        description: expenseDesc,
        amount: expenseAmount,
      });
      setResult(response.data);
    } catch (error) {
      setResult({ error: 'Failed to categorize expense' });
    } finally {
      setLoading(false);
    }
  };

  const handleAnomalies = async () => {
    setLoading(true);
    setResult(null);
    try {
      const response: any = await aiApi.detectAnomalies(dateRange.startDate, dateRange.endDate);
      setResult(response.data);
    } catch (error) {
      setResult({ error: 'Failed to detect anomalies' });
    } finally {
      setLoading(false);
    }
  };

  const handleForecast = async () => {
    setLoading(true);
    setResult(null);
    try {
      const response: any = await aiApi.forecastCashFlow(3);
      setResult(response.data);
    } catch (error) {
      setResult({ error: 'Failed to generate forecast' });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div>
      <h1 className="text-2xl font-bold text-gray-800 mb-6">AI Assistant</h1>

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
