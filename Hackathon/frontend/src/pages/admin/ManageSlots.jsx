import { useState, useEffect } from 'react';
import { parkingAPI, slotAPI } from '../../services/api';
import { LoadingSpinner, Badge, EmptyState } from '../../components/UI';
import { ParkingCircle, Plus, Trash2, X, Save } from 'lucide-react';
import toast from 'react-hot-toast';

export default function ManageSlots() {
  const [locations, setLocations] = useState([]);
  const [selectedLocation, setSelectedLocation] = useState('');
  const [slots, setSlots] = useState([]);
  const [loading, setLoading] = useState(true);
  const [slotsLoading, setSlotsLoading] = useState(false);
  const [showForm, setShowForm] = useState(false);
  const [form, setForm] = useState({ slot_number: '', slot_type: 'Regular' });
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    parkingAPI.getLocations()
      .then(res => {
        setLocations(res.data);
        if (res.data.length > 0) {
          setSelectedLocation(res.data[0]._id);
        }
      })
      .catch(console.error)
      .finally(() => setLoading(false));
  }, []);

  useEffect(() => {
    if (selectedLocation) {
      setSlotsLoading(true);
      slotAPI.getSlotsByLocation(selectedLocation)
        .then(res => setSlots(res.data))
        .catch(console.error)
        .finally(() => setSlotsLoading(false));
    }
  }, [selectedLocation]);

  const handleAddSlot = async (e) => {
    e.preventDefault();
    setSubmitting(true);
    try {
      await slotAPI.createSlot({ ...form, location_id: selectedLocation });
      toast.success('Slot added');
      setShowForm(false);
      setForm({ slot_number: '', slot_type: 'Regular' });
      // Refresh slots
      const res = await slotAPI.getSlotsByLocation(selectedLocation);
      setSlots(res.data);
    } catch (err) {
      toast.error(err.response?.data?.detail || 'Failed to add slot');
    } finally {
      setSubmitting(false);
    }
  };

  const handleUpdateStatus = async (slotId, newStatus) => {
    try {
      await slotAPI.updateSlot(slotId, { status: newStatus });
      toast.success('Slot status updated');
      const res = await slotAPI.getSlotsByLocation(selectedLocation);
      setSlots(res.data);
    } catch (err) {
      toast.error('Failed to update slot');
    }
  };

  const handleDelete = async (slotId) => {
    if (!confirm('Delete this slot?')) return;
    try {
      await slotAPI.deleteSlot(slotId);
      toast.success('Slot deleted');
      const res = await slotAPI.getSlotsByLocation(selectedLocation);
      setSlots(res.data);
    } catch (err) {
      toast.error('Failed to delete slot');
    }
  };

  if (loading) return <LoadingSpinner />;

  const slotColorClass = (status) => {
    const map = { Available: 'slot-available', Reserved: 'slot-reserved', Occupied: 'slot-occupied', Maintenance: 'slot-maintenance' };
    return map[status] || 'slot-maintenance';
  };

  return (
    <div className="space-y-6 animate-fade-in">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-white">Manage Slots</h1>
          <p className="text-slate-400 text-sm mt-1">Manage parking slots for each location</p>
        </div>
        {selectedLocation && (
          <button onClick={() => setShowForm(!showForm)} className="btn-primary flex items-center gap-2">
            {showForm ? <X size={16} /> : <Plus size={16} />} {showForm ? 'Cancel' : 'Add Slot'}
          </button>
        )}
      </div>

      {/* Location selector */}
      <div className="glass-card p-5">
        <label className="block text-sm text-slate-300 mb-2">Select Location</label>
        <select className="input-field max-w-md" value={selectedLocation}
          onChange={e => setSelectedLocation(e.target.value)}>
          {locations.map(loc => (
            <option key={loc._id} value={loc._id}>{loc.name} - {loc.city}</option>
          ))}
        </select>
      </div>

      {/* Add slot form */}
      {showForm && (
        <form onSubmit={handleAddSlot} className="glass-card p-5 flex flex-wrap items-end gap-4">
          <div>
            <label className="block text-sm text-slate-300 mb-1">Slot Number</label>
            <input className="input-field" placeholder="e.g. S031" value={form.slot_number}
              onChange={e => setForm(p => ({ ...p, slot_number: e.target.value }))} required />
          </div>
          <div>
            <label className="block text-sm text-slate-300 mb-1">Type</label>
            <select className="input-field" value={form.slot_type}
              onChange={e => setForm(p => ({ ...p, slot_type: e.target.value }))}>
              <option>Regular</option><option>EV</option><option>Disabled</option>
            </select>
          </div>
          <button type="submit" disabled={submitting} className="btn-primary disabled:opacity-50">
            <Save size={16} className="inline mr-1" /> {submitting ? 'Adding...' : 'Add Slot'}
          </button>
        </form>
      )}

      {/* Slot Grid */}
      {slotsLoading ? <LoadingSpinner /> : slots.length === 0 ? (
        <EmptyState icon={ParkingCircle} title="No slots" description="This location has no slots yet" />
      ) : (
        <>
          {/* Legend */}
          <div className="flex flex-wrap gap-4 text-xs">
            <div className="flex items-center gap-1.5"><div className="w-3 h-3 rounded bg-accent-emerald/30 border border-accent-emerald/50" /> Available ({slots.filter(s => s.status === 'Available').length})</div>
            <div className="flex items-center gap-1.5"><div className="w-3 h-3 rounded bg-accent-amber/30 border border-accent-amber/50" /> Reserved ({slots.filter(s => s.status === 'Reserved').length})</div>
            <div className="flex items-center gap-1.5"><div className="w-3 h-3 rounded bg-accent-rose/30 border border-accent-rose/50" /> Occupied ({slots.filter(s => s.status === 'Occupied').length})</div>
            <div className="flex items-center gap-1.5"><div className="w-3 h-3 rounded bg-slate-500/30 border border-slate-500/50" /> Maintenance ({slots.filter(s => s.status === 'Maintenance').length})</div>
          </div>

          <div className="glass-card p-6">
            <div className="flex flex-wrap gap-2.5">
              {slots.map(slot => (
                <div key={slot._id} className={`slot-grid-item ${slotColorClass(slot.status)}`}
                  title={`${slot.slot_number} - ${slot.slot_type} (${slot.status})`}>
                  <div className="text-center">
                    <div className="text-xs font-bold">{slot.slot_number}</div>
                    <div className="text-[10px] opacity-70">{slot.slot_type === 'EV' ? '⚡' : slot.slot_type === 'Disabled' ? '♿' : ''}</div>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Slot table */}
          <div className="glass-card overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-navy-600/50">
                    <th className="text-left px-5 py-3 text-xs font-semibold text-slate-400 uppercase">Slot</th>
                    <th className="text-left px-5 py-3 text-xs font-semibold text-slate-400 uppercase">Type</th>
                    <th className="text-left px-5 py-3 text-xs font-semibold text-slate-400 uppercase">Status</th>
                    <th className="text-left px-5 py-3 text-xs font-semibold text-slate-400 uppercase">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {slots.map(slot => (
                    <tr key={slot._id} className="border-b border-navy-700/30 hover:bg-navy-700/20">
                      <td className="px-5 py-3 text-white font-medium">{slot.slot_number}</td>
                      <td className="px-5 py-3 text-slate-300">{slot.slot_type}</td>
                      <td className="px-5 py-3"><Badge status={slot.status} /></td>
                      <td className="px-5 py-3">
                        <div className="flex items-center gap-2">
                          <select className="input-field text-xs py-1 px-2 w-32"
                            value={slot.status} onChange={e => handleUpdateStatus(slot._id, e.target.value)}>
                            <option>Available</option><option>Reserved</option><option>Occupied</option><option>Maintenance</option>
                          </select>
                          <button onClick={() => handleDelete(slot._id)} className="p-1 text-slate-500 hover:text-red-400">
                            <Trash2 size={14} />
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </>
      )}
    </div>
  );
}
