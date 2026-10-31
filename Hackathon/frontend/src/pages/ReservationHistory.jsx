import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { reservationAPI } from '../services/api';
import { LoadingSpinner, Badge, EmptyState } from '../components/UI';
import { CalendarCheck, MapPin, Clock, X } from 'lucide-react';
import toast from 'react-hot-toast';

export default function ReservationHistory() {
  const [reservations, setReservations] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState('all');

  const fetchReservations = () => {
    reservationAPI.getMyReservations()
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

  const formatDate = (dateStr) => {
    if (!dateStr) return 'N/A';
    return new Date(dateStr).toLocaleString('en-IN', {
      day: 'numeric', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit'
    });
  };

  return (
    <div className="space-y-6 animate-fade-in">
      <div>
        <h1 className="text-2xl font-bold text-white">My Reservations</h1>
        <p className="text-slate-400 text-sm mt-1">View and manage your parking reservations</p>
      </div>

      {/* Filter tabs */}
      <div className="flex gap-2 flex-wrap">
        {['all', 'confirmed', 'checked_in', 'completed', 'cancelled'].map(f => (
          <button key={f} onClick={() => setFilter(f)}
            className={`px-4 py-1.5 rounded-lg text-sm font-medium transition-colors ${
              filter === f ? 'bg-accent-blue/20 text-accent-blue border border-accent-blue/30' : 'bg-navy-700/50 text-slate-400 hover:text-white'
            }`}>
            {f === 'all' ? 'All' : f.replace('_', ' ').replace(/^\w/, c => c.toUpperCase())}
          </button>
        ))}
      </div>

      {filtered.length === 0 ? (
        <EmptyState icon={CalendarCheck} title="No reservations found" description="Your reservations will appear here" />
      ) : (
        <div className="space-y-3">
          {filtered.map(res => (
            <div key={res._id} className="glass-card p-5">
              <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
                <div className="flex items-start gap-4">
                  <div className="w-12 h-12 rounded-xl bg-accent-blue/10 flex items-center justify-center shrink-0">
                    <MapPin size={20} className="text-accent-blue" />
                  </div>
                  <div>
                    <div className="flex items-center gap-2">
                      <h3 className="font-semibold text-white">{res.location_name}</h3>
                      <Badge status={res.status} />
                    </div>
                    <p className="text-sm text-slate-400 mt-0.5">
                      Slot {res.slot_number} • {res.vehicle_number}
                    </p>
                    <p className="text-xs text-slate-500 mt-1">
                      ID: {res.reservation_id}
                    </p>
                    <div className="flex items-center gap-4 text-xs text-slate-400 mt-2">
                      <span className="flex items-center gap-1"><Clock size={12} /> {formatDate(res.entry_time)}</span>
                      <span>→</span>
                      <span>{formatDate(res.exit_time)}</span>
                    </div>
                  </div>
                </div>
                <div className="flex items-center gap-3">
                  <div className="text-right">
                    <p className="text-xs text-slate-500">
                      {res.actual_cost ? 'Final Cost' : 'Est. Cost'}
                    </p>
                    <p className="text-lg font-bold text-accent-emerald">
                      ₹{(res.actual_cost || res.estimated_cost || 0).toFixed(2)}
                    </p>
                  </div>
                  {res.status === 'confirmed' && (
                    <button onClick={() => handleCancel(res._id)} className="btn-danger text-sm px-3 py-1.5 flex items-center gap-1">
                      <X size={14} /> Cancel
                    </button>
                  )}
                  <Link to={`/reservations/${res._id}`} className="btn-secondary text-sm px-3 py-1.5">
                    Details
                  </Link>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
