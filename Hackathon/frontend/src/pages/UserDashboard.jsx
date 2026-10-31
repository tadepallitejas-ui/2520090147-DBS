import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { reservationAPI, vehicleAPI, parkingAPI } from '../services/api';
import { StatCard, LoadingSpinner, Badge, EmptyState } from '../components/UI';
import { CalendarCheck, Car, MapPin, Clock, ArrowRight } from 'lucide-react';

export default function UserDashboard() {
  const { user } = useAuth();
  const [reservations, setReservations] = useState([]);
  const [vehicles, setVehicles] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    Promise.all([
      reservationAPI.getMyReservations(),
      vehicleAPI.getMyVehicles()
    ]).then(([resRes, vehRes]) => {
      setReservations(resRes.data);
      setVehicles(vehRes.data);
    }).catch(console.error)
      .finally(() => setLoading(false));
  }, []);

  if (loading) return <LoadingSpinner />;

  const activeReservations = reservations.filter(r => ['confirmed', 'checked_in'].includes(r.status));
  const completedReservations = reservations.filter(r => r.status === 'completed');

  return (
    <div className="space-y-6 animate-fade-in">
      <div>
        <h1 className="text-2xl font-bold text-white">Welcome, {user?.name} 👋</h1>
        <p className="text-slate-400 text-sm mt-1">Here's your parking overview</p>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard title="Active Reservations" value={activeReservations.length} icon={CalendarCheck} color="blue" />
        <StatCard title="My Vehicles" value={vehicles.length} icon={Car} color="cyan" />
        <StatCard title="Total Bookings" value={reservations.length} icon={Clock} color="indigo" />
        <StatCard title="Completed" value={completedReservations.length} icon={MapPin} color="emerald" />
      </div>

      {/* Quick Actions */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <Link to="/find-parking" className="glass-card p-6 flex items-center justify-between group">
          <div>
            <h3 className="text-lg font-semibold text-white">Find Parking</h3>
            <p className="text-sm text-slate-400">Browse available parking locations</p>
          </div>
          <ArrowRight className="text-slate-500 group-hover:text-accent-blue transition-colors" />
        </Link>
        <Link to="/vehicles" className="glass-card p-6 flex items-center justify-between group">
          <div>
            <h3 className="text-lg font-semibold text-white">Manage Vehicles</h3>
            <p className="text-sm text-slate-400">Add or edit your vehicles</p>
          </div>
          <ArrowRight className="text-slate-500 group-hover:text-accent-blue transition-colors" />
        </Link>
      </div>

      {/* Recent Reservations */}
      <div className="glass-card p-6">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-lg font-semibold text-white">Recent Reservations</h2>
          <Link to="/reservations" className="text-sm text-accent-blue hover:text-accent-cyan">View all</Link>
        </div>
        {reservations.length === 0 ? (
          <EmptyState icon={CalendarCheck} title="No reservations yet" description="Find a parking location and make your first reservation" />
        ) : (
          <div className="space-y-3">
            {reservations.slice(0, 5).map(res => (
              <Link key={res._id} to={`/reservations/${res._id}`}
                className="flex items-center justify-between p-4 bg-navy-900/50 rounded-xl hover:bg-navy-700/50 transition-colors">
                <div className="flex items-center gap-4">
                  <div className="w-10 h-10 rounded-lg bg-accent-blue/10 flex items-center justify-center">
                    <MapPin size={18} className="text-accent-blue" />
                  </div>
                  <div>
                    <p className="text-sm font-medium text-white">{res.location_name}</p>
                    <p className="text-xs text-slate-400">
                      Slot {res.slot_number} • {res.vehicle_number}
                    </p>
                  </div>
                </div>
                <div className="text-right">
                  <Badge status={res.status} />
                  <p className="text-xs text-slate-500 mt-1">₹{res.estimated_cost}</p>
                </div>
              </Link>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
