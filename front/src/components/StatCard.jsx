import './StatCard.css';

export default function StatCard({ icon, label, value, sub, subIcon, color, badge }) {
  return (
    <div className="stat-card">
      {badge && <span className="stat-badge">{badge}</span>}
      <div className="stat-icon">{icon}</div>
      <p className="stat-label">{label}</p>
      <h2 className="stat-value" style={{ color: color || '#1a2340' }}>{value}</h2>
      <p className="stat-sub">
        {subIcon && <span className="sub-icon">{subIcon}</span>}
        {sub}
      </p>
    </div>
  );
}
