import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { ParkingCircle, MapPin, Shield, Zap, ChevronRight } from 'lucide-react';

export default function LandingPage() {
  const { user } = useAuth();
  const navigate = useNavigate();

  if (user) {
    navigate(user.role === 'admin' ? '/admin/dashboard' : '/dashboard');
    return null;
  }

  return (
    <div className="min-h-screen bg-navy-900">
      {/* Header */}
      <header className="border-b border-navy-600/30">
        <div className="max-w-7xl mx-auto px-6 py-4 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-accent-blue to-accent-cyan flex items-center justify-center">
              <ParkingCircle className="w-6 h-6 text-white" />
            </div>
            <span className="text-xl font-bold text-white">SmartPark</span>
          </div>
          <div className="flex items-center gap-3">
            <Link to="/login" className="btn-secondary text-sm">Sign In</Link>
            <Link to="/register" className="btn-primary text-sm">Get Started</Link>
          </div>
        </div>
      </header>

      {/* Hero */}
      <section className="max-w-7xl mx-auto px-6 py-24 text-center">
        <div className="animate-slide-up">
          <div className="inline-flex items-center gap-2 px-4 py-1.5 bg-accent-blue/10 border border-accent-blue/20 rounded-full text-accent-blue text-sm mb-6">
            <Zap size={14} /> Powered by AI & Machine Learning
          </div>
          <h1 className="text-5xl md:text-6xl font-bold text-white leading-tight">
            Smart Parking <br />
            <span className="gradient-text">Management System</span>
          </h1>
          <p className="text-lg text-slate-400 mt-6 max-w-2xl mx-auto">
            Find, reserve, and manage parking spaces effortlessly. Real-time availability,
            ML-powered occupancy predictions, and comprehensive analytics — all in one platform.
          </p>
          <div className="flex items-center justify-center gap-4 mt-10">
            <Link to="/register" className="btn-primary text-base px-8 py-3 flex items-center gap-2">
              Start Free <ChevronRight size={18} />
            </Link>
            <Link to="/login" className="btn-secondary text-base px-8 py-3">
              Sign In
            </Link>
          </div>
        </div>
      </section>

      {/* Features */}
      <section className="max-w-7xl mx-auto px-6 py-16">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {[
            {
              icon: MapPin,
              title: 'Find Parking Instantly',
              description: 'Browse parking locations, filter by price and availability, and find the perfect spot in seconds.',
              color: 'from-accent-blue to-accent-cyan'
            },
            {
              icon: Shield,
              title: 'Secure Reservations',
              description: 'Reserve your spot with confidence. Double-booking protection and real-time slot management.',
              color: 'from-accent-indigo to-accent-blue'
            },
            {
              icon: Zap,
              title: 'AI Predictions',
              description: 'ML-powered occupancy forecasting helps you plan ahead and avoid peak hour congestion.',
              color: 'from-accent-cyan to-accent-emerald'
            }
          ].map((feature, idx) => (
            <div key={idx} className="glass-card p-8 animate-fade-in" style={{ animationDelay: `${idx * 0.15}s` }}>
              <div className={`w-12 h-12 rounded-xl bg-gradient-to-br ${feature.color} flex items-center justify-center mb-5`}>
                <feature.icon className="w-6 h-6 text-white" />
              </div>
              <h3 className="text-lg font-bold text-white mb-2">{feature.title}</h3>
              <p className="text-sm text-slate-400 leading-relaxed">{feature.description}</p>
            </div>
          ))}
        </div>
      </section>

      {/* Footer */}
      <footer className="border-t border-navy-600/30 py-8">
        <div className="max-w-7xl mx-auto px-6 text-center text-slate-500 text-sm">
          © 2024 SmartPark. Built for DBMS Hackathon.
        </div>
      </footer>
    </div>
  );
}
