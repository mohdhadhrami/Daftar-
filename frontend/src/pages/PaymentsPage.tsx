import React, { useEffect, useState } from 'react';
import { paymentsApi } from '../api/endpoints';
import { Payment, Pagination } from '../types';

const PaymentsPage: React.FC = () => {
  const [payments, setPayments] = useState<Payment[]>([]);
  const [pagination, setPagination] = useState<Pagination | null>(null);
  const [loading, setLoading] = useState(true);
  const [typeFilter, setTypeFilter] = useState('');

  useEffect(() => {
    const load = async () => {
      setLoading(true);
      try {
        const response: any = await paymentsApi.getAll({
          type: typeFilter || undefined,
        });
        setPayments(response.data?.payments || []);
        setPagination(response.data?.pagination || null);
      } catch {
        // handle error
      } finally {
        setLoading(false);
      }
    };
    load();
  }, [typeFilter]);

  return (
    <div>
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-2xl font-bold text-gray-800">Payments</h1>
      </div>

      <div className="flex gap-2 mb-4">
        {['', 'received', 'made'].map((type) => (
          <button key={type} onClick={() => setTypeFilter(type)}
            className={`px-3 py-1.5 text-sm rounded-md capitalize ${
              typeFilter === type ? 'bg-primary-600 text-white' : 'bg-gray-100 text-gray-600'
            }`}>{type || 'All'}</button>
        ))}
      </div>

      <div className="bg-white rounded-lg shadow overflow-hidden">
        <table className="min-w-full divide-y divide-gray-200">
          <thead className="bg-gray-50">
            <tr>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Payment #</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Type</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Contact</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Date</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Amount</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Method</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-200">
            {loading ? (
              <tr><td colSpan={6} className="px-6 py-8 text-center text-gray-400">Loading...</td></tr>
            ) : payments.length === 0 ? (
              <tr><td colSpan={6} className="px-6 py-8 text-center text-gray-400">No payments found</td></tr>
            ) : (
              payments.map((p) => (
                <tr key={p.id} className="hover:bg-gray-50">
                  <td className="px-6 py-4 text-sm font-mono">{p.paymentNumber}</td>
                  <td className="px-6 py-4 text-sm capitalize">
                    <span className={`px-2 py-1 rounded text-xs ${
                      p.type === 'received' ? 'bg-green-100 text-green-700' : 'bg-orange-100 text-orange-700'
                    }`}>{p.type}</span>
                  </td>
                  <td className="px-6 py-4 text-sm">{p.contact?.name || '-'}</td>
                  <td className="px-6 py-4 text-sm">{new Date(p.paymentDate).toLocaleDateString()}</td>
                  <td className="px-6 py-4 text-sm font-mono">${Number(p.amount).toLocaleString()}</td>
                  <td className="px-6 py-4 text-sm capitalize">{p.paymentMethod.replace('_', ' ')}</td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
};

export default PaymentsPage;
