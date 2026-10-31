import { useState, useEffect } from 'react';
import { adminAPI } from '../../services/api';
import { LoadingSpinner, EmptyState } from '../../components/UI';
import { Users, Car, Mail, Phone, Calendar } from 'lucide-react';

export default function ManageUsers() {
  const [users, setUsers] = useState([]);
  const [vehicles, setVehicles] = useState([]);
  const [loading, setLoading] = useState(true);
  const [tab, setTab] = useState('users');

  useEffect(() => {
    Promise.all([adminAPI.getUsers(), adminAPI.getVehicles()])
      .then(([u, v]) => { setUsers(u.data); setVehicles(v.data); })
      .catch(console.error)
      .finally(() => setLoading(false));
  }, []);

  if (loading) return <LoadingSpinner />;

  const formatDate = (d) => d ? new Date(d).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' }) : 'N/A';

  return (
    <div className="space-y-6 animate-fade-in">
      <div>
        <h1 className="text-2xl font-bold text-white">Users & Vehicles</h1>
        <p className="text-slate-400 text-sm mt-1">View all registered users and vehicles</p>
      </div>

      <div className="flex gap-2">
        <button onClick={() => setTab('users')}
          className={`px-4 py-2 rounded-lg text-sm font-medium flex items-center gap-2 transition-colors ${
            tab === 'users' ? 'bg-accent-blue/20 text-accent-blue border border-accent-blue/30' : 'bg-navy-700/50 text-slate-400 hover:text-white'
          }`}>
          <Users size={14} /> Users ({users.length})
        </button>
        <button onClick={() => setTab('vehicles')}
          className={`px-4 py-2 rounded-lg text-sm font-medium flex items-center gap-2 transition-colors ${
            tab === 'vehicles' ? 'bg-accent-blue/20 text-accent-blue border border-accent-blue/30' : 'bg-navy-700/50 text-slate-400 hover:text-white'
          }`}>
          <Car size={14} /> Vehicles ({vehicles.length})
        </button>
      </div>

      {tab === 'users' && (
        <div className="glass-card overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-navy-600/50">
                  <th className="text-left px-5 py-3 text-xs font-semibold text-slate-400 uppercase">Name</th>
                  <th className="text-left px-5 py-3 text-xs font-semibold text-slate-400 uppercase">Email</th>
                  <th className="text-left px-5 py-3 text-xs font-semibold text-slate-400 uppercase">Phone</th>
                  <th className="text-left px-5 py-3 text-xs font-semibold text-slate-400 uppercase">Role</th>
                  <th className="text-left px-5 py-3 text-xs font-semibold text-slate-400 uppercase">Vehicles</th>
                  <th className="text-left px-5 py-3 text-xs font-semibold text-slate-400 uppercase">Joined</th>
                </tr>
              </thead>
              <tbody>
                {users.map(user => (
                  <tr key={user._id} className="border-b border-navy-700/30 hover:bg-navy-700/20">
                    <td className="px-5 py-3">
                      <div className="flex items-center gap-3">
                        <div className="w-8 h-8 rounded-full bg-gradient-to-br from-accent-blue to-accent-indigo flex items-center justify-center text-xs font-bold text-white">
                          {user.name?.charAt(0)?.toUpperCase()}
                        </div>
                        <span className="text-white font-medium">{user.name}</span>
                      </div>
                    </td>
                    <td className="px-5 py-3 text-slate-300">{user.email}</td>
                    <td className="px-5 py-3 text-slate-400">{user.phone || '-'}</td>
                    <td className="px-5 py-3">
                      <span className={`px-2 py-0.5 rounded-full text-xs font-semibold ${
                        user.role === 'admin' ? 'bg-accent-amber/15 text-accent-amber' : 'bg-accent-blue/15 text-accent-blue'
                      }`}>{user.role}</span>
                    </td>
                    <td className="px-5 py-3 text-slate-300">{user.vehicle_count}</td>
                    <td className="px-5 py-3 text-slate-400 text-xs">{formatDate(user.created_at)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {tab === 'vehicles' && (
        <div className="glass-card overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-navy-600/50">
                  <th className="text-left px-5 py-3 text-xs font-semibold text-slate-400 uppercase">Reg. Number</th>
                  <th className="text-left px-5 py-3 text-xs font-semibold text-slate-400 uppercase">Type</th>
                  <th className="text-left px-5 py-3 text-xs font-semibold text-slate-400 uppercase">Model</th>
                  <th className="text-left px-5 py-3 text-xs font-semibold text-slate-400 uppercase">Color</th>
                  <th className="text-left px-5 py-3 text-xs font-semibold text-slate-400 uppercase">Owner</th>
                  <th className="text-left px-5 py-3 text-xs font-semibold text-slate-400 uppercase">Registered</th>
                </tr>
              </thead>
              <tbody>
                {vehicles.map(v => (
                  <tr key={v._id} className="border-b border-navy-700/30 hover:bg-navy-700/20">
                    <td className="px-5 py-3 text-white font-semibold tracking-wider">{v.registration_number}</td>
                    <td className="px-5 py-3 text-slate-300">{v.vehicle_type}</td>
                    <td className="px-5 py-3 text-slate-300">{v.vehicle_model}</td>
                    <td className="px-5 py-3 text-slate-300">{v.vehicle_color}</td>
                    <td className="px-5 py-3">
                      <p className="text-white text-xs">{v.owner_name}</p>
                      <p className="text-slate-500 text-xs">{v.owner_email}</p>
                    </td>
                    <td className="px-5 py-3 text-slate-400 text-xs">{formatDate(v.created_at)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
}
