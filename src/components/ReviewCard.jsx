export default function ReviewCard({ review }) {
  const stars = Array.from({ length: 5 }, (_, i) => i < review.rating);

  return (
    <div className="review-card fade-in" id={`review-${review.id}`}>
      <div className="review-card-header">
        <div className="review-avatar">{review.avatar}</div>
        <div className="review-meta">
          <span className="review-username">{review.username}</span>
          <span className="review-date">{review.date}</span>
        </div>
        <div className="review-stars">
          {stars.map((filled, i) => (
            <span key={i} className={`review-star ${filled ? 'filled' : ''}`}>★</span>
          ))}
        </div>
      </div>
      <p className="review-comment">{review.comment}</p>
    </div>
  );
}
