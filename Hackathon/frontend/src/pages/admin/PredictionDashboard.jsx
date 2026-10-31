import { useState, useEffect } from 'react';
import { predictionAPI } from '../../services/api';
import { LoadingSpinner } from '../../components/UI';
import { BrainCircuit, AlertTriangle, Info } from 'lucide-react';
import {
  AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
  BarChart, Bar
} from 'recharts';

export default function PredictionDashboard() {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    predictionAPI.getOccupancyPredictions()
      .then(res => setData(res.data))
      .catch(err => setError(err.response?.data?.detail || 'Failed to load predictions'))
      .finally(() => setLoading(false));
  }, []);

  if (loading) return <LoadingSpinner />;
  if (error) return (
    <div className="text-center py-20">
      <AlertTriangle size={48} className="text-accent-amber mx-auto mb-4" />
      <p className="text-slate-400">{error}</p>
    </div>
  );

  const predictions = data?.predictions || [];
  const metadata = data?.metadata || {};

  const CustomTooltip = ({ active, payload, label }) => {
    if (!active || !payload?.length) return null;
    const p = payload[0].payload;
    return (
      <div className="bg-navy-800 border border-navy-600 rounded-lg p-3 text-sm shadow-xl">
        <p className="text-white font-semibold">{label} ({p.day_name})</p>
        <p className="text-accent-cyan">Occupancy: {p.predicted_occupancy_pct}%</p>
        <p className="text-slate-400">Predicted: {p.predicted_occupied_slots}/{p.total_slots} slots</p>
      </div>
    );
  };

  // Find peak prediction
  const peak = predictions.reduce((max, p) => p.predicted_occupancy_pct > max.predicted_occupancy_pct ? p : max, predictions[0] || {});

  return (
    <div className="space-y-6 animate-fade-in">
      <div>
        <h1 className="text-2xl font-bold text-white flex items-center gap-3">
          <BrainCircuit className="text-accent-cyan" />
          ML Occupancy Predictions
        </h1>
        <p className="text-slate-400 text-sm mt-1">Predicted parking occupancy for the next 24 hours</p>
      </div>

      {/* Data source notice */}
      <div className={`flex items-start gap-3 p-4 rounded-xl border ${
        metadata.data_source === 'sample'
          ? 'bg-accent-amber/5 border-accent-amber/20'
          : 'bg-accent-emerald/5 border-accent-emerald/20'
      }`}>
        <Info size={18} className={metadata.data_source === 'sample' ? 'text-accent-amber mt-0.5' : 'text-accent-emerald mt-0.5'} />
        <div>
          <p className={`text-sm font-medium ${metadata.data_source === 'sample' ? 'text-accent-amber' : 'text-accent-emerald'}`}>
            {metadata.data_source === 'sample' ? 'Sample Data Predictions' : 'Historical Data Predictions'}
          </p>
          <p className="text-xs text-slate-400 mt-0.5">{metadata.note}</p>
          <p className="text-xs text-slate-500 mt-1">Model: {metadata.model} • Slots: {metadata.total_slots}</p>
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="glass-card p-5">
          <p className="text-xs text-slate-400 uppercase">Peak Hour</p>
          <p className="text-2xl font-bold text-white mt-1">{peak?.time}</p>
          <p className="text-xs text-slate-500">{peak?.day_name}</p>
        </div>
        <div className="glass-card p-5">
          <p className="text-xs text-slate-400 uppercase">Peak Occupancy</p>
          <p className="text-2xl font-bold text-accent-rose mt-1">{peak?.predicted_occupancy_pct}%</p>
          <p className="text-xs text-slate-500">{peak?.predicted_occupied_slots}/{peak?.total_slots} slots</p>
        </div>
        <div className="glass-card p-5">
          <p className="text-xs text-slate-400 uppercase">Avg. Occupancy</p>
          <p className="text-2xl font-bold text-accent-cyan mt-1">
            {(predictions.reduce((s, p) => s + p.predicted_occupancy_pct, 0) / predictions.length).toFixed(1)}%
          </p>
          <p className="text-xs text-slate-500">Next 24 hours</p>
        </div>
      </div>

      {/* Area Chart */}
      <div className="glass-card p-6">
        <h3 className="text-base font-semibold text-white mb-4">Predicted Occupancy Timeline</h3>
        <ResponsiveContainer width="100%" height={350}>
          <AreaChart data={predictions}>
            <defs>
              <linearGradient id="occGrad" x1="0" y1="0" x2="0" y2="1">
                <stop offset="0%" stopColor="#06b6d4" stopOpacity={0.3} />
                <stop offset="100%" stopColor="#06b6d4" stopOpacity={0} />
              </linearGradient>
            </defs>
            <CartesianGrid strokeDasharray="3 3" stroke="#1a2332" />
            <XAxis dataKey="time" stroke="#64748b" fontSize={11} />
            <YAxis stroke="#64748b" fontSize={12} domain={[0, 100]} tickFormatter={v => `${v}%`} />
            <Tooltip content={<CustomTooltip />} />
            <Area type="monotone" dataKey="predicted_occupancy_pct" stroke="#06b6d4" fill="url(#occGrad)" strokeWidth={2} />
          </AreaChart>
        </ResponsiveContainer>
      </div>

      {/* Bar Chart */}
      <div className="glass-card p-6">
        <h3 className="text-base font-semibold text-white mb-4">Predicted Occupied Slots</h3>
        <ResponsiveContainer width="100%" height={300}>
          <BarChart data={predictions}>
            <CartesianGrid strokeDasharray="3 3" stroke="#1a2332" />
            <XAxis dataKey="time" stroke="#64748b" fontSize={11} />
            <YAxis stroke="#64748b" fontSize={12} />
            <Tooltip content={<CustomTooltip />} />
            <Bar dataKey="predicted_occupied_slots" fill="#6366f1" radius={[3, 3, 0, 0]} />
          </BarChart>
        </ResponsiveContainer>
      </div>

      {/* Data Table */}
      <div className="glass-card overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-navy-600/50">
                <th className="text-left px-5 py-3 text-xs font-semibold text-slate-400 uppercase">Time</th>
                <th className="text-left px-5 py-3 text-xs font-semibold text-slate-400 uppercase">Day</th>
                <th className="text-left px-5 py-3 text-xs font-semibold text-slate-400 uppercase">Predicted Occupancy</th>
                <th className="text-left px-5 py-3 text-xs font-semibold text-slate-400 uppercase">Occupied/Total</th>
                <th className="text-left px-5 py-3 text-xs font-semibold text-slate-400 uppercase">Level</th>
              </tr>
            </thead>
            <tbody>
              {predictions.map((p, i) => {
                const level = p.predicted_occupancy_pct > 80 ? 'High' : p.predicted_occupancy_pct > 50 ? 'Medium' : 'Low';
                const levelColor = level === 'High' ? 'text-accent-rose' : level === 'Medium' ? 'text-accent-amber' : 'text-accent-emerald';
                return (
                  <tr key={i} className="border-b border-navy-700/30 hover:bg-navy-700/20">
                    <td className="px-5 py-2.5 text-white font-medium">{p.time}</td>
                    <td className="px-5 py-2.5 text-slate-300">{p.day_name}</td>
                    <td className="px-5 py-2.5">
                      <div className="flex items-center gap-2">
                        <div className="w-24 h-2 bg-navy-700 rounded-full overflow-hidden">
                          <div className="h-full bg-accent-cyan rounded-full" style={{ width: `${p.predicted_occupancy_pct}%` }} />
                        </div>
                        <span className="text-accent-cyan font-semibold">{p.predicted_occupancy_pct}%</span>
                      </div>
                    </td>
                    <td className="px-5 py-2.5 text-slate-300">{p.predicted_occupied_slots}/{p.total_slots}</td>
                    <td className={`px-5 py-2.5 font-semibold ${levelColor}`}>{level}</td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
