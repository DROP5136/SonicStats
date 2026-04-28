import { useState, useEffect, useMemo } from 'react';
import { fetchUserActivity } from '../services/api';

const SORT_OPTIONS = [
  { label: 'Newest First', key: 'date', dir: 'desc' },
  { label: 'Oldest First', key: 'date', dir: 'asc' },
  { label: 'Highest Rated', key: 'rating', dir: 'desc' },
  { label: 'Lowest Rated', key: 'rating', dir: 'asc' },
];

const ACTION_COLORS = {
  created: '#10b981',
  edited: '#f59e0b',
  deleted: '#ef4444'
};

const ACTION_LABELS = {
  created: 'Created',
  edited: 'Edited',
  deleted: 'Deleted'
};

export default function ActivityPage() {
  const [history, setHistory] = useState([]);
  const [sortIdx, setSortIdx] = useState(0);
  const [search, setSearch] = useState('');

  useEffect(() => {
    fetchUserActivity().then(setHistory);
  }, []);

  const sorted = useMemo(() => {
    const s = SORT_OPTIONS[sortIdx];
    let items = [...history];

    // search filter
    if (search) {
      const q = search.toLowerCase();
      items = items.filter((h) =>
        h.album.toLowerCase().includes(q) || 
        h.artist.toLowerCase().includes(q) ||
        h.action.toLowerCase().includes(q) ||
        (h.reviewText && h.reviewText.toLowerCase().includes(q))
      );
    }

    items.sort((a, b) => {
      if (s.key === 'date') {
        return s.dir === 'desc'
          ? new Date(b.date) - new Date(a.date)
          : new Date(a.date) - new Date(b.date);
      }
      if (s.key === 'rating') {
        const aRating = a.rating || 0;
        const bRating = b.rating || 0;
        return s.dir === 'desc'
          ? bRating - aRating
          : aRating - bRating;
      }
      return 0;
    });
    return items;
  }, [history, sortIdx, search]);

  return (
    <>
      <div className="page-header fade-in">
        <h1>Review Activity</h1>
        <p>Your review history - create, edit, and delete activities.</p>
      </div>

      {/* Filters */}
      <div className="activity-filter-bar fade-in" id="activity-filters">
        <div className="albums-search">
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" style={{ width: 18, height: 18 }}>
            <circle cx="11" cy="11" r="8" /><line x1="21" y1="21" x2="16.65" y2="16.65" />
          </svg>
          <input
            type="text"
            placeholder="Search by album, artist, or action…"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            id="activity-search"
          />
        </div>
        <select
          className="filter-select"
          value={sortIdx}
          onChange={(e) => setSortIdx(Number(e.target.value))}
          id="activity-sort"
        >
          {SORT_OPTIONS.map((opt, i) => (
            <option key={i} value={i}>{opt.label}</option>
          ))}
        </select>
      </div>

      {/* Review Activity Table */}
      <div className="card fade-in" id="history-table-card">
        <div className="card-header">
          <h2 className="card-title">Review Activity</h2>
          <span className="card-action">{sorted.length} entries</span>
        </div>

        <div className="history-table-wrap">
          <table className="history-table" id="history-table">
            <thead>
              <tr>
                <th>#</th>
                <th>Album</th>
                <th>Artist</th>
                <th>Action</th>
                <th>Rating</th>
                <th>Date & Time</th>
              </tr>
            </thead>
            <tbody>
              {sorted.map((entry, i) => (
                <tr key={entry.id + '-' + i} className="history-row">
                  <td className="history-idx">{i + 1}</td>
                  <td>
                    <div className="history-album-cell">
                      <div className="history-album-dot" style={{ background: entry.color }} />
                      <span>{entry.album}</span>
                    </div>
                  </td>
                  <td className="history-artist">{entry.artist}</td>
                  <td>
                    <span 
                      style={{
                        padding: '4px 8px',
                        borderRadius: '4px',
                        backgroundColor: ACTION_COLORS[entry.action] + '20',
                        color: ACTION_COLORS[entry.action],
                        fontWeight: '500',
                        fontSize: '0.9em'
                      }}
                    >
                      {ACTION_LABELS[entry.action]}
                    </span>
                  </td>
                  <td>{entry.action === 'deleted' ? '—' : `★ ${entry.rating}`}</td>
                  <td className="history-date">{entry.date}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {sorted.length === 0 && (
          <div className="empty-state-card">
            <p>No review activity matches your search.</p>
          </div>
        )}
      </div>
    </>
  );
}
