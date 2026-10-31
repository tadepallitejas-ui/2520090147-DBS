import { useState, useEffect } from 'react';
import { parkingAPI } from '../../services/api';
import { LoadingSpinner, EmptyState } from '../../components/UI';
import { MapPin, Plus, Edit3, Trash2, X, Save } from 'lucide-react';
import toast from 'react-hot-toast';

export default function ManageLocations() {
  const [locations, setLocations] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [editId, setEditId] = useState(null);
  const [form, setForm] = useState({
    name: '', address: '', city: '', description: '',
    total_slots: 20, price_per_hour: 30, operating_hours: '24/7', parking_type: 'Indoor'
  });
  const [submitting, setSubmitting] = useState(false);

  const fetchLocations = () => {
    parkingAPI.getLocations()
      .then(res => setLocations(res.data))
      .catch(console.error)
      .finally(() => setLoading(false));
  };

  useEffect(() => { fetchLocations(); }, []);

  const resetForm = () => {
    setForm({ name: '', address: '', city: '', description: '', total_slots: 20, price_per_hour: 30, operating_hours: '24/7', parking_type: 'Indoor' });
    setEditId(null);
    setShowForm(false);
  };

  const handleEdit = (loc) => {
    setForm({
      name: loc.name, address: loc.address, city: loc.city, description: loc.description || '',
      total_slots: loc.total_slots, price_per_hour: loc.price_per_hour,
      operating_hours: loc.operating_hours, parking_type: loc.parking_type
    });
    setEditId(loc._id);
    setShowForm(true);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSubmitting(true);
    try {
      if (editId) {
        await parkingAPI.updateLocation(editId, form);
        toast.success('Location updated');
      } else {
        await parkingAPI.createLocation(form);
        toast.success('Location created with slots');
      }
      resetForm();
      fetchLocations();
    } catch (err) {
      toast.error(err.response?.data?.detail || 'Operation failed');
    } finally {
      setSubmitting(false);
    }
  };

  const handleDelete = async (id) => {
    if (!confirm('Delete this location and all its slots?')) return;
    try {
      await parkingAPI.deleteLocation(id);
      toast.success('Location deleted');
      fetchLocations();
    } catch (err) {
      toast.error('Failed to delete');
    }
  };

  if (loading) return <LoadingSpinner />;

  return (
    <div className="space-y-6 animate-fade-in">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-white">Manage Parking Locations</h1>
          <p className="text-slate-400 text-sm mt-1">{locations.length} locations</p>
        </div>
        <button onClick={() => { resetForm(); setShowForm(!showForm); }} className="btn-primary flex items-center gap-2">
          {showForm ? <X size={16} /> : <Plus size={16} />} {showForm ? 'Cancel' : 'Add Location'}
        </button>
      </div>

      {showForm && (
        <form onSubmit={handleSubmit} className="glass-card p-6 grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className="block text-sm text-slate-300 mb-1">Name</label>
            <input className="input-field" value={form.name} onChange={e => setForm(p => ({ ...p, name: e.target.value }))} required />
          </div>
          <div>
            <label className="block text-sm text-slate-300 mb-1">City</label>
            <input className="input-field" value={form.city} onChange={e => setForm(p => ({ ...p, city: e.target.value }))} required />
          </div>
          <div className="md:col-span-2">
            <label className="block text-sm text-slate-300 mb-1">Address</label>
            <input className="input-field" value={form.address} onChange={e => setForm(p => ({ ...p, address: e.target.value }))} required />
          </div>
          <div className="md:col-span-2">
            <label className="block text-sm text-slate-300 mb-1">Description</label>
            <textarea className="input-field" rows={2} value={form.description} onChange={e => setForm(p => ({ ...p, description: e.target.value }))} />
          </div>
          <div>
            <label className="block text-sm text-slate-300 mb-1">Total Slots</label>
            <input type="number" className="input-field" min="1" value={form.total_slots} onChange={e => setForm(p => ({ ...p, total_slots: parseInt(e.target.value) }))} required />
          </div>
          <div>
            <label className="block text-sm text-slate-300 mb-1">Price per Hour (₹)</label>
            <input type="number" className="input-field" min="0" step="0.5" value={form.price_per_hour} onChange={e => setForm(p => ({ ...p, price_per_hour: parseFloat(e.target.value) }))} required />
          </div>
          <div>
            <label className="block text-sm text-slate-300 mb-1">Operating Hours</label>
            <input className="input-field" value={form.operating_hours} onChange={e => setForm(p => ({ ...p, operating_hours: e.target.value }))} />
          </div>
          <div>
            <label className="block text-sm text-slate-300 mb-1">Parking Type</label>
            <select className="input-field" value={form.parking_type} onChange={e => setForm(p => ({ ...p, parking_type: e.target.value }))}>
              <option>Indoor</option><option>Outdoor</option><option>Underground</option><option>Multi-level</option>
            </select>
          </div>
          <div className="md:col-span-2">
            <button type="submit" disabled={submitting} className="btn-primary flex items-center gap-2 disabled:opacity-50">
              <Save size={16} /> {submitting ? 'Saving...' : editId ? 'Update Location' : 'Create Location'}
            </button>
          </div>
        </form>
      )}

      {locations.length === 0 ? (
        <EmptyState icon={MapPin} title="No locations yet" description="Add your first parking location" />
      ) : (
        <div className="space-y-3">
          {locations.map(loc => (
            <div key={loc._id} className="glass-card p-5 flex flex-col md:flex-row md:items-center md:justify-between gap-4">
              <div className="flex items-start gap-4">
                <div className="w-12 h-12 rounded-xl bg-accent-blue/10 flex items-center justify-center shrink-0">
                  <MapPin size={20} className="text-accent-blue" />
                </div>
                <div>
                  <h3 className="font-semibold text-white">{loc.name}</h3>
                  <p className="text-xs text-slate-400">{loc.address}, {loc.city}</p>
                  <div className="flex items-center gap-4 mt-2 text-xs">
                    <span className="text-accent-emerald">{loc.available_slots}/{loc.total_slots} available</span>
                    <span className="text-accent-amber">₹{loc.price_per_hour}/hr</span>
                    <span className="text-slate-500">{loc.parking_type}</span>
                  </div>
                </div>
              </div>
              <div className="flex items-center gap-2">
                <button onClick={() => handleEdit(loc)} className="btn-secondary text-sm px-3 py-1.5 flex items-center gap-1">
                  <Edit3 size={14} /> Edit
                </button>
                <button onClick={() => handleDelete(loc._id)} className="btn-danger text-sm px-3 py-1.5 flex items-center gap-1">
                  <Trash2 size={14} /> Delete
                </button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
