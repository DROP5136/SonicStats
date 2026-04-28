import { useState, useEffect, useMemo } from 'react';
import { Line, Doughnut } from 'react-chartjs-2';
import {
  Chart as ChartJS,
  CategoryScale, LinearScale, PointElement, LineElement,
  ArcElement, Tooltip, Legend, Filler,
} from 'chart.js';
import { IconMusic, IconStar, IconHeadphones, IconBarChart, IconTrendUp } from '../components/Icons';
import AlbumCard from '../components/AlbumCard';
import ChartCard from '../components/ChartCard';
import FilterBar from '../components/FilterBar';
import { fetchTopRated, fetchTopArtists, fetchGenreChartData, fetchDashboardStats } from '../services/api';

ChartJS.register(CategoryScale, LinearScale, PointElement, LineElement, ArcElement, Tooltip, Legend, Filler);

// Static listening activity data (time-series data requires a dedicated
// listening_history collection — kept as illustrative placeholder)
const LISTENING_DATA = {
  weekly: {
    labels: ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'],
    values: [3.2, 2.8, 4.1, 3.5, 5.2, 6.8, 5.5],
  },
  monthly: {
    labels: ['Wk 1', 'Wk 2', 'Wk 3', 'Wk 4'],
    values: [22, 28, 31, 25],
  },
  yearly: {
    labels: ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'],
    values: [85, 92, 78, 110, 95, 120, 135, 142, 118, 105, 130, 148],
  },
};

const STAT_META = [
  { id: 'albums',  label: 'Total Albums',   key: 'totalAlbums',  icon: IconMusic,      change: '+12%', positive: true },
  { id: 'reviews', label: 'Total Reviews',  key: 'totalReviews', icon: IconStar,       change: '+8%',  positive: true },
  { id: 'artists', label: 'Artists',        key: 'totalArtists', icon: IconBarChart,   change: '+5%',  positive: true },
  { id: 'users',   label: 'Total Users',    key: 'totalUsers',   icon: IconHeadphones, change: '+23%', positive: true },
];

