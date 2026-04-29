export default function AlbumCard({ album, onClick, showUserRating = false }) {
  const formatPlays = (plays) => {
    if (!plays && plays !== 0) return 'No plays';
    return plays >= 1000 ? `${(plays / 1000).toFixed(1)}K` : plays;
  };

  return (
    <div className="album-card-v2 fade-in" onClick={onClick} id={`album-card-${album.id}`}>
      <div className="album-card-cover" style={{ background: album.color }}>
        <span className="album-card-note">♪</span>
        <div className="album-card-overlay">
          <span className="album-card-play">▶</span>
        </div>
      </div>
      <div className="album-card-body">
        <h3 className="album-card-title">{album.title}</h3>
        <p className="album-card-artist">{album.artist}</p>
        <div className="album-card-footer">
          <span className="album-card-rating">
            ★ {album.rating?.toFixed(1) || album.rating}
            {showUserRating && <span style={{ fontSize: '0.8em', marginLeft: '4px', opacity: 0.7 }}>(Your rating)</span>}
          </span>
          <span className="album-card-plays">
            {formatPlays(album.plays)} plays
          </span>
        </div>
      </div>
    </div>
  );
}
