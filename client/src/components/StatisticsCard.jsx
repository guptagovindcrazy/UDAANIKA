export default function StatisticsCard({ label, value, icon, loading = false, tone = 'green' }) {
  return (
    <div className={`stat stat--${tone}`}>
      <span className="stat__icon" aria-hidden="true">{icon}</span>
      <div>
        {loading ? <div className="skeleton skeleton--text" /> : <strong className="stat__value">{value ?? 0}</strong>}
        <span className="stat__label">{label}</span>
      </div>
    </div>
  );
}
