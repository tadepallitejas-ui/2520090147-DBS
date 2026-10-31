import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { parkingAPI } from '../services/api';
import { LoadingSpinner, EmptyState } from '../components/UI';
import { MapPin, Search, Filter, Clock, DollarSign, Car } from 'lucide-react';

export default function FindParking() {
  const [locations, setLocations] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filters, setFilters] = useState({ city: '', parking_type: '', min_price: '', max_price: '' });
  const [showFilters, setShowFilters] = useState(false);

  const fetchLocations = () => {
    setLoading(true);
    const params = {};
    if (filters.city) params.city = filters.city;
    if (filters.parking_type) params.parking_type = filters.parking_type;
    if (filters.min_price) params.min_price = filters.min_price;
    if (filters.max_price) params.max_price = filters.max_price;

    parkingAPI.getLocations(params)
      .then(res => setLocations(res.data))
      .catch(console.error)
      .finally(() => setLoading(false));
  };

  useEffect(() => { fetchLocations(); }, []);

  const handleSearch = (e) => {
    e.preventDefault();
    fetchLocations();
  };

  return (
    <div className="space-y-6 animate-fade-in">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-white">Find Parking</h1>
          <p className="text-slate-400 text-sm mt-1">Browse available parking locations</p>
        </div>
        <button onClick={() => setShowFilters(!showFilters)} className="btn-secondary flex items-center gap-2">
          <Filter size={16} /> Filters
        </button>
      </div>

      {/* Filters */}
      {showFilters && (
        <form onSubmit={handleSearch} className="glass-card p-5 grid grid-cols-1 md:grid-cols-4 gap-4">
          <div>
            <label className="block text-xs text-slate-400 mb-1">City</label>
            <input className="input-field" placeholder="e.g. Bangalore" value={filters.city}
              onChange={e => setFilters(p => ({ ...p, city: e.target.value }))} />
          </div>
          <div>
            <label className="block text-xs text-slate-400 mb-1">Type</label>
            <select className="input-field" value={filters.parking_type}
              onChange={e => setFilters(p => ({ ...p, parking_type: e.target.value }))}>
              <option value="">All Types</option>
              <option value="Indoor">Indoor</option>
              <option value="Outdoor">Outdoor</option>
              <option value="Underground">Underground</option>
              <option value="Multi-level">Multi-level</option>
            </select>
          </div>
          <div>
            <label className="block text-xs text-slate-400 mb-1">Min Price (₹/hr)</label>
            <input type="number" className="input-field" placeholder="0" value={filters.min_price}
              onChange={e => setFilters(p => ({ ...p, min_price: e.target.value }))} />
          </div>
          <div className="flex items-end gap-2">
            <div className="flex-1">
              <label className="block text-xs text-slate-400 mb-1">Max Price (₹/hr)</label>
              <input type="number" className="input-field" placeholder="200" value={filters.max_price}
                onChange={e => setFilters(p => ({ ...p, max_price: e.target.value }))} />
            </div>
            <button type="submit" className="btn-primary flex items-center gap-2">
              <Search size={16} /> Search
            </button>
          </div>
        </form>
      )}

      {loading ? <LoadingSpinner /> : locations.length === 0 ? (
        <EmptyState icon={MapPin} title="No locations found" description="Try adjusting your filters" />
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
          {locations.map((loc, idx) => (
            <Link key={loc._id} to={`/parking/${loc._id}`}
              className="glass-card overflow-hidden group animate-fade-in"
              style={{ animationDelay: `${idx * 0.05}s` }}>
              {/* Gradient header */}
              <div className="h-32 bg-gradient-to-br from-accent-blue/20 to-accent-cyan/10 flex items-center justify-center relative">
                <Car size={40} className="text-accent-blue/40" />
                <span className="absolute top-3 right-3 px-2.5 py-1 bg-navy-800/80 rounded-lg text-xs font-medium text-slate-300">
                  {loc.parking_type}
                </span>
              </div>
              <div className="p-5">
                <h3 className="text-base font-semibold text-white mb-1 group-hover:text-accent-blue transition-colors">
                  {loc.name}
                </h3>
                <p className="text-xs text-slate-400 flex items-center gap-1 mb-3">
                  <MapPin size={12} /> {loc.address}, {loc.city}
                </p>
                <div className="flex items-center justify-between text-sm">
                  <div className="flex items-center gap-1 text-accent-emerald">
                    <div className="w-2 h-2 rounded-full bg-accent-emerald" />
                    {loc.available_slots}/{loc.total_slots} available
                  </div>
                  <div className="flex items-center gap-1 text-accent-amber font-semibold">
                    ₹{loc.price_per_hour}/hr
                  </div>
                </div>
                <div className="flex items-center gap-1 text-xs text-slate-500 mt-2">
                  <Clock size={12} /> {loc.operating_hours}
                </div>
              </div>
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}
