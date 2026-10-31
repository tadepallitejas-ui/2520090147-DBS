import { useState, useEffect } from 'react';
import { reservationAPI } from '../../services/api';
import { LoadingSpinner, Badge, EmptyState } from '../../components/UI';
import { CalendarCheck, X } from 'lucide-react';
import toast from 'react-hot-toast';

export default function ManageReservations() {
  const [reservations, setReservations] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState('all');

  const fetchReservations = () => {
    reservationAPI.getAllReservations()
      .then(res => setReservations(res.data))
      .catch(console.error)
      .finally(() => setLoading(false));
  };

  useEffect(() => { fetchReservations(); }, []);

  const handleCancel = async (id) => {
    if (!confirm('Cancel this reservation?')) return;
    try {
      await reservationAPI.cancelReservation(id);
      toast.success('Reservation cancelled');
      fetchReservations();
    } catch (err) {
      toast.error(err.response?.data?.detail || 'Failed to cancel');
    }
  };

  if (loading) return <LoadingSpinner />;

  const filtered = filter === 'all' ? reservations : reservations.filter(r => r.status === filter);

  const formatDate = (d) => d ? new Date(d).toLocaleString('en-IN', { day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit' }) : 'N/A';

  return (
    <div className="space-y-6 animate-fade-in">
      <div>
        <h1 className="text-2xl font-bold text-white">Manage Reservations</h1>
        <p className="text-slate-400 text-sm mt-1">{reservations.length} total reservations</p>
      </div>

      <div className="flex gap-2 flex-wrap">
        {['all', 'confirmed', 'checked_in', 'completed', 'cancelled'].map(f => (
          <button key={f} onClick={() => setFilter(f)}
            className={`px-4 py-1.5 rounded-lg text-sm font-medium transition-colors ${
              filter === f ? 'bg-accent-blue/20 text-accent-blue border border-accent-blue/30' : 'bg-navy-700/50 text-slate-400 hover:text-white'
            }`}>
            {f === 'all' ? `All (${reservations.length})` : `${f.replace('_', ' ').replace(/^\w/, c => c.toUpperCase())} (${reservations.filter(r => r.status === f).length})`}
          </button>
        ))}
      </div>

      {filtered.length === 0 ? (
        <EmptyState icon={CalendarCheck} title="No reservations" description="No reservations match the selected filter" />
      ) : (
        <div className="glass-card overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-navy-600/50">
                  <th className="text-left px-4 py-3 text-xs font-semibold text-slate-400 uppercase">ID</th>
                  <th className="text-left px-4 py-3 text-xs font-semibold text-slate-400 uppercase">User</th>
                  <th className="text-left px-4 py-3 text-xs font-semibold text-slate-400 uppercase">Location</th>
                  <th className="text-left px-4 py-3 text-xs font-semibold text-slate-400 uppercase">Slot</th>
                  <th className="text-left px-4 py-3 text-xs font-semibold text-slate-400 uppercase">Vehicle</th>
                  <th className="text-left px-4 py-3 text-xs font-semibold text-slate-400 uppercase">Entry</th>
                  <th className="text-left px-4 py-3 text-xs font-semibold text-slate-400 uppercase">Exit</th>
                  <th className="text-left px-4 py-3 text-xs font-semibold text-slate-400 uppercase">Cost</th>
                  <th className="text-left px-4 py-3 text-xs font-semibold text-slate-400 uppercase">Status</th>
                  <th className="text-left px-4 py-3 text-xs font-semibold text-slate-400 uppercase">Actions</th>
                </tr>
              </thead>
              <tbody>
                {filtered.map(res => (
                  <tr key={res._id} className="border-b border-navy-700/30 hover:bg-navy-700/20">
                    <td className="px-4 py-3 text-xs text-slate-400 font-mono">{res.reservation_id}</td>
                    <td className="px-4 py-3">
                      <p className="text-white text-xs">{res.user_name}</p>
                      <p className="text-slate-500 text-xs">{res.user_email}</p>
                    </td>
                    <td className="px-4 py-3 text-slate-300 text-xs">{res.location_name}</td>
                    <td className="px-4 py-3 text-white text-xs">{res.slot_number}</td>
                    <td className="px-4 py-3 text-slate-300 text-xs">{res.vehicle_number}</td>
                    <td className="px-4 py-3 text-slate-400 text-xs">{formatDate(res.entry_time)}</td>
                    <td className="px-4 py-3 text-slate-400 text-xs">{formatDate(res.exit_time)}</td>
                    <td className="px-4 py-3 text-accent-emerald text-xs font-semibold">₹{(res.actual_cost || res.estimated_cost || 0).toFixed(0)}</td>
                    <td className="px-4 py-3"><Badge status={res.status} /></td>
                    <td className="px-4 py-3">
                      {res.status === 'confirmed' && (
                        <button onClick={() => handleCancel(res._id)} className="text-red-400 hover:text-red-300 text-xs flex items-center gap-1">
                          <X size={12} /> Cancel
                        </button>
                      )}
                    </td>
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
