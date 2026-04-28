export default function ChartCard({ title, action, children, id }) {
  return (
    <div className="card fade-in" id={id}>
      <div className="card-header">
        <h2 className="card-title">{title}</h2>
        {action && <span className="card-action">{action}</span>}
      </div>
      <div className="chart-card-content">
        {children}
      </div>
    </div>
  );
}