export default function DashboardPage({ onNavigateAlbum }) {
  const [timeRange, setTimeRange] = useState('weekly');
  const [topAlbums, setTopAlbums] = useState([]);
  const [artists, setArtists] = useState([]);
  const [genreChart, setGenreChart] = useState(null);
  const [dashStats, setDashStats] = useState(null);

  useEffect(() => {
    fetchTopRated().then(setTopAlbums).catch(console.error);
    fetchTopArtists().then(setArtists).catch(console.error);
    fetchGenreChartData().then(setGenreChart).catch(console.error);
    fetchDashboardStats().then(setDashStats).catch(console.error);
  }, []);

  // Line chart — Listening Activity (illustrative; no time-series backend yet)
  const lineData = useMemo(() => {
    const d = LISTENING_DATA[timeRange];
    return {
      labels: d.labels,
      datasets: [{
        label: 'Hours',
        data: d.values,
        borderColor: '#1db954',
        backgroundColor: 'rgba(29, 185, 84, 0.08)',
        borderWidth: 2,
        pointBackgroundColor: '#1db954',
        pointBorderColor: '#121212',
        pointBorderWidth: 2,
        pointRadius: 4,
        pointHoverRadius: 6,
        tension: 0.4,
        fill: true,
      }],
    };
  }, [timeRange]);

  const lineOpts = useMemo(() => ({
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: { display: false },
      tooltip: {
        backgroundColor: '#1e1e1e',
        titleColor: '#fff',
        bodyColor: '#b3b3b3',
        borderColor: '#333',
        borderWidth: 1,
        padding: 12,
        cornerRadius: 8,
      },
    },
    scales: {
      x: { grid: { color: 'rgba(255,255,255,0.04)' }, ticks: { color: '#6a6a6a', font: { size: 11 } } },
      y: { grid: { color: 'rgba(255,255,255,0.04)' }, ticks: { color: '#6a6a6a', font: { size: 11 } }, beginAtZero: true },
    },
  }), []);

  // Doughnut chart — Trending Genres from real backend data
  const doughnutData = useMemo(() => {
    if (!genreChart) {
      return { labels: [], datasets: [{ data: [], backgroundColor: [], borderColor: '#181818', borderWidth: 3 }] };
    }
    return {
      labels: genreChart.genres,
      datasets: [{
        data: genreChart.values,
        backgroundColor: genreChart.colors.map(c => c + 'cc'),
        borderColor: '#181818',
        borderWidth: 3,
        hoverBorderColor: '#252525',
        hoverOffset: 8,
      }],
    };
  }, [genreChart]);

  const doughnutOpts = useMemo(() => ({
    responsive: true,
    maintainAspectRatio: false,
    cutout: '62%',
    plugins: {
      legend: {
        position: 'right',
        labels: { color: '#b3b3b3', font: { size: 12, family: 'Inter' }, padding: 14, usePointStyle: true, pointStyleWidth: 10 },
      },
      tooltip: {
        backgroundColor: '#1e1e1e',
        titleColor: '#fff',
        bodyColor: '#b3b3b3',
        borderColor: '#333',
        borderWidth: 1,
        padding: 12,
        cornerRadius: 8,
      },
    },
  }), []);

  const formatStatValue = (key, raw) => {
    if (raw == null) return '—';
    if (key === 'totalReviews' && raw >= 1000) return `${(raw / 1000).toFixed(1)}K`;
    if (key === 'totalAlbums' && raw >= 1000) return raw.toLocaleString();
    return raw.toString();
  };

  return (
    <>
      <div className="page-header fade-in">
        <h1>Dashboard</h1>
        <p>Welcome back, Lakshay. Here's your music overview.</p>
      </div>

      {/* Time Range Filter */}
      <FilterBar timeRange={timeRange} onTimeRangeChange={setTimeRange} />

      {/* Stat Cards — real data from backend */}
      <div className="stats-row">
        {STAT_META.map((stat, i) => {
          const Icon = stat.icon;
          const rawVal = dashStats ? dashStats[stat.key] : null;
          return (
            <div key={stat.id} className={`stat-card fade-in fade-in-delay-${i + 1}`} id={`stat-${stat.id}`}>
              <div className="stat-card-icon"><Icon /></div>
              <div className="stat-card-label">{stat.label}</div>
              <div className="stat-card-value">{formatStatValue(stat.key, rawVal)}</div>
              <div className={`stat-card-change ${stat.positive ? 'positive' : 'negative'}`}>
                <IconTrendUp style={{ width: 12, height: 12 }} />
                {stat.change}
              </div>
            </div>
          );
        })}
      </div>

      {/* Charts Row — Listening Activity + Trending Genres */}
      <div className="content-grid">
        <ChartCard title="Listening Activity" action={`${timeRange} view`} id="listening-line-chart">
          <div className="chart-container">
            <Line data={lineData} options={lineOpts} />
          </div>
        </ChartCard>
        <ChartCard title="Trending Genres" action={genreChart ? `${genreChart.genres.length} genres` : 'loading…'} id="genre-doughnut-chart">
          <div className="chart-container">
            {genreChart && <Doughnut data={doughnutData} options={doughnutOpts} />}
          </div>
        </ChartCard>
      </div>

      {/* Top Rated Albums — from real backend aggregation */}
      <div className="section-block fade-in">
        <div className="card-header" style={{ marginBottom: 16 }}>
          <h2 className="card-title">Top Rated Albums</h2>
          <span className="card-action">See all</span>
        </div>
        <div className="album-card-grid">
          {topAlbums.slice(0, 8).map((album) => (
            <AlbumCard key={album.id} album={album} onClick={() => onNavigateAlbum?.(album.id)} />
          ))}
        </div>
      </div>

      {/* Most Popular Artists — real data from backend */}
      <div className="content-grid full">
        <div className="card fade-in" id="popular-artists-card">
          <div className="card-header">
            <h2 className="card-title">Most Popular Artists</h2>
            <span className="card-action">View all</span>
          </div>
          <div className="artist-grid">
            {artists.slice(0, 8).map((artist) => (
              <div key={artist.id} className="artist-card" id={`artist-card-${artist.id}`}>
                <div className="artist-avatar" style={{ background: artist.color }}>
                  {artist.name.charAt(0)}
                </div>
                <div className="artist-info">
                  <span className="artist-name">{artist.name}</span>
                  <span className="artist-genre">{artist.genre}</span>
                </div>
                <div className="artist-stats">
                  <span className="artist-followers">{artist.monthlyPlays}</span>
                  <span className="artist-plays-label">plays</span>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </>
  );
}
