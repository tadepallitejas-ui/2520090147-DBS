import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { parkingAPI, slotAPI, vehicleAPI, reservationAPI } from '../services/api';
import { LoadingSpinner, Badge } from '../components/UI';
import { MapPin, Clock, DollarSign, Car, CalendarCheck, ArrowLeft, Check } from 'lucide-react';
import toast from 'react-hot-toast';

export default function ParkingDetails() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [location, setLocation] = useState(null);
  const [slots, setSlots] = useState([]);
  const [vehicles, setVehicles] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedSlot, setSelectedSlot] = useState(null);
  const [showReserve, setShowReserve] = useState(false);
  const [reserveForm, setReserveForm] = useState({
    vehicle_id: '', entry_time: '', exit_time: ''
  });
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    Promise.all([
      parkingAPI.getLocation(id),
      slotAPI.getSlotsByLocation(id),
      vehicleAPI.getMyVehicles()
    ]).then(([locRes, slotRes, vehRes]) => {
      setLocation(locRes.data);
      setSlots(slotRes.data);
      setVehicles(vehRes.data);
    }).catch(console.error)
      .finally(() => setLoading(false));
  }, [id]);

  const handleSlotClick = (slot) => {
    if (slot.status !== 'Available') return;
    setSelectedSlot(slot._id === selectedSlot?._id ? null : slot);
    setShowReserve(true);
  };

  const handleReserve = async (e) => {
    e.preventDefault();
    if (!selectedSlot) return toast.error('Please select a slot');
    if (!reserveForm.vehicle_id) return toast.error('Please select a vehicle');
    if (!reserveForm.entry_time || !reserveForm.exit_time) return toast.error('Please select entry and exit times');

    setSubmitting(true);
    try {
      await reservationAPI.createReservation({
        location_id: id,
        slot_id: selectedSlot._id,
        vehicle_id: reserveForm.vehicle_id,
        entry_time: new Date(reserveForm.entry_time).toISOString(),
        exit_time: new Date(reserveForm.exit_time).toISOString()
      });
      toast.success('Reservation confirmed!');
      navigate('/reservations');
    } catch (err) {
      toast.error(err.response?.data?.detail || 'Failed to create reservation');
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) return <LoadingSpinner />;
  if (!location) return <div className="text-center text-slate-400 py-20">Location not found</div>;

  const slotColorClass = (status) => {
    const map = { Available: 'slot-available', Reserved: 'slot-reserved', Occupied: 'slot-occupied', Maintenance: 'slot-maintenance' };
    return map[status] || 'slot-maintenance';
  };

  // Estimated cost calculation
  let estimatedCost = 0;
  if (reserveForm.entry_time && reserveForm.exit_time) {
    const hours = (new Date(reserveForm.exit_time) - new Date(reserveForm.entry_time)) / (1000 * 60 * 60);
    estimatedCost = Math.max(hours, 0.5) * location.price_per_hour;
  }

  return (
    <div className="space-y-6 animate-fade-in">
      <button onClick={() => navigate(-1)} className="flex items-center gap-2 text-slate-400 hover:text-white transition-colors text-sm">
        <ArrowLeft size={16} /> Back
      </button>

      {/* Location Header */}
      <div className="glass-card p-6">
        <div className="flex flex-col md:flex-row md:items-start md:justify-between gap-4">
          <div>
            <h1 className="text-2xl font-bold text-white">{location.name}</h1>
            <p className="text-sm text-slate-400 flex items-center gap-1 mt-1">
              <MapPin size={14} /> {location.address}, {location.city}
            </p>
            {location.description && (
              <p className="text-sm text-slate-500 mt-2 max-w-xl">{location.description}</p>
            )}
          </div>
          <div className="flex flex-wrap gap-4 text-sm">
            <div className="px-4 py-2 bg-navy-700/50 rounded-xl">
              <p className="text-xs text-slate-500">Type</p>
              <p className="font-semibold text-white">{location.parking_type}</p>
            </div>
            <div className="px-4 py-2 bg-navy-700/50 rounded-xl">
              <p className="text-xs text-slate-500">Rate</p>
              <p className="font-semibold text-accent-amber">₹{location.price_per_hour}/hr</p>
            </div>
            <div className="px-4 py-2 bg-navy-700/50 rounded-xl">
              <p className="text-xs text-slate-500">Hours</p>
              <p className="font-semibold text-white">{location.operating_hours}</p>
            </div>
            <div className="px-4 py-2 bg-navy-700/50 rounded-xl">
              <p className="text-xs text-slate-500">Available</p>
              <p className="font-semibold text-accent-emerald">{location.available_slots}/{location.total_slots}</p>
            </div>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Slot Grid */}
        <div className="lg:col-span-2 glass-card p-6">
          <h2 className="text-lg font-semibold text-white mb-4">Select a Parking Slot</h2>
          
          {/* Legend */}
          <div className="flex flex-wrap gap-4 mb-5 text-xs">
            <div className="flex items-center gap-1.5"><div className="w-3 h-3 rounded bg-accent-emerald/30 border border-accent-emerald/50" /> Available</div>
            <div className="flex items-center gap-1.5"><div className="w-3 h-3 rounded bg-accent-amber/30 border border-accent-amber/50" /> Reserved</div>
            <div className="flex items-center gap-1.5"><div className="w-3 h-3 rounded bg-accent-rose/30 border border-accent-rose/50" /> Occupied</div>
            <div className="flex items-center gap-1.5"><div className="w-3 h-3 rounded bg-slate-500/30 border border-slate-500/50" /> Maintenance</div>
          </div>

          <div className="flex flex-wrap gap-2.5">
            {slots.map(slot => (
              <div
                key={slot._id}
                onClick={() => handleSlotClick(slot)}
                className={`slot-grid-item ${selectedSlot?._id === slot._id ? 'slot-selected' : slotColorClass(slot.status)} ${slot.status === 'Available' ? 'cursor-pointer' : 'cursor-not-allowed opacity-70'}`}
                title={`${slot.slot_number} - ${slot.slot_type} (${slot.status})`}
              >
                <div className="text-center">
                  <div className="text-xs font-bold">{slot.slot_number}</div>
                  <div className="text-[10px] opacity-70">{slot.slot_type === 'EV' ? '⚡' : slot.slot_type === 'Disabled' ? '♿' : ''}</div>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Reservation Form */}
        <div className="glass-card p-6">
          <h2 className="text-lg font-semibold text-white mb-4">Reserve Slot</h2>
          
          {selectedSlot ? (
            <form onSubmit={handleReserve} className="space-y-4">
              <div className="p-3 bg-accent-blue/10 border border-accent-blue/20 rounded-xl">
                <p className="text-sm text-accent-blue font-semibold">Selected: {selectedSlot.slot_number}</p>
                <p className="text-xs text-slate-400">Type: {selectedSlot.slot_type}</p>
              </div>

              <div>
                <label className="block text-sm text-slate-300 mb-1.5">Vehicle</label>
                <select className="input-field" value={reserveForm.vehicle_id}
                  onChange={e => setReserveForm(p => ({ ...p, vehicle_id: e.target.value }))} required>
                  <option value="">Select vehicle</option>
                  {vehicles.map(v => (
                    <option key={v._id} value={v._id}>{v.registration_number} - {v.vehicle_model}</option>
                  ))}
                </select>
                {vehicles.length === 0 && (
                  <p className="text-xs text-accent-amber mt-1">Please add a vehicle first in "My Vehicles"</p>
                )}
              </div>

              <div>
                <label className="block text-sm text-slate-300 mb-1.5">Entry Time</label>
                <input type="datetime-local" className="input-field" value={reserveForm.entry_time}
                  onChange={e => setReserveForm(p => ({ ...p, entry_time: e.target.value }))} required />
              </div>

              <div>
                <label className="block text-sm text-slate-300 mb-1.5">Exit Time</label>
                <input type="datetime-local" className="input-field" value={reserveForm.exit_time}
                  onChange={e => setReserveForm(p => ({ ...p, exit_time: e.target.value }))} required />
              </div>

              {estimatedCost > 0 && (
                <div className="p-3 bg-navy-700/50 rounded-xl">
                  <p className="text-xs text-slate-400">Estimated Cost</p>
                  <p className="text-xl font-bold text-accent-emerald">₹{estimatedCost.toFixed(2)}</p>
                </div>
              )}

              <button type="submit" disabled={submitting || vehicles.length === 0} className="btn-primary w-full flex items-center justify-center gap-2 disabled:opacity-50">
                <Check size={16} /> {submitting ? 'Reserving...' : 'Confirm Reservation'}
              </button>
            </form>
          ) : (
            <div className="text-center py-10 text-slate-500">
              <Car size={36} className="mx-auto mb-3 opacity-40" />
              <p className="text-sm">Select an available slot from the grid to make a reservation</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
