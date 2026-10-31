import { useState, useEffect } from 'react';
import { vehicleAPI } from '../services/api';
import { LoadingSpinner, EmptyState } from '../components/UI';
import { Car, Plus, Trash2, Edit3, X } from 'lucide-react';
import toast from 'react-hot-toast';

export default function VehicleManagement() {
  const [vehicles, setVehicles] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [form, setForm] = useState({
    registration_number: '', vehicle_type: 'Car', vehicle_model: '', vehicle_color: ''
  });
  const [submitting, setSubmitting] = useState(false);

  const fetchVehicles = () => {
    vehicleAPI.getMyVehicles()
      .then(res => setVehicles(res.data))
      .catch(console.error)
      .finally(() => setLoading(false));
  };

  useEffect(() => { fetchVehicles(); }, []);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSubmitting(true);
    try {
      await vehicleAPI.createVehicle(form);
      toast.success('Vehicle registered successfully');
      setShowForm(false);
      setForm({ registration_number: '', vehicle_type: 'Car', vehicle_model: '', vehicle_color: '' });
      fetchVehicles();
    } catch (err) {
      toast.error(err.response?.data?.detail || 'Failed to register vehicle');
    } finally {
      setSubmitting(false);
    }
  };

  const handleDelete = async (id) => {
    if (!confirm('Are you sure you want to delete this vehicle?')) return;
    try {
      await vehicleAPI.deleteVehicle(id);
      toast.success('Vehicle deleted');
      fetchVehicles();
    } catch (err) {
      toast.error('Failed to delete vehicle');
    }
  };

  if (loading) return <LoadingSpinner />;

  const typeColors = {
    Car: 'from-accent-blue/20 to-accent-blue/5',
    SUV: 'from-accent-indigo/20 to-accent-indigo/5',
    Motorcycle: 'from-accent-cyan/20 to-accent-cyan/5',
    Truck: 'from-accent-amber/20 to-accent-amber/5',
    Van: 'from-accent-emerald/20 to-accent-emerald/5'
  };

  return (
    <div className="space-y-6 animate-fade-in">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-white">My Vehicles</h1>
          <p className="text-slate-400 text-sm mt-1">Manage your registered vehicles</p>
        </div>
        <button onClick={() => setShowForm(!showForm)} className="btn-primary flex items-center gap-2">
          {showForm ? <X size={16} /> : <Plus size={16} />} {showForm ? 'Cancel' : 'Add Vehicle'}
        </button>
      </div>

      {/* Add Form */}
      {showForm && (
        <form onSubmit={handleSubmit} className="glass-card p-6 grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className="block text-sm text-slate-300 mb-1.5">Registration Number</label>
            <input className="input-field" placeholder="e.g. KA01AB1234" value={form.registration_number}
              onChange={e => setForm(p => ({ ...p, registration_number: e.target.value }))} required />
          </div>
          <div>
            <label className="block text-sm text-slate-300 mb-1.5">Vehicle Type</label>
            <select className="input-field" value={form.vehicle_type}
              onChange={e => setForm(p => ({ ...p, vehicle_type: e.target.value }))}>
              <option>Car</option>
              <option>SUV</option>
              <option>Motorcycle</option>
              <option>Truck</option>
              <option>Van</option>
            </select>
          </div>
          <div>
            <label className="block text-sm text-slate-300 mb-1.5">Vehicle Model</label>
            <input className="input-field" placeholder="e.g. Hyundai Creta" value={form.vehicle_model}
              onChange={e => setForm(p => ({ ...p, vehicle_model: e.target.value }))} required />
          </div>
          <div className="flex items-end gap-3">
            <div className="flex-1">
              <label className="block text-sm text-slate-300 mb-1.5">Color</label>
              <input className="input-field" placeholder="e.g. White" value={form.vehicle_color}
                onChange={e => setForm(p => ({ ...p, vehicle_color: e.target.value }))} required />
            </div>
            <button type="submit" disabled={submitting} className="btn-primary disabled:opacity-50">
              {submitting ? 'Adding...' : 'Add'}
            </button>
          </div>
        </form>
      )}

      {/* Vehicle List */}
      {vehicles.length === 0 ? (
        <EmptyState icon={Car} title="No vehicles registered" description="Add your first vehicle to start booking parking" />
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {vehicles.map(vehicle => (
            <div key={vehicle._id} className={`glass-card p-5 bg-gradient-to-br ${typeColors[vehicle.vehicle_type] || typeColors.Car}`}>
              <div className="flex items-start justify-between mb-3">
                <div className="w-10 h-10 rounded-xl bg-white/10 flex items-center justify-center">
                  <Car size={20} className="text-accent-blue" />
                </div>
                <button onClick={() => handleDelete(vehicle._id)} className="p-1.5 text-slate-500 hover:text-red-400 transition-colors">
                  <Trash2 size={16} />
                </button>
              </div>
              <h3 className="text-lg font-bold text-white tracking-wider">{vehicle.registration_number}</h3>
              <p className="text-sm text-slate-300 mt-1">{vehicle.vehicle_model}</p>
              <div className="flex items-center gap-3 mt-3 text-xs text-slate-400">
                <span className="px-2 py-0.5 bg-white/5 rounded-md">{vehicle.vehicle_type}</span>
                <span className="px-2 py-0.5 bg-white/5 rounded-md">{vehicle.vehicle_color}</span>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
