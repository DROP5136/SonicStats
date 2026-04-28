import { useState, useEffect, useMemo } from 'react';
import ReviewCard from '../components/ReviewCard';
import StarRating from '../components/StarRating';
import { fetchAlbumById, fetchReviewsByAlbum, postReview, updateReview, deleteReview } from '../services/api';

export default function AlbumDetailPage({ albumId, onBack }) {
  const [album, setAlbum] = useState(null);
  const [reviews, setReviews] = useState([]);
  const [rating, setRating] = useState(0);
  const [comment, setComment] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const [sortBy, setSortBy] = useState('Latest');

  useEffect(() => {
    if (albumId) {
      fetchAlbumById(albumId).then(setAlbum);
      fetchReviewsByAlbum(albumId).then(setReviews);
    }
  }, [albumId]);

  const userReview = reviews.find(r => r.userId === '60d5ecb8b392d700153c3000');

  async function handleSubmit(e) {
    e.preventDefault();
    if (!rating || !comment.trim()) return;
    setSubmitting(true);

    if (isEditing && userReview) {
      const updatedReview = await updateReview(albumId, {
        rating,
        comment: comment.trim(),
      });
      setReviews(prev => prev.map(r => r.id === userReview.id ? { ...r, ...updatedReview } : r));
      setIsEditing(false);
    } else {
      const newReview = await postReview(albumId, {
        rating,
        comment: comment.trim(),
      });
      setReviews(prev => [newReview, ...prev]);
    }
    
    setRating(0);
    setComment('');
    setSubmitting(false);
  }

  async function handleDelete() {
    if (!userReview || !window.confirm('Are you sure you want to delete your review?')) return;
    await deleteReview(albumId);
    setReviews(prev => prev.filter(r => r.id !== userReview.id));
    setRating(0);
    setComment('');
    setIsEditing(false);
  }

  function handleEditClick() {
    setRating(userReview.rating);
    setComment(userReview.comment);
    setIsEditing(true);
  }

  function handleCancelEdit() {
    setIsEditing(false);
    setRating(0);
    setComment('');
  }

  const sortedReviews = useMemo(() => {
    return [...reviews].sort((a, b) => {
      if (sortBy === 'Highest Rated') return b.rating - a.rating;
      if (sortBy === 'Lowest Rated') return a.rating - b.rating;
      // Latest (fallback to id sorting if dates are equal)
      return new Date(b.date).getTime() - new Date(a.date).getTime() || b.id - a.id;
    });
  }, [reviews, sortBy]);

  if (!album) {
    return (
      <div className="page-header fade-in">
        <h1>Loading…</h1>
      </div>
    );
  }

  const avgRating = reviews.length
    ? (reviews.reduce((s, r) => s + r.rating, 0) / reviews.length).toFixed(1)
    : album.rating;
  
  const totalRatings = reviews.length > 0 ? reviews.length : (album.totalRatings || 0);

  return (
    <>
      <button type="button" className="back-btn fade-in" onClick={onBack} id="back-btn">
        ← Back to Albums
      </button>

      <div className="album-detail-header fade-in" id="album-detail-header">
        <div className="album-detail-cover" style={{ background: album.color }}>
          <span className="album-detail-note">♪</span>
        </div>
        <div className="album-detail-info">
          <span className="album-detail-type">ALBUM</span>
          <h1 className="album-detail-title">{album.title}</h1>
          <p className="album-detail-artist">{album.artist}</p>
          <div className="album-detail-meta">
            <span className="album-detail-genre">{album.genre}</span>
            <span className="album-detail-year">{album.year}</span>
            <span className="album-detail-tracks">{album.tracks} tracks</span>
          </div>
          <div className="album-detail-rating-block">
            <span className="album-detail-big-rating">★ {avgRating}/5</span>
            <span className="album-detail-review-count">{totalRatings} rating{totalRatings !== 1 ? 's' : ''}</span>
          </div>
        </div>
      </div>

      <div className="card fade-in" id="write-review-card" style={{ marginBottom: 20 }}>
        <div className="card-header">
          <h2 className="card-title">
            {isEditing ? 'Edit Your Review' : (userReview ? 'Your Review' : 'Write a Review')}
          </h2>
        </div>
        
        {!isEditing && userReview ? (
          <div className="user-review-display">
            <ReviewCard review={userReview} />
            <div className="review-actions" style={{ display: 'flex', gap: '10px', marginTop: '15px', paddingLeft: '15px' }}>
              <button type="button" className="btn btn-secondary" onClick={handleEditClick}>Edit Review</button>
              <button type="button" className="btn btn-danger" onClick={handleDelete} style={{ background: 'var(--danger-color)', color: 'white', border: 'none', padding: '8px 16px', borderRadius: '4px', cursor: 'pointer' }}>Delete Review</button>
            </div>
          </div>
        ) : (
          <form className="review-form" onSubmit={handleSubmit} id="review-form">
            <StarRating value={rating} onChange={setRating} max={5} />
            <textarea
              className="review-textarea"
              placeholder="Share your thoughts about this album…"
              value={comment}
              onChange={(e) => setComment(e.target.value)}
              rows={3}
              id="review-textarea"
            />
            <div style={{ display: 'flex', gap: '10px' }}>
              <button
                type="submit"
                className="submit-btn"
                disabled={!rating || !comment.trim() || submitting}
                id="submit-review-btn"
              >
                {submitting ? 'Submitting…' : (isEditing ? 'Save Changes' : 'Submit Review')}
              </button>
              {isEditing && (
                <button
                  type="button"
                  className="btn btn-secondary"
                  onClick={handleCancelEdit}
                  disabled={submitting}
                >
                  Cancel
                </button>
              )}
            </div>
          </form>
        )}
      </div>

      <div className="card fade-in" id="reviews-list-card">
        <div className="card-header" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <div style={{ display: 'flex', alignItems: 'baseline', gap: '10px' }}>
            <h2 className="card-title">User Reviews</h2>
            <span className="card-action" style={{ cursor: 'default' }}>{reviews.length} reviews</span>
          </div>
          <select 
            className="filter-select" 
            value={sortBy} 
            onChange={(e) => setSortBy(e.target.value)}
            style={{ width: 'auto', marginBottom: 0 }}
          >
            <option value="Latest">Latest</option>
            <option value="Highest Rated">Highest Rated</option>
            <option value="Lowest Rated">Lowest Rated</option>
          </select>
        </div>
        <div className="reviews-scroll" id="reviews-scroll">
          {sortedReviews.length > 0 ? (
            sortedReviews.map((r) => <ReviewCard key={r.id} review={r} />)
          ) : (
            <p className="empty-text">No reviews yet. Be the first to share your thoughts!</p>
          )}
        </div>
      </div>
    </>
  );
}
