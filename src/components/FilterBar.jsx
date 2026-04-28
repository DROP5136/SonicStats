export default function FilterBar({ timeRange, onTimeRangeChange, children }) {
  return (
    <div className="filter-bar fade-in" id="filter-bar">
      <div className="filter-group">
        {children}
      </div>
      {onTimeRangeChange && (
        <div className="time-range-toggle" id="time-range-toggle">
          {['weekly', 'monthly', 'yearly'].map((range) => (
            <button
              key={range}
              type="button"
              className={`range-btn ${timeRange === range ? 'active' : ''}`}
              onClick={() => onTimeRangeChange(range)}
              id={`range-${range}`}
            >
              {range.charAt(0).toUpperCase() + range.slice(1)}
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
