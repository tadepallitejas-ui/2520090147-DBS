import { NavLink, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import {
  LayoutDashboard, MapPin, Car, CalendarCheck, Clock,
  User, LogOut, Settings, Users, BarChart3, ParkingCircle,
  BrainCircuit, FileText
} from 'lucide-react';

export default function Sidebar() {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const isAdmin = user?.role === 'admin';

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  const linkClass = ({ isActive }) =>
    `flex items-center gap-3 px-4 py-2.5 rounded-xl transition-all duration-200 text-sm font-medium ${
      isActive
        ? 'bg-accent-blue/15 text-accent-blue border border-accent-blue/20'
        : 'text-slate-400 hover:text-white hover:bg-white/5'
    }`;

  return (
    <aside className="fixed left-0 top-0 h-screen w-64 bg-navy-800 border-r border-navy-600/50 flex flex-col z-40">
      {/* Logo */}
      <div className="px-5 py-5 border-b border-navy-600/50">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-accent-blue to-accent-cyan flex items-center justify-center">
            <ParkingCircle className="w-6 h-6 text-white" />
          </div>
          <div>
            <h1 className="text-base font-bold text-white">SmartPark</h1>
            <p className="text-xs text-slate-500">Management System</p>
          </div>
        </div>
      </div>

      {/* Nav */}
      <nav className="flex-1 px-3 py-4 space-y-1 overflow-y-auto">
        {isAdmin ? (
          <>
            <p className="px-4 text-xs font-semibold text-slate-500 uppercase tracking-wider mb-2">Admin</p>
            <NavLink to="/admin/dashboard" className={linkClass}>
              <LayoutDashboard size={18} /> Dashboard
            </NavLink>
            <NavLink to="/admin/locations" className={linkClass}>
              <MapPin size={18} /> Parking Locations
            </NavLink>
            <NavLink to="/admin/slots" className={linkClass}>
              <ParkingCircle size={18} /> Manage Slots
            </NavLink>
            <NavLink to="/admin/reservations" className={linkClass}>
              <CalendarCheck size={18} /> Reservations
            </NavLink>
            <NavLink to="/admin/entry-exit" className={linkClass}>
              <Clock size={18} /> Entry / Exit
            </NavLink>
            <NavLink to="/admin/users" className={linkClass}>
              <Users size={18} /> Users & Vehicles
            </NavLink>
            <NavLink to="/admin/predictions" className={linkClass}>
              <BrainCircuit size={18} /> ML Predictions
            </NavLink>
          </>
        ) : (
          <>
            <p className="px-4 text-xs font-semibold text-slate-500 uppercase tracking-wider mb-2">Menu</p>
            <NavLink to="/dashboard" className={linkClass}>
              <LayoutDashboard size={18} /> Dashboard
            </NavLink>
            <NavLink to="/find-parking" className={linkClass}>
              <MapPin size={18} /> Find Parking
            </NavLink>
            <NavLink to="/vehicles" className={linkClass}>
              <Car size={18} /> My Vehicles
            </NavLink>
            <NavLink to="/reservations" className={linkClass}>
              <CalendarCheck size={18} /> Reservations
            </NavLink>
            <NavLink to="/profile" className={linkClass}>
              <User size={18} /> Profile
            </NavLink>
          </>
        )}
      </nav>

      {/* User info */}
      <div className="px-3 py-4 border-t border-navy-600/50">
        <div className="flex items-center gap-3 px-3 py-2">
          <div className="w-9 h-9 rounded-full bg-gradient-to-br from-accent-blue to-accent-indigo flex items-center justify-center text-white font-bold text-sm">
            {user?.name?.charAt(0)?.toUpperCase() || 'U'}
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-sm font-medium text-white truncate">{user?.name}</p>
            <p className="text-xs text-slate-500 truncate">{user?.email}</p>
          </div>
          <button onClick={handleLogout} className="p-1.5 text-slate-400 hover:text-red-400 transition-colors" title="Logout">
            <LogOut size={16} />
          </button>
        </div>
      </div>
    </aside>
  );
}
