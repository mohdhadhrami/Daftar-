import React, { useEffect, useState } from 'react';
import { auditApi } from '../api/endpoints';
import { AuditLog } from '../types';

const AuditLogPage: React.FC = () => {
  const [logs, setLogs] = useState<AuditLog[]>([]);
  const [loading, setLoading] = useState(true);
  const [entityFilter, setEntityFilter] = useState('');

  useEffect(() => {
    const load = async () => {
      setLoading(true);
      try {
        const response: any = await auditApi.getAll({
          entity: entityFilter || undefined,
        });
        setLogs(response.data?.logs || []);
      } catch {
        // handle error
      } finally {
        setLoading(false);
      }
    };
    load();
  }, [entityFilter]);

  return (
    <div>
      <h1 className="text-2xl font-bold text-gray-800 mb-6">Audit Log</h1>

      <div className="flex gap-2 mb-4">
        {['', 'journal_entry', 'invoice', 'payment', 'fiscal_period'].map((entity) => (
          <button key={entity} onClick={() => setEntityFilter(entity)}
            className={`px-3 py-1.5 text-sm rounded-md ${
              entityFilter === entity ? 'bg-primary-600 text-white' : 'bg-gray-100 text-gray-600'
            }`}>{entity ? entity.replace('_', ' ') : 'All'}</button>
        ))}
      </div>

      <div className="bg-white rounded-lg shadow overflow-hidden">
        <table className="min-w-full divide-y divide-gray-200">
          <thead className="bg-gray-50">
            <tr>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Timestamp</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">User</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Action</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Entity</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Details</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-200">
            {loading ? (
              <tr><td colSpan={5} className="px-6 py-8 text-center text-gray-400">Loading...</td></tr>
            ) : logs.length === 0 ? (
              <tr><td colSpan={5} className="px-6 py-8 text-center text-gray-400">No audit logs found</td></tr>
            ) : (
              logs.map((log) => (
                <tr key={log.id} className="hover:bg-gray-50">
                  <td className="px-6 py-4 text-sm text-gray-500">
                    {new Date(log.createdAt).toLocaleString()}
                  </td>
                  <td className="px-6 py-4 text-sm">
                    {log.user ? `${log.user.firstName} ${log.user.lastName}` : '-'}
                  </td>
                  <td className="px-6 py-4">
                    <span className={`text-xs px-2 py-1 rounded ${
                      log.action === 'create' ? 'bg-green-100 text-green-700' :
                      log.action === 'post' ? 'bg-blue-100 text-blue-700' :
                      log.action === 'void' ? 'bg-red-100 text-red-700' :
                      'bg-gray-100 text-gray-600'
                    }`}>{log.action}</span>
                  </td>
                  <td className="px-6 py-4 text-sm capitalize">{log.entity.replace('_', ' ')}</td>
                  <td className="px-6 py-4 text-xs text-gray-400 font-mono max-w-xs truncate">
                    {log.newValues ? JSON.stringify(log.newValues) : '-'}
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

export default AuditLogPage;
