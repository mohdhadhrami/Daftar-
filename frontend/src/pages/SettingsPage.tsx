import React, { useEffect, useState } from 'react';
import { useSelector } from 'react-redux';
import { RootState } from '../store/store';
import { companiesApi } from '../api/endpoints';

const SettingsPage: React.FC = () => {
  const { currentCompany } = useSelector((state: RootState) => state.company);
  const [members, setMembers] = useState<any[]>([]);
  const [inviteEmail, setInviteEmail] = useState('');
  const [inviteRole, setInviteRole] = useState('viewer');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!currentCompany) return;
    companiesApi.getMembers().then((r: any) => {
      setMembers(r.data || []);
      setLoading(false);
    }).catch(() => setLoading(false));
  }, [currentCompany]);

  const handleInvite = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await companiesApi.inviteMember({ email: inviteEmail, role: inviteRole });
      setInviteEmail('');
      const r: any = await companiesApi.getMembers();
      setMembers(r.data || []);
    } catch (error) {
      console.error('Failed to invite member:', error);
    }
  };

  return (
    <div>
      <h1 className="text-2xl font-bold text-gray-800 mb-6">Settings</h1>

      {currentCompany && (
        <div className="space-y-6">
          {/* Company Info */}
          <div className="bg-white rounded-lg shadow p-6">
            <h2 className="text-lg font-semibold mb-4">Company Information</h2>
            <div className="grid grid-cols-2 gap-4 text-sm">
              <div>
                <span className="text-gray-500">Name:</span>
                <span className="ml-2 font-medium">{currentCompany.name}</span>
              </div>
              <div>
                <span className="text-gray-500">Currency:</span>
                <span className="ml-2 font-medium">{currentCompany.currency}</span>
              </div>
              <div>
                <span className="text-gray-500">Slug:</span>
                <span className="ml-2 font-medium font-mono">{currentCompany.slug}</span>
              </div>
              <div>
                <span className="text-gray-500">Your Role:</span>
                <span className="ml-2 font-medium capitalize">{currentCompany.role}</span>
              </div>
            </div>
          </div>

          {/* Team Members */}
          <div className="bg-white rounded-lg shadow p-6">
            <h2 className="text-lg font-semibold mb-4">Team Members</h2>

            <form onSubmit={handleInvite} className="flex gap-2 mb-4">
              <input type="email" value={inviteEmail}
                onChange={(e) => setInviteEmail(e.target.value)}
                className="flex-1 px-3 py-2 border rounded-md" placeholder="Email address" required />
              <select value={inviteRole} onChange={(e) => setInviteRole(e.target.value)}
                className="px-3 py-2 border rounded-md">
                <option value="admin">Admin</option>
                <option value="accountant">Accountant</option>
                <option value="sales">Sales</option>
                <option value="viewer">Viewer</option>
              </select>
              <button type="submit"
                className="px-4 py-2 bg-primary-600 text-white rounded-md hover:bg-primary-700">
                Invite
              </button>
            </form>

            {loading ? (
              <p className="text-gray-400">Loading members...</p>
            ) : (
              <div className="divide-y">
                {members.map((m: any) => (
                  <div key={m.id} className="py-3 flex justify-between items-center">
                    <div>
                      <p className="font-medium text-sm">
                        {m.user?.firstName} {m.user?.lastName}
                      </p>
                      <p className="text-xs text-gray-500">{m.user?.email}</p>
                    </div>
                    <span className="text-xs px-2 py-1 bg-gray-100 rounded capitalize">
                      {m.role?.name}
                    </span>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
};

export default SettingsPage;
