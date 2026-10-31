import { useState, useEffect } from 'react';
import { reservationAPI, parkingLogAPI } from '../../services/api';
import { LoadingSpinner, Badge, EmptyState } from '../../components/UI';
import { Clock, LogIn, LogOut, Check } from 'lucide-react';
import toast from 'react-hot-toast';

export default function EntryExitManagement() {
  const [reservations, setReservations] = useState([]);
  const [logs, setLogs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [tab, setTab] = useState('pending');

  const fetchData = () => {
    Promise.all([
      reservationAPI.getAllReservations(),
      parkingLogAPI.getLogs()
    ]).then(([resRes, logRes]) => {
      setReservations(resRes.data);
      setLogs(logRes.data);
    }).catch(console.error)
      .finally(() => setLoading(false));
  };

  useEffect(() => { fetchData(); }, []);

  const handleCheckIn = async (resId) => {
    try {
      const res = await parkingLogAPI.checkIn({ reservation_id: resId });
      toast.success(`Checked in at ${new Date(res.data.entry_time).toLocaleTimeString()}`);
      fetchData();
    } catch (err) {
      toast.error(err.response?.data?.detail || 'Check-in failed');
    }
  };

  const handleCheckOut = async (resId) => {
    try {
      const res = await parkingLogAPI.checkOut({ reservation_id: resId });
      toast.success(`Checked out - Fee: ₹${res.data.parking_fee}`);
      fetchData();
    } catch (err) {
      toast.error(err.response?.data?.detail || 'Check-out failed');
    }
  };

  if (loading) return <LoadingSpinner />;

  const confirmedRes = reservations.filter(r => r.status === 'confirmed');
  const checkedInRes = reservations.filter(r => r.status === 'checked_in');

  const formatDate = (d) => d ? new Date(d).toLocaleString('en-IN', { day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit' }) : 'N/A';

  return (
    <div className="space-y-6 animate-fade-in">
      <div>
        <h1 className="text-2xl font-bold text-white">Parking Entry / Exit</h1>
        <p className="text-slate-400 text-sm mt-1">Manage vehicle check-in and check-out</p>
      </div>

      {/* Tabs */}
      <div className="flex gap-2">
        {[
          { key: 'pending', label: `Check-In (${confirmedRes.length})`, icon: LogIn },
          { key: 'active', label: `Check-Out (${checkedInRes.length})`, icon: LogOut },
          { key: 'logs', label: `History (${logs.length})`, icon: Clock }
        ].map(t => (
          <button key={t.key} onClick={() => setTab(t.key)}
            className={`px-4 py-2 rounded-lg text-sm font-medium flex items-center gap-2 transition-colors ${
              tab === t.key ? 'bg-accent-blue/20 text-accent-blue border border-accent-blue/30' : 'bg-navy-700/50 text-slate-400 hover:text-white'
            }`}>
            <t.icon size={14} /> {t.label}
          </button>
        ))}
      </div>

      {/* Pending Check-Ins */}
      {tab === 'pending' && (
        confirmedRes.length === 0 ? (
          <EmptyState icon={LogIn} title="No pending check-ins" description="Confirmed reservations will appear here for check-in" />
        ) : (
          <div className="space-y-3">
            {confirmedRes.map(res => (
              <div key={res._id} className="glass-card p-5 flex flex-col md:flex-row md:items-center justify-between gap-4">
                <div>
                  <div className="flex items-center gap-2">
                    <h3 className="font-semibold text-white">{res.location_name}</h3>
                    <Badge status="confirmed" />
                  </div>
                  <p className="text-xs text-slate-400 mt-1">
                    Slot: {res.slot_number} • Vehicle: {res.vehicle_number} • User: {res.user_name}
                  </p>
                  <p className="text-xs text-slate-500 mt-1">
                    Entry: {formatDate(res.entry_time)} → Exit: {formatDate(res.exit_time)}
                  </p>
                </div>
                <button onClick={() => handleCheckIn(res._id)} className="btn-primary flex items-center gap-2 whitespace-nowrap">
                  <LogIn size={16} /> Check In
                </button>
              </div>
            ))}
          </div>
        )
      )}

      {/* Active (Check-out) */}
      {tab === 'active' && (
        checkedInRes.length === 0 ? (
          <EmptyState icon={LogOut} title="No active parkings" description="Checked-in vehicles will appear here for check-out" />
        ) : (
          <div className="space-y-3">
            {checkedInRes.map(res => (
              <div key={res._id} className="glass-card p-5 flex flex-col md:flex-row md:items-center justify-between gap-4">
                <div>
                  <div className="flex items-center gap-2">
                    <h3 className="font-semibold text-white">{res.location_name}</h3>
                    <Badge status="checked_in" />
                  </div>
                  <p className="text-xs text-slate-400 mt-1">
                    Slot: {res.slot_number} • Vehicle: {res.vehicle_number} • User: {res.user_name}
                  </p>
                  <p className="text-xs text-slate-500 mt-1">
                    Entry: {formatDate(res.entry_time)} • Est. Cost: ₹{res.estimated_cost}
                  </p>
                </div>
                <button onClick={() => handleCheckOut(res._id)} className="btn-primary bg-gradient-to-r from-accent-emerald to-emerald-600 flex items-center gap-2 whitespace-nowrap">
                  <LogOut size={16} /> Check Out
                </button>
              </div>
            ))}
          </div>
        )
      )}

      {/* Logs */}
      {tab === 'logs' && (
        logs.length === 0 ? (
          <EmptyState icon={Clock} title="No parking history" description="Entry and exit records will appear here" />
        ) : (
          <div className="glass-card overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-navy-600/50">
                    <th className="text-left px-4 py-3 text-xs font-semibold text-slate-400 uppercase">Vehicle</th>
                    <th className="text-left px-4 py-3 text-xs font-semibold text-slate-400 uppercase">Location</th>
                    <th className="text-left px-4 py-3 text-xs font-semibold text-slate-400 uppercase">Slot</th>
                    <th className="text-left px-4 py-3 text-xs font-semibold text-slate-400 uppercase">Entry</th>
                    <th className="text-left px-4 py-3 text-xs font-semibold text-slate-400 uppercase">Exit</th>
                    <th className="text-left px-4 py-3 text-xs font-semibold text-slate-400 uppercase">Duration</th>
                    <th className="text-left px-4 py-3 text-xs font-semibold text-slate-400 uppercase">Fee</th>
                    <th className="text-left px-4 py-3 text-xs font-semibold text-slate-400 uppercase">Status</th>
                  </tr>
                </thead>
                <tbody>
                  {logs.map(log => (
                    <tr key={log._id} className="border-b border-navy-700/30 hover:bg-navy-700/20">
                      <td className="px-4 py-3 text-white">{log.vehicle_number}</td>
                      <td className="px-4 py-3 text-slate-300">{log.location_name}</td>
                      <td className="px-4 py-3 text-slate-300">{log.slot_number}</td>
                      <td className="px-4 py-3 text-slate-400 text-xs">{formatDate(log.entry_timestamp)}</td>
                      <td className="px-4 py-3 text-slate-400 text-xs">{formatDate(log.exit_timestamp)}</td>
                      <td className="px-4 py-3 text-slate-300">{log.duration_hours ? `${log.duration_hours}h` : '-'}</td>
                      <td className="px-4 py-3 text-accent-emerald font-semibold">{log.parking_fee ? `₹${log.parking_fee}` : '-'}</td>
                      <td className="px-4 py-3"><Badge status={log.status} /></td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )
      )}
    </div>
  );
}
