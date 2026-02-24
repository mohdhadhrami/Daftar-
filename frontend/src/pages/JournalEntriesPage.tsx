import React, { useEffect, useState } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { RootState, AppDispatch } from '../store/store';
import { fetchJournalEntries, fetchAccounts } from '../store/slices/accountingSlice';
import { journalsApi } from '../api/endpoints';
import { useWebSocket } from '../websocket/useWebSocket';

const JournalEntriesPage: React.FC = () => {
  const dispatch = useDispatch<AppDispatch>();
  const { journalEntries, accounts, pagination, isLoading } = useSelector(
    (state: RootState) => state.accounting,
  );
  const { subscribe } = useWebSocket();
  const [statusFilter, setStatusFilter] = useState('');
  const [showCreateForm, setShowCreateForm] = useState(false);
  const [newEntry, setNewEntry] = useState({
    entryDate: new Date().toISOString().split('T')[0],
    description: '',
    reference: '',
    lines: [
      { accountId: '', debit: 0, credit: 0, description: '' },
      { accountId: '', debit: 0, credit: 0, description: '' },
    ],
  });

  useEffect(() => {
    dispatch(fetchJournalEntries({ status: statusFilter || undefined }));
    dispatch(fetchAccounts());
  }, [dispatch, statusFilter]);

  useEffect(() => {
    const unsub = subscribe('journal:created', () => {
      dispatch(fetchJournalEntries({ status: statusFilter || undefined }));
    });
    return unsub;
  }, [subscribe, dispatch, statusFilter]);

  const addLine = () => {
    setNewEntry({
      ...newEntry,
      lines: [...newEntry.lines, { accountId: '', debit: 0, credit: 0, description: '' }],
    });
  };

  const updateLine = (index: number, field: string, value: any) => {
    const lines = [...newEntry.lines];
    (lines[index] as any)[field] = value;
    setNewEntry({ ...newEntry, lines });
  };

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await journalsApi.create(newEntry);
      dispatch(fetchJournalEntries({ status: statusFilter || undefined }));
      setShowCreateForm(false);
    } catch (error) {
      console.error('Failed to create journal entry:', error);
    }
  };

  const handlePost = async (id: string) => {
    try {
      await journalsApi.post(id);
      dispatch(fetchJournalEntries({ status: statusFilter || undefined }));
    } catch (error) {
      console.error('Failed to post entry:', error);
    }
  };

  const totalDebit = newEntry.lines.reduce((s, l) => s + (Number(l.debit) || 0), 0);
  const totalCredit = newEntry.lines.reduce((s, l) => s + (Number(l.credit) || 0), 0);
  const isBalanced = Math.abs(totalDebit - totalCredit) < 0.01 && totalDebit > 0;

  return (
    <div>
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-2xl font-bold text-gray-800">Journal Entries</h1>
        <button
          onClick={() => setShowCreateForm(true)}
          className="px-4 py-2 text-sm bg-primary-600 text-white rounded-md hover:bg-primary-700"
        >
          New Entry
        </button>
      </div>

      {/* Status Filter */}
      <div className="flex gap-2 mb-4">
        {['', 'draft', 'posted', 'voided'].map((status) => (
          <button
            key={status}
            onClick={() => setStatusFilter(status)}
            className={`px-3 py-1.5 text-sm rounded-md capitalize ${
              statusFilter === status
                ? 'bg-primary-600 text-white'
                : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
            }`}
          >
            {status || 'All'}
          </button>
        ))}
      </div>

      {/* Create Form */}
      {showCreateForm && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 overflow-y-auto">
          <div className="bg-white rounded-lg shadow-lg p-6 w-full max-w-3xl my-8">
            <h2 className="text-lg font-semibold mb-4">Create Journal Entry</h2>
            <form onSubmit={handleCreate} className="space-y-4">
              <div className="grid grid-cols-3 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Date</label>
                  <input type="date" value={newEntry.entryDate}
                    onChange={(e) => setNewEntry({ ...newEntry, entryDate: e.target.value })}
                    className="w-full px-3 py-2 border rounded-md" required />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Description</label>
                  <input type="text" value={newEntry.description}
                    onChange={(e) => setNewEntry({ ...newEntry, description: e.target.value })}
                    className="w-full px-3 py-2 border rounded-md" required />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Reference</label>
                  <input type="text" value={newEntry.reference}
                    onChange={(e) => setNewEntry({ ...newEntry, reference: e.target.value })}
                    className="w-full px-3 py-2 border rounded-md" />
                </div>
              </div>

              {/* Journal Lines */}
              <div className="border rounded-md p-4">
                <div className="grid grid-cols-12 gap-2 mb-2 text-xs font-medium text-gray-500 uppercase">
                  <div className="col-span-4">Account</div>
                  <div className="col-span-3">Description</div>
                  <div className="col-span-2">Debit</div>
                  <div className="col-span-2">Credit</div>
                  <div className="col-span-1"></div>
                </div>
                {newEntry.lines.map((line, i) => (
                  <div key={i} className="grid grid-cols-12 gap-2 mb-2">
                    <select className="col-span-4 px-2 py-1.5 border rounded text-sm"
                      value={line.accountId}
                      onChange={(e) => updateLine(i, 'accountId', e.target.value)}>
                      <option value="">Select account</option>
                      {accounts.map((a) => (
                        <option key={a.id} value={a.id}>{a.code} - {a.name}</option>
                      ))}
                    </select>
                    <input className="col-span-3 px-2 py-1.5 border rounded text-sm"
                      placeholder="Description" value={line.description}
                      onChange={(e) => updateLine(i, 'description', e.target.value)} />
                    <input className="col-span-2 px-2 py-1.5 border rounded text-sm text-right"
                      type="number" step="0.01" min="0" value={line.debit || ''}
                      onChange={(e) => updateLine(i, 'debit', parseFloat(e.target.value) || 0)} />
                    <input className="col-span-2 px-2 py-1.5 border rounded text-sm text-right"
                      type="number" step="0.01" min="0" value={line.credit || ''}
                      onChange={(e) => updateLine(i, 'credit', parseFloat(e.target.value) || 0)} />
                    <button type="button" className="col-span-1 text-red-400 hover:text-red-600"
                      onClick={() => {
                        if (newEntry.lines.length > 2) {
                          const lines = newEntry.lines.filter((_, idx) => idx !== i);
                          setNewEntry({ ...newEntry, lines });
                        }
                      }}>X</button>
                  </div>
                ))}
                <button type="button" onClick={addLine}
                  className="text-sm text-primary-600 hover:underline">+ Add Line</button>

                <div className="grid grid-cols-12 gap-2 mt-3 pt-3 border-t font-semibold text-sm">
                  <div className="col-span-7 text-right">Totals:</div>
                  <div className="col-span-2 text-right">${totalDebit.toFixed(2)}</div>
                  <div className="col-span-2 text-right">${totalCredit.toFixed(2)}</div>
                  <div className="col-span-1">
                    {isBalanced ? (
                      <span className="text-green-500">OK</span>
                    ) : (
                      <span className="text-red-500">!</span>
                    )}
                  </div>
                </div>
              </div>

              <div className="flex justify-end gap-2">
                <button type="button" onClick={() => setShowCreateForm(false)}
                  className="px-4 py-2 text-sm border rounded-md">Cancel</button>
                <button type="submit" disabled={!isBalanced}
                  className="px-4 py-2 text-sm bg-primary-600 text-white rounded-md hover:bg-primary-700 disabled:opacity-50">
                  Create Entry</button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Entries Table */}
      <div className="bg-white rounded-lg shadow overflow-hidden">
        <table className="min-w-full divide-y divide-gray-200">
          <thead className="bg-gray-50">
            <tr>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Entry #</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Date</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Description</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Amount</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Status</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-200">
            {isLoading ? (
              <tr><td colSpan={6} className="px-6 py-8 text-center text-gray-400">Loading...</td></tr>
            ) : journalEntries.length === 0 ? (
              <tr><td colSpan={6} className="px-6 py-8 text-center text-gray-400">No journal entries found</td></tr>
            ) : (
              journalEntries.map((entry) => (
                <tr key={entry.id} className="hover:bg-gray-50">
                  <td className="px-6 py-4 text-sm font-mono">{entry.entryNumber}</td>
                  <td className="px-6 py-4 text-sm">{new Date(entry.entryDate).toLocaleDateString()}</td>
                  <td className="px-6 py-4 text-sm">{entry.description}</td>
                  <td className="px-6 py-4 text-sm font-mono">
                    ${entry.lines.reduce((s, l) => s + Number(l.debit), 0).toLocaleString()}
                  </td>
                  <td className="px-6 py-4">
                    <span className={`text-xs px-2 py-1 rounded ${
                      entry.status === 'posted' ? 'bg-green-100 text-green-700' :
                      entry.status === 'draft' ? 'bg-yellow-100 text-yellow-700' :
                      'bg-red-100 text-red-700'
                    }`}>{entry.status}</span>
                  </td>
                  <td className="px-6 py-4">
                    {entry.status === 'draft' && (
                      <button onClick={() => handlePost(entry.id)}
                        className="text-sm text-primary-600 hover:underline">Post</button>
                    )}
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
        {pagination && pagination.pages > 1 && (
          <div className="px-6 py-3 bg-gray-50 text-sm text-gray-500">
            Page {pagination.page} of {pagination.pages} ({pagination.total} entries)
          </div>
        )}
      </div>
    </div>
  );
};

export default JournalEntriesPage;
