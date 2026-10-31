import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { reservationAPI } from '../services/api';
import { LoadingSpinner, Badge } from '../components/UI';
import { ArrowLeft, MapPin, Car, Clock, DollarSign, Calendar } from 'lucide-react';
import toast from 'react-hot-toast';

export default function ReservationDetails() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [reservation, setReservation] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    reservationAPI.getReservation(id)
      .then(res => setReservation(res.data))
      .catch(() => toast.error('Failed to load reservation'))
      .finally(() => setLoading(false));
  }, [id]);

  const handleCancel = async () => {
    if (!confirm('Cancel this reservation?')) return;
    try {
      await reservationAPI.cancelReservation(id);
      toast.success('Reservation cancelled');
      navigate('/reservations');
    } catch (err) {
      toast.error(err.response?.data?.detail || 'Failed to cancel');
    }
  };

  if (loading) return <LoadingSpinner />;
  if (!reservation) return <div className="text-center text-slate-400 py-20">Reservation not found</div>;

  const formatDate = (dateStr) => {
    if (!dateStr) return 'N/A';
    return new Date(dateStr).toLocaleString('en-IN', {
      day: 'numeric', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit'
    });
  };

  const duration = () => {
    if (!reservation.entry_time || !reservation.exit_time) return 'N/A';
    const hours = (new Date(reservation.exit_time) - new Date(reservation.entry_time)) / (1000 * 60 * 60);
    return `${hours.toFixed(1)} hours`;
  };

  return (
    <div className="space-y-6 animate-fade-in max-w-3xl">
      <button onClick={() => navigate(-1)} className="flex items-center gap-2 text-slate-400 hover:text-white transition-colors text-sm">
        <ArrowLeft size={16} /> Back
      </button>

      <div className="glass-card p-8">
        <div className="flex items-center justify-between mb-6">
          <div>
            <h1 className="text-2xl font-bold text-white">Reservation Details</h1>
            <p className="text-sm text-slate-400 mt-1">ID: {reservation.reservation_id}</p>
          </div>
          <Badge status={reservation.status} />
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {/* Location */}
          <div className="space-y-4">
            <div className="flex items-start gap-3">
              <MapPin size={18} className="text-accent-blue mt-0.5" />
              <div>
                <p className="text-xs text-slate-500">Location</p>
                <p className="text-white font-medium">{reservation.location_name}</p>
                <p className="text-xs text-slate-400">{reservation.location_address}</p>
              </div>
            </div>
            <div className="flex items-start gap-3">
              <Car size={18} className="text-accent-cyan mt-0.5" />
              <div>
                <p className="text-xs text-slate-500">Vehicle</p>
                <p className="text-white font-medium">{reservation.vehicle_number}</p>
                <p className="text-xs text-slate-400">{reservation.vehicle_model}</p>
              </div>
            </div>
            <div className="flex items-start gap-3">
              <Calendar size={18} className="text-accent-indigo mt-0.5" />
              <div>
                <p className="text-xs text-slate-500">Slot</p>
                <p className="text-white font-medium">{reservation.slot_number}</p>
                <p className="text-xs text-slate-400">{reservation.slot_type}</p>
              </div>
            </div>
          </div>

          {/* Times & Cost */}
          <div className="space-y-4">
            <div className="flex items-start gap-3">
              <Clock size={18} className="text-accent-emerald mt-0.5" />
              <div>
                <p className="text-xs text-slate-500">Entry Time</p>
                <p className="text-white font-medium">{formatDate(reservation.entry_time)}</p>
              </div>
            </div>
            <div className="flex items-start gap-3">
              <Clock size={18} className="text-accent-amber mt-0.5" />
              <div>
                <p className="text-xs text-slate-500">Exit Time</p>
                <p className="text-white font-medium">{formatDate(reservation.exit_time)}</p>
              </div>
            </div>
            <div className="flex items-start gap-3">
              <DollarSign size={18} className="text-accent-emerald mt-0.5" />
              <div>
                <p className="text-xs text-slate-500">Duration</p>
                <p className="text-white font-medium">{duration()}</p>
              </div>
            </div>
          </div>
        </div>

        {/* Cost */}
        <div className="mt-6 pt-6 border-t border-navy-600/50">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-slate-400">Rate: ₹{reservation.price_per_hour}/hr</p>
              <p className="text-xs text-slate-500">Estimated Cost: ₹{reservation.estimated_cost?.toFixed(2)}</p>
              {reservation.actual_cost && (
                <p className="text-lg font-bold text-accent-emerald mt-1">Final: ₹{reservation.actual_cost.toFixed(2)}</p>
              )}
            </div>
            {reservation.status === 'confirmed' && (
              <button onClick={handleCancel} className="btn-danger">Cancel Reservation</button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
