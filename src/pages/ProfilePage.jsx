import { useState, useEffect } from 'react';
import { IconMusic, IconStar, IconHeadphones } from '../components/Icons';
import { fetchUserProfile, fetchUserActivity } from '../services/api';

export default function ProfilePage({ refreshKey }) {
  const [user, setUser] = useState(null);
  const [history, setHistory] = useState([]);
  const [error, setError] = useState(null);

  useEffect(() => {
    fetchUserProfile()
      .then(setUser)
      .catch((err) => setError(err.message));
    fetchUserActivity()
      .then(setHistory)
      .catch(console.error);
  }, [refreshKey]);

  if (error) {
    return (
      <div className="page-header fade-in">
        <h1>Error</h1>
        <p style={{ color: '#ef4444' }}>{error}</p>
      </div>
    );
  }

  if (!user) {
    return (
      <div className="page-header fade-in"><h1>Loading…</h1></div>
    );
  }

  const statCards = [
    { label: 'Albums Reviewed', value: user.stats.totalAlbums, icon: IconMusic },
    { label: 'Avg Rating Given', value: user.stats.avgRating, icon: IconStar },
    { label: 'Reviews Written', value: user.stats.reviewsWritten, icon: IconHeadphones },
  ];

  return (
    <>
      <div className="page-header fade-in">
        <h1>Profile</h1>
        <p>Your listening profile and preferences.</p>
      </div>

      {/* Profile Header */}
      <div className="profile-header-card card fade-in" id="profile-header">
        <div className="profile-avatar-lg">{user.avatar}</div>
        <div className="profile-header-info">
          <h2 className="profile-name">{user.name}</h2>
          <p className="profile-details">{user.email}</p>
          <p className="profile-details">
            {user.plan} member since {user.memberSince} · {user.location}
          </p>
        </div>
      </div>

      {/* Stats */}
      <div className="stats-row" style={{ gridTemplateColumns: 'repeat(3, 1fr)' }}>
        {statCards.map((s, i) => {
          const Icon = s.icon;
          return (
            <div key={s.label} className={`stat-card fade-in fade-in-delay-${i + 1}`}>
              <div className="stat-card-icon"><Icon /></div>
              <div className="stat-card-label">{s.label}</div>
              <div className="stat-card-value">{s.value}</div>
            </div>
          );
        })}
      </div>

      <div className="content-grid">
        {/* User Reviews from DB */}
        <div className="card fade-in" id="user-reviews-card">
          <div className="card-header">
            <h2 className="card-title">Your Reviews</h2>
            <span className="card-action">{user.reviews.length} reviews</span>
          </div>
          <div className="user-review-list">
            {user.reviews.length === 0 && (
              <p style={{ color: '#6a6a6a', padding: '12px' }}>No reviews yet.</p>
            )}
            {user.reviews.map((r, i) => (
              <div key={i} className="user-review-row">
                <div className="user-review-dot" style={{ background: r.color }} />
                <div className="user-review-info">
                  <span className="user-review-album">{r.albumTitle}</span>
                  <span className="user-review-artist">{r.artist} · {r.date}</span>
                </div>
                <div className="user-review-right">
                  <span className="user-review-rating">★ {r.rating}</span>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Review Activity from DB */}
        <div className="card fade-in" id="user-history-card">
          <div className="card-header">
            <h2 className="card-title">Review Activity</h2>
            <span className="card-action">{history.length} entries</span>
          </div>
          <div className="user-history-list">
            {history.length === 0 && (
              <p style={{ color: '#6a6a6a', padding: '12px' }}>No activity yet.</p>
            )}
            {history.slice(0, 10).map((h) => (
              <div key={h.id} className="user-history-row">
                <div className="user-history-dot" style={{ background: h.color }} />
                <div className="user-review-info">
                  <span className="user-review-album">{h.album}</span>
                  <span className="user-review-artist">{h.artist} · {h.action}</span>
                </div>
                <div className="user-review-right">
                  <span className="user-history-time">{h.date}</span>
                  {h.rating && <span className="user-history-dur">★ {h.rating}</span>}
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </>
  );
}
