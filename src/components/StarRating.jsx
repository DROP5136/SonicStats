import { useState } from 'react';

export default function StarRating({ value = 0, onChange, max = 5 }) {
  const [hover, setHover] = useState(0);

  return (
    <div className="star-rating-input" id="star-rating-input">
      {Array.from({ length: max }, (_, i) => {
        const starVal = i + 1;
        return (
          <button
            key={starVal}
            type="button"
            className={`star-btn ${starVal <= (hover || value) ? 'active' : ''}`}
            onClick={() => onChange(starVal)}
            onMouseEnter={() => setHover(starVal)}
            onMouseLeave={() => setHover(0)}
            aria-label={`Rate ${starVal} out of ${max}`}
          >
            ★
          </button>
        );
      })}
      <span className="star-rating-label">
        {hover || value ? `${hover || value}/${max}` : 'Select rating'}
      </span>
    </div>
  );
}
