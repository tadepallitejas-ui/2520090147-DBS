import { useState, useEffect } from 'react';
import { adminAPI } from '../../services/api';
import { StatCard, LoadingSpinner } from '../../components/UI';
import {
  MapPin, ParkingCircle, Users, CalendarCheck, DollarSign,
  Car, BarChart3, TrendingUp, Activity
} from 'lucide-react';
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
  PieChart, Pie, Cell, LineChart, Line, AreaChart, Area
} from 'recharts';

const CHART_COLORS = ['#10b981', '#f59e0b', '#f43f5e', '#6b7280'];

export default function AdminDashboard() {
  const [stats, setStats] = useState(null);
  const [dailyRes, setDailyRes] = useState([]);
  const [revenue, setRevenue] = useState([]);
  const [slotDist, setSlotDist] = useState([]);
  const [peakHours, setPeakHours] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    Promise.all([
      adminAPI.getStats(),
      adminAPI.getDailyReservations(),
      adminAPI.getRevenueTrend(),
      adminAPI.getSlotDistribution(),
      adminAPI.getPeakHours()
    ]).then(([s, d, r, sd, ph]) => {
      setStats(s.data);
      setDailyRes(d.data);
      setRevenue(r.data);
      setSlotDist(sd.data);
      setPeakHours(ph.data);
    }).catch(console.error)
      .finally(() => setLoading(false));
  }, []);

  if (loading) return <LoadingSpinner />;

  const CustomTooltip = ({ active, payload, label }) => {
    if (!active || !payload?.length) return null;
    return (
      <div className="bg-navy-800 border border-navy-600 rounded-lg p-3 text-sm shadow-xl">
        <p className="text-slate-400 text-xs">{label}</p>
        {payload.map((p, i) => (
          <p key={i} className="font-semibold" style={{ color: p.color }}>
            {p.name}: {typeof p.value === 'number' && p.name?.toLowerCase().includes('revenue') ? `₹${p.value}` : p.value}
          </p>
        ))}
      </div>
    );
  };

  return (
    <div className="space-y-6 animate-fade-in">
      <div>
        <h1 className="text-2xl font-bold text-white">Admin Dashboard</h1>
        <p className="text-slate-400 text-sm mt-1">System overview and analytics</p>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard title="Parking Locations" value={stats?.total_locations} icon={MapPin} color="blue" />
        <StatCard title="Total Slots" value={stats?.total_slots} icon={ParkingCircle} color="cyan" />
        <StatCard title="Available Slots" value={stats?.available_slots} icon={Activity} color="emerald" />
        <StatCard title="Occupied Slots" value={stats?.occupied_slots} icon={Car} color="rose" />
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard title="Reserved Slots" value={stats?.reserved_slots} icon={CalendarCheck} color="amber" />
        <StatCard title="Total Users" value={stats?.total_users} icon={Users} color="indigo" />
        <StatCard title="Active Reservations" value={stats?.active_reservations} icon={CalendarCheck} color="blue" />
        <StatCard title="Today's Revenue" value={`₹${stats?.today_revenue}`} icon={DollarSign} color="emerald"
          subtitle={`Total: ₹${stats?.total_revenue}`} />
      </div>

      {/* Utilization */}
      <div className="glass-card p-5">
        <div className="flex items-center justify-between mb-3">
          <span className="text-sm text-slate-400">Parking Utilization</span>
          <span className="text-sm font-bold text-accent-blue">{stats?.utilization_percentage}%</span>
        </div>
        <div className="w-full h-3 bg-navy-700 rounded-full overflow-hidden">
          <div className="h-full bg-gradient-to-r from-accent-blue to-accent-cyan rounded-full transition-all duration-500"
            style={{ width: `${stats?.utilization_percentage}%` }} />
        </div>
      </div>

      {/* Charts */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Daily Reservations */}
        <div className="glass-card p-6">
          <h3 className="text-base font-semibold text-white mb-4 flex items-center gap-2">
            <BarChart3 size={18} className="text-accent-blue" /> Daily Reservations
          </h3>
          <ResponsiveContainer width="100%" height={250}>
            <BarChart data={dailyRes}>
              <CartesianGrid strokeDasharray="3 3" stroke="#1a2332" />
              <XAxis dataKey="date" stroke="#64748b" fontSize={12} />
              <YAxis stroke="#64748b" fontSize={12} />
              <Tooltip content={<CustomTooltip />} />
              <Bar dataKey="reservations" fill="#3b82f6" radius={[4, 4, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>

        {/* Revenue Trend */}
        <div className="glass-card p-6">
          <h3 className="text-base font-semibold text-white mb-4 flex items-center gap-2">
            <TrendingUp size={18} className="text-accent-emerald" /> Revenue Trend
          </h3>
          <ResponsiveContainer width="100%" height={250}>
            <AreaChart data={revenue}>
              <CartesianGrid strokeDasharray="3 3" stroke="#1a2332" />
              <XAxis dataKey="date" stroke="#64748b" fontSize={12} />
              <YAxis stroke="#64748b" fontSize={12} />
              <Tooltip content={<CustomTooltip />} />
              <Area type="monotone" dataKey="revenue" stroke="#10b981" fill="#10b98120" strokeWidth={2} />
            </AreaChart>
          </ResponsiveContainer>
        </div>

        {/* Slot Distribution */}
        <div className="glass-card p-6">
          <h3 className="text-base font-semibold text-white mb-4 flex items-center gap-2">
            <ParkingCircle size={18} className="text-accent-cyan" /> Slot Distribution
          </h3>
          <ResponsiveContainer width="100%" height={250}>
            <PieChart>
              <Pie data={slotDist} cx="50%" cy="50%" innerRadius={60} outerRadius={90}
                dataKey="value" nameKey="name" label={({ name, value }) => `${name}: ${value}`}>
                {slotDist.map((_, i) => (
                  <Cell key={i} fill={CHART_COLORS[i % CHART_COLORS.length]} />
                ))}
              </Pie>
              <Tooltip content={<CustomTooltip />} />
            </PieChart>
          </ResponsiveContainer>
        </div>

        {/* Peak Hours */}
        <div className="glass-card p-6">
          <h3 className="text-base font-semibold text-white mb-4 flex items-center gap-2">
            <Activity size={18} className="text-accent-amber" /> Peak Parking Hours
          </h3>
          <ResponsiveContainer width="100%" height={250}>
            <LineChart data={peakHours}>
              <CartesianGrid strokeDasharray="3 3" stroke="#1a2332" />
              <XAxis dataKey="hour" stroke="#64748b" fontSize={10} interval={2} />
              <YAxis stroke="#64748b" fontSize={12} />
              <Tooltip content={<CustomTooltip />} />
              <Line type="monotone" dataKey="entries" stroke="#f59e0b" strokeWidth={2} dot={false} />
            </LineChart>
          </ResponsiveContainer>
        </div>
      </div>
    </div>
  );
}
