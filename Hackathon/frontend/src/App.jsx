import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { Toaster } from 'react-hot-toast';
import { AuthProvider, useAuth } from './context/AuthContext';
import DashboardLayout from './layouts/DashboardLayout';

// Public Pages
import LandingPage from './pages/LandingPage';
import LoginPage from './pages/LoginPage';
import RegisterPage from './pages/RegisterPage';

// User Pages
import UserDashboard from './pages/UserDashboard';
import FindParking from './pages/FindParking';
import ParkingDetails from './pages/ParkingDetails';
import VehicleManagement from './pages/VehicleManagement';
import ReservationHistory from './pages/ReservationHistory';
import ReservationDetails from './pages/ReservationDetails';
import UserProfile from './pages/UserProfile';

// Admin Pages
import AdminDashboard from './pages/admin/AdminDashboard';
import ManageLocations from './pages/admin/ManageLocations';
import ManageSlots from './pages/admin/ManageSlots';
import ManageReservations from './pages/admin/ManageReservations';
import EntryExitManagement from './pages/admin/EntryExitManagement';
import ManageUsers from './pages/admin/ManageUsers';
import PredictionDashboard from './pages/admin/PredictionDashboard';

function AdminRoute({ children }) {
  const { user, loading } = useAuth();
  if (loading) return null;
  if (!user || user.role !== 'admin') {
    return <Navigate to="/dashboard" replace />;
  }
  return children;
}

function UserRoute({ children }) {
  const { user, loading } = useAuth();
  if (loading) return null;
  if (user && user.role === 'admin') {
    return <Navigate to="/admin/dashboard" replace />;
  }
  return children;
}

export default function App() {
  return (
    <AuthProvider>
      <Router>
        <Toaster
          position="top-right"
          toastOptions={{
            duration: 4000,
            style: {
              background: '#1a2332',
              color: '#e2e8f0',
              border: '1px solid rgba(59, 130, 246, 0.2)',
              borderRadius: '12px',
              fontSize: '14px',
            },
            success: {
              iconTheme: {
                primary: '#10b981',
                secondary: '#ffffff',
              },
            },
            error: {
              iconTheme: {
                primary: '#f43f5e',
                secondary: '#ffffff',
              },
            },
          }}
        />
        <Routes>
          {/* Public Routes */}
          <Route path="/" element={<LandingPage />} />
          <Route path="/login" element={<LoginPage />} />
          <Route path="/register" element={<RegisterPage />} />

          {/* User Protected Routes */}
          <Route element={<DashboardLayout />}>
            <Route path="/dashboard" element={<UserRoute><UserDashboard /></UserRoute>} />
            <Route path="/find-parking" element={<UserRoute><FindParking /></UserRoute>} />
            <Route path="/parking/:id" element={<UserRoute><ParkingDetails /></UserRoute>} />
            <Route path="/vehicles" element={<UserRoute><VehicleManagement /></UserRoute>} />
            <Route path="/reservations" element={<UserRoute><ReservationHistory /></UserRoute>} />
            <Route path="/reservations/:id" element={<UserRoute><ReservationDetails /></UserRoute>} />
            <Route path="/profile" element={<UserProfile />} />

            {/* Admin Protected Routes */}
            <Route path="/admin/dashboard" element={<AdminRoute><AdminDashboard /></AdminRoute>} />
            <Route path="/admin/locations" element={<AdminRoute><ManageLocations /></AdminRoute>} />
            <Route path="/admin/slots" element={<AdminRoute><ManageSlots /></AdminRoute>} />
            <Route path="/admin/reservations" element={<AdminRoute><ManageReservations /></AdminRoute>} />
            <Route path="/admin/entry-exit" element={<AdminRoute><EntryExitManagement /></AdminRoute>} />
            <Route path="/admin/users" element={<AdminRoute><ManageUsers /></AdminRoute>} />
            <Route path="/admin/predictions" element={<AdminRoute><PredictionDashboard /></AdminRoute>} />
          </Route>

          {/* Catch-all */}
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </Router>
    </AuthProvider>
  );
}
