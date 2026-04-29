import { useState, useEffect, useMemo } from 'react';
import AlbumCard from '../components/AlbumCard';
import { fetchAlbums, fetchGenres, fetchSearchAlbums } from '../services/api';

const RATING_FILTERS = [
  { label: 'All Ratings', value: 0 },
  { label: '4+ ★', value: 4 },
  { label: '3+ ★', value: 3 },
  { label: '2+ ★', value: 2 },
];

export default function AlbumsPage({ onNavigateAlbum, initialSearchTerm = '' }) {
  const [albums, setAlbums] = useState([]);
  const [genres, setGenres] = useState([]);
  const [search, setSearch] = useState(initialSearchTerm);
  const [genre, setGenre] = useState('All');
  const [minRating, setMinRating] = useState(0);

  useEffect(() => {
    fetchGenres().then(setGenres).catch(console.error);
  }, []);

  useEffect(() => {
    setSearch(initialSearchTerm || '');
  }, [initialSearchTerm]);

  useEffect(() => {
    let isActive = true;

    const loadAlbums = async () => {
      try {
        const query = search.trim();
        const data = query ? await fetchSearchAlbums(query) : await fetchAlbums();
        if (isActive) {
          setAlbums(data);
        }
      } catch (error) {
        console.error(error);
      }
    };

    loadAlbums();

    return () => {
      isActive = false;
    };
  }, [search]);

  const filtered = useMemo(() => {
    return albums.filter((a) => {
      const matchGenre = genre === 'All' || a.genre === genre;
      const matchRating = a.rating >= minRating;
      return matchGenre && matchRating;
    });
  }, [albums, genre, minRating]);

  return (
    <>
      <div className="page-header fade-in">
        <h1>Albums</h1>
        <p>Browse and discover your album collection.</p>
      </div>

      {/* Filters */}
      <div className="albums-filter-bar fade-in" id="albums-filters">
        <div className="albums-search" id="albums-search">
          <input
            type="text"
            placeholder="Search albums or artists…"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            id="albums-search-input"
          />
        </div>

        <div className="albums-filter-group">
          <select
            className="filter-select"
            value={genre}
            onChange={(e) => setGenre(e.target.value)}
            id="genre-filter"
          >
            <option value="All">All Genres</option>
            {genres.map((g) => (
              <option key={g} value={g}>{g}</option>
            ))}
          </select>

          <select
            className="filter-select"
            value={minRating}
            onChange={(e) => setMinRating(Number(e.target.value))}
            id="rating-filter"
          >
            {RATING_FILTERS.map((r) => (
              <option key={r.value} value={r.value}>{r.label}</option>
            ))}
          </select>
        </div>
      </div>

      {/* Results count */}
      <div className="results-count fade-in">
        <span>{filtered.length} album{filtered.length !== 1 ? 's' : ''} found</span>
      </div>

      {/* Album Grid */}
      <div className="album-card-grid" id="albums-grid">
        {filtered.map((album) => (
          <AlbumCard
            key={album.id}
            album={album}
            onClick={() => onNavigateAlbum?.(album.id)}
          />
        ))}
      </div>

      {filtered.length === 0 && (
        <div className="empty-state-card fade-in">
          <p>No albums match your filters. Try adjusting your search.</p>
        </div>
      )}
    </>
  );
}
