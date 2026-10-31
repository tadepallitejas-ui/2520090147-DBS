export function StatCard({ title, value, icon: Icon, color = 'blue', subtitle }) {
  const colors = {
    blue: 'from-accent-blue/20 to-accent-blue/5 border-accent-blue/20 text-accent-blue',
    cyan: 'from-accent-cyan/20 to-accent-cyan/5 border-accent-cyan/20 text-accent-cyan',
    emerald: 'from-accent-emerald/20 to-accent-emerald/5 border-accent-emerald/20 text-accent-emerald',
    amber: 'from-accent-amber/20 to-accent-amber/5 border-accent-amber/20 text-accent-amber',
    rose: 'from-accent-rose/20 to-accent-rose/5 border-accent-rose/20 text-accent-rose',
    indigo: 'from-accent-indigo/20 to-accent-indigo/5 border-accent-indigo/20 text-accent-indigo',
  };

  return (
    <div className={`glass-card p-5 bg-gradient-to-br ${colors[color]}`}>
      <div className="flex items-start justify-between">
        <div>
          <p className="text-xs font-medium text-slate-400 uppercase tracking-wider">{title}</p>
          <p className="text-2xl font-bold text-white mt-1">{value}</p>
          {subtitle && <p className="text-xs text-slate-500 mt-1">{subtitle}</p>}
        </div>
        {Icon && (
          <div className={`p-2.5 rounded-xl bg-gradient-to-br ${colors[color]}`}>
            <Icon size={20} />
          </div>
        )}
      </div>
    </div>
  );
}

export function LoadingSpinner() {
  return (
    <div className="flex items-center justify-center py-20">
      <div className="w-10 h-10 border-4 border-accent-blue border-t-transparent rounded-full animate-spin" />
    </div>
  );
}

export function EmptyState({ icon: Icon, title, description }) {
  return (
    <div className="flex flex-col items-center justify-center py-16 text-center">
      {Icon && <Icon size={48} className="text-slate-600 mb-4" />}
      <h3 className="text-lg font-semibold text-slate-400">{title}</h3>
      <p className="text-sm text-slate-500 mt-1 max-w-sm">{description}</p>
    </div>
  );
}

export function Badge({ status }) {
  const styles = {
    available: 'status-available',
    Available: 'status-available',
    confirmed: 'bg-accent-blue/15 text-accent-blue border border-accent-blue/30',
    reserved: 'status-reserved',
    Reserved: 'status-reserved',
    occupied: 'status-occupied',
    Occupied: 'status-occupied',
    completed: 'bg-accent-emerald/15 text-accent-emerald border border-accent-emerald/30',
    cancelled: 'bg-slate-500/15 text-slate-400 border border-slate-500/30',
    checked_in: 'bg-accent-indigo/15 text-accent-indigo border border-accent-indigo/30',
    maintenance: 'status-maintenance',
    Maintenance: 'status-maintenance',
  };

  return (
    <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-semibold ${styles[status] || 'bg-slate-700 text-slate-300'}`}>
      {status?.replace('_', ' ').replace(/^\w/, c => c.toUpperCase())}
    </span>
  );
}
