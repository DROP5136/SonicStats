const API_URL = '/api';

// ─── Current logged-in user ID (seeded in DB) ───
const CURRENT_USER_ID = '60d5ecb8b392d700153c3000';

// ─── Albums ───

export const fetchAlbums = async () => {
  const response = await fetch(`${API_URL}/albums`);
  if (!response.ok) throw new Error('Failed to fetch albums');
  const data = await response.json();
  return data.map(album => ({
    ...album,
    id: album._id,
    rating: album.average_rating,
    totalRatings: album.total_ratings,
    year: album.release_year,
    genre: album.genres && album.genres.length > 0 ? album.genres[0] : 'Unknown'
  }));
};

export const fetchAlbumById = async (id) => {
  const response = await fetch(`${API_URL}/albums/${id}`);
  if (!response.ok) throw new Error('Failed to fetch album');
  const album = await response.json();
  return {
    ...album,
    id: album._id,
    rating: album.average_rating,
    totalRatings: album.total_ratings,
    year: album.release_year,
    genre: album.genres && album.genres.length > 0 ? album.genres[0] : 'Unknown'
  };
};

export const fetchReviewsByAlbum = async (albumId) => {
  const response = await fetch(`${API_URL}/albums/${albumId}`);
  if (!response.ok) throw new Error('Failed to fetch album reviews');
  const album = await response.json();

  return album.reviews.map(r => ({
    id: r._id,
    userId: r.user_id,
    username: r.username,
    rating: r.rating,
    comment: r.review_text,
    date: r.created_at
  })).sort((a, b) => new Date(b.date) - new Date(a.date));
};

export const postReview = async (albumId, reviewData) => {
  const payload = {
    user_id: CURRENT_USER_ID,
    rating: reviewData.rating,
    review_text: reviewData.comment
  };

  const response = await fetch(`${API_URL}/albums/${albumId}/review`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(payload)
  });

  if (!response.ok) throw new Error('Failed to post review');
  const newReview = await response.json();

  return {
    id: newReview._id,
    userId: newReview.user_id,
    username: newReview.username,
    rating: newReview.rating,
    comment: newReview.review_text,
    date: newReview.created_at
  };
};

export const updateReview = async (albumId, reviewData) => {
  const payload = {
    user_id: CURRENT_USER_ID,
    rating: reviewData.rating,
    review_text: reviewData.comment
  };

  const response = await fetch(`${API_URL}/albums/${albumId}/review`, {
    method: 'PUT',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(payload)
  });

  if (!response.ok) throw new Error('Failed to update review');
  const updatedReview = await response.json();

  return {
    id: updatedReview._id,
    userId: updatedReview.user_id,
    username: updatedReview.username,
    rating: updatedReview.rating,
    comment: updatedReview.review_text,
    date: updatedReview.created_at
  };
};

export const deleteReview = async (albumId) => {
  const payload = { user_id: CURRENT_USER_ID };

  const response = await fetch(`${API_URL}/albums/${albumId}/review`, {
    method: 'DELETE',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(payload)
  });

  if (!response.ok) throw new Error('Failed to delete review');
  return response.json();
};

// ─── Analytics ───

export const fetchTopRatedAlbums = async () => {
  const response = await fetch(`${API_URL}/analytics/top-rated`);
  if (!response.ok) throw new Error('Failed to fetch top rated albums');
  const data = await response.json();
  return data.map(d => ({
    id: d._id,
    title: d.title,
    artist: d.artist,
    rating: d.avgRating,
    totalRatings: d.totalReviews,
    plays: d.plays,
    color: d.color || '#3b82f6',
    cover_url: d.cover_url
  }));
};

// Alias
export const fetchTopRated = fetchTopRatedAlbums;

export const fetchUserTopRatedAlbums = async (userId = CURRENT_USER_ID) => {
  const response = await fetch(`${API_URL}/analytics/user-top-rated?userId=${userId}`);
  if (!response.ok) throw new Error('Failed to fetch user top rated albums');
  const data = await response.json();
  return data.map(d => ({
    id: d._id,
    title: d.title,
    artist: d.artist,
    rating: d.userRating,
    avgRating: d.avgRating,
    totalRatings: d.totalReviews,
    plays: d.plays,
    color: d.color || '#3b82f6',
    cover_url: d.cover_url
  }));
};

export const fetchTrendingGenres = async () => {
  const response = await fetch(`${API_URL}/analytics/trending-genres`);
  if (!response.ok) throw new Error('Failed to fetch trending genres');
  return response.json();
};

export const fetchActiveUsers = async () => {
  const response = await fetch(`${API_URL}/analytics/active-users`);
  if (!response.ok) throw new Error('Failed to fetch active users');
  return response.json();
};

// Returns { genres: [...], values: [...], colors: [...] } for the Dashboard doughnut chart
export const fetchGenreChartData = async () => {
  const response = await fetch(`${API_URL}/analytics/genre-chart`);
  if (!response.ok) throw new Error('Failed to fetch genre chart data');
  return response.json();
};

// Returns { totalAlbums, totalReviews, totalArtists, totalUsers }
export const fetchDashboardStats = async () => {
  const response = await fetch(`${API_URL}/analytics/dashboard-stats`);
  if (!response.ok) throw new Error('Failed to fetch dashboard stats');
  return response.json();
};

// Returns artists derived from albums collection
export const fetchTopArtists = async () => {
  const response = await fetch(`${API_URL}/analytics/artists`);
  if (!response.ok) throw new Error('Failed to fetch artists');
  return response.json();
};

// ─── Users ───

export const fetchUserProfile = async (userId = CURRENT_USER_ID) => {
  const response = await fetch(`${API_URL}/users/${userId}/profile`);
  if (!response.ok) throw new Error('Failed to fetch user profile');
  return response.json();
};

export const fetchUserActivity = async (userId = CURRENT_USER_ID) => {
  const response = await fetch(`${API_URL}/users/${userId}/activity`);
  if (!response.ok) throw new Error('Failed to fetch user activity');
  const data = await response.json();
  return data.map(entry => ({
    id: entry._id,
    album: entry.album,
    artist: entry.artist,
    action: entry.action,
    rating: entry.rating,
    reviewText: entry.reviewText,
    date: entry.date,
    color: entry.color
  }));
};

// ─── Genres list (for filter dropdowns) — derived from genre-chart data ───
export const fetchGenres = async () => {
  const data = await fetchGenreChartData();
  return data.genres || [];
};
