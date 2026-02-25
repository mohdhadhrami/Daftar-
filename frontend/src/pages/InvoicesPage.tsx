import React, { useEffect, useState } from 'react';
import { useSelector } from 'react-redux';
import { invoicesApi } from '../api/endpoints';
import { Invoice } from '../types';
import { RootState } from '../store/store';
import { DEMO_INVOICES } from '../demo/data';

const InvoicesPage: React.FC = () => {
  const { isDemo } = useSelector((state: RootState) => state.auth);
  const [invoices, setInvoices] = useState<Invoice[]>([]);
  const [loading, setLoading] = useState(true);
  const [typeFilter, setTypeFilter] = useState('');
  const [statusFilter, setStatusFilter] = useState('');

  const loadInvoices = async () => {
    setLoading(true);
    if (isDemo) {
      let filtered = [...DEMO_INVOICES];
      if (typeFilter) filtered = filtered.filter((i) => i.type === typeFilter);
      if (statusFilter) filtered = filtered.filter((i) => i.status === statusFilter);
      setInvoices(filtered);
      setLoading(false);
      return;
    }
    try {
      const response: any = await invoicesApi.getAll({
        type: typeFilter || undefined,
        status: statusFilter || undefined,
      });
      setInvoices(response.data?.invoices || []);
    } catch {
      // handle error
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadInvoices();
  }, [typeFilter, statusFilter, isDemo]);

  const handlePost = async (id: string) => {
    if (isDemo) return;
    try {
      await invoicesApi.post(id);
      loadInvoices();
    } catch (error) {
      console.error('Failed to post invoice:', error);
    }
  };

  return (
    <div>
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-2xl font-bold text-gray-800">Invoices</h1>
      </div>

      <div className="flex gap-4 mb-4">
        <div className="flex gap-2">
          {['', 'sales', 'purchase'].map((type) => (
            <button key={type} onClick={() => setTypeFilter(type)}
              className={`px-3 py-1.5 text-sm rounded-md capitalize ${
                typeFilter === type ? 'bg-primary-600 text-white' : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
              }`}>{type || 'All Types'}</button>
          ))}
        </div>
        <div className="flex gap-2">
          {['', 'draft', 'sent', 'paid', 'overdue'].map((status) => (
            <button key={status} onClick={() => setStatusFilter(status)}
              className={`px-3 py-1.5 text-sm rounded-md capitalize ${
                statusFilter === status ? 'bg-primary-600 text-white' : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
              }`}>{status || 'All Status'}</button>
          ))}
        </div>
      </div>

      <div className="bg-white rounded-lg shadow overflow-hidden">
        <table className="min-w-full divide-y divide-gray-200">
          <thead className="bg-gray-50">
            <tr>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Invoice #</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Type</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Contact</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Date</th>
              <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase">Amount</th>
              <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase">Due</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Status</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-200">
            {loading ? (
              <tr><td colSpan={8} className="px-6 py-8 text-center text-gray-400">Loading...</td></tr>
            ) : invoices.length === 0 ? (
              <tr><td colSpan={8} className="px-6 py-8 text-center text-gray-400">No invoices found</td></tr>
            ) : (
              invoices.map((inv) => (
                <tr key={inv.id} className="hover:bg-gray-50">
                  <td className="px-6 py-4 text-sm font-mono">{inv.invoiceNumber}</td>
                  <td className="px-6 py-4 text-sm capitalize">{inv.type}</td>
                  <td className="px-6 py-4 text-sm">{inv.contact?.name}</td>
                  <td className="px-6 py-4 text-sm">{new Date(inv.issueDate).toLocaleDateString()}</td>
                  <td className="px-6 py-4 text-sm text-right font-mono">${Number(inv.totalAmount).toLocaleString()}</td>
                  <td className="px-6 py-4 text-sm text-right font-mono">${Number(inv.amountDue).toLocaleString()}</td>
                  <td className="px-6 py-4">
                    <span className={`text-xs px-2 py-1 rounded ${
                      inv.status === 'paid' ? 'bg-green-100 text-green-700' :
                      inv.status === 'sent' ? 'bg-blue-100 text-blue-700' :
                      inv.status === 'overdue' ? 'bg-red-100 text-red-700' :
                      'bg-yellow-100 text-yellow-700'
                    }`}>{inv.status}</span>
                  </td>
                  <td className="px-6 py-4">
                    {inv.status === 'draft' && (
                      <button onClick={() => handlePost(inv.id)}
                        className="text-sm text-primary-600 hover:underline">Post</button>
                    )}
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
};

export default InvoicesPage;
