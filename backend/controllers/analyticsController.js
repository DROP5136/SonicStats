const Album = require('../models/Album');
const User = require('../models/User');

// -----------------------------------
// 1. Top Rated Albums (aggregation pipeline)
// -----------------------------------
exports.getTopRatedAlbums = async (req, res) => {
  try {
    // Use the stored average_rating so ALL albums appear (not just ones with review subdocs).
    // This field is always populated from the seed and kept up-to-date by addReview/updateReview.
    const albums = await Album.find()
      .sort({ average_rating: -1, total_ratings: -1 })
      .limit(10)
      .lean();

    const result = albums.map(a => ({
      _id:          a._id,
      title:        a.title,
      artist:       a.artist,
      cover_url:    a.cover_url || null,
      color:        a.color,
      plays:        a.plays,
      avgRating:    a.average_rating,
      totalReviews: a.reviews ? a.reviews.length : 0
    }));

    res.json(result);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

// -----------------------------------
// 1b. User's Top Rated Albums (personalized by current user's ratings)
// -----------------------------------
exports.getUserTopRatedAlbums = async (req, res) => {
  try {
    const mongoose = require('mongoose');
    const userId = req.query.userId || req.params.userId;
    
    if (!userId) {
      return res.status(400).json({ error: 'userId is required' });
    }

    const objectId = new mongoose.Types.ObjectId(userId);
    const user = await User.findById(objectId);

    if (!user) {
      return res.status(404).json({ error: 'User not found' });
    }

    // Get the most recent rating for each album (considering created and edited actions)
    const albumRatings = {};
    
    for (const activity of user.review_activity) {
      // Skip deleted reviews
      if (activity.action === 'deleted') {
        delete albumRatings[activity.album_id.toString()];
        continue;
      }
      
      // For created/edited actions with ratings, keep the most recent one
      if ((activity.action === 'created' || activity.action === 'edited') && activity.rating) {
        const albumIdStr = activity.album_id.toString();
        albumRatings[albumIdStr] = {
          album_id: activity.album_id,
          rating: activity.rating,
          timestamp: activity.timestamp || new Date(0)
        };
      }
    }

    const albumIds = Object.values(albumRatings).map(r => r.album_id);

    if (albumIds.length === 0) {
      return res.json([]);
    }

    // Fetch album details for those IDs
    const albums = await Album.find({ _id: { $in: albumIds } }).lean();

    // Build result by mapping with the most recent ratings
    const enriched = albumIds.map(albumId => {
      const album = albums.find(a => a._id.toString() === albumId.toString());
      const ratingInfo = albumRatings[albumId.toString()];
      
      if (!album || !ratingInfo) return null;
      
      return {
        _id:          album._id,
        title:        album.title,
        artist:       album.artist,
        cover_url:    album.cover_url || null,
        color:        album.color,
        plays:        album.plays,
        avgRating:    album.average_rating,
        userRating:   ratingInfo.rating,  // Most recent rating (considers edits)
        totalReviews: album.reviews ? album.reviews.length : 0
      };
    })
    .filter(item => item !== null)  // Remove any null entries
    .sort((a, b) => b.userRating - a.userRating);  // Sort by user's rating, highest first

    res.json(enriched);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

// -----------------------------------
// 2. Most Active Users
// -----------------------------------
exports.getActiveUsers = async (req, res) => {
  try {
    const activeUsers = await User.aggregate([
      { $unwind: '$review_activity' },
      {
        $group: {
          _id: '$_id',
          name: { $first: '$name' },
          avatar: { $first: '$avatar' },
          listenCount: { $sum: 1 }
        }
      },
      { $sort: { listenCount: -1 } },
      { $limit: 5 }
    ]);
    res.json(activeUsers);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

// -----------------------------------
// 3. Trending Genres
// -----------------------------------
exports.getTrendingGenres = async (req, res) => {
  try {
    const trending = await Album.aggregate([
      { $unwind: '$genres' },
      {
        $group: {
          _id: '$genres',
          count: { $sum: 1 }
        }
      },
      { $sort: { count: -1 } },
      { $limit: 8 }
    ]);
    res.json(trending);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

// -----------------------------------
// 4. Genre Chart Data (for Doughnut chart on Dashboard)
// Returns genres with their album counts and play counts
// -----------------------------------
exports.getGenreChartData = async (req, res) => {
  try {
    const GENRE_COLORS = [
      '#8b5cf6', '#ec4899', '#f59e0b', '#3b82f6',
      '#1db954', '#f43f5e', '#a855f7', '#06b6d4'
    ];

    const genreStats = await Album.aggregate([
      { $unwind: '$genres' },
      {
        $group: {
          _id: '$genres',
          count: { $sum: 1 },
          totalPlays: { $sum: '$plays' },
          avgRating: { $avg: '$average_rating' }
        }
      },
      { $sort: { totalPlays: -1 } }
    ]);

    const genres = genreStats.map(g => g._id);
    const values = genreStats.map(g => g.totalPlays);
    const colors = genreStats.map((_, i) => GENRE_COLORS[i % GENRE_COLORS.length]);

    res.json({ genres, values, colors, raw: genreStats });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

// -----------------------------------
// 5. Dashboard Stats (total albums, reviews, artists)
// -----------------------------------
exports.getDashboardStats = async (req, res) => {
  try {
    const [albumCount, userCount, reviewStats] = await Promise.all([
      Album.countDocuments(),
      User.countDocuments(),
      Album.aggregate([
        { $unwind: '$reviews' },
        { $group: { _id: null, total: { $sum: 1 } } }
      ])
    ]);

    // Count unique artists
    const artistResult = await Album.aggregate([
      { $group: { _id: '$artist' } },
      { $count: 'total' }
    ]);

    const totalReviews = reviewStats.length > 0 ? reviewStats[0].total : 0;
    const totalArtists = artistResult.length > 0 ? artistResult[0].total : 0;

    res.json({
      totalAlbums: albumCount,
      totalReviews,
      totalArtists,
      totalUsers: userCount
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

// -----------------------------------
// 6. Artists — derived from albums collection
// Groups albums by artist and computes stats
// -----------------------------------
exports.getArtists = async (req, res) => {
  try {
    const COLORS = [
      '#8b5cf6', '#ec4899', '#f59e0b', '#3b82f6',
      '#1db954', '#f43f5e', '#a855f7', '#06b6d4'
    ];

    const artists = await Album.aggregate([
      {
        $group: {
          _id: '$artist',
          albumCount: { $sum: 1 },
          totalPlays: { $sum: '$plays' },
          avgRating: { $avg: '$average_rating' },
          genres: { $addToSet: { $arrayElemAt: ['$genres', 0] } }
        }
      },
      { $sort: { totalPlays: -1 } }
    ]);

    const result = artists.map((a, i) => ({
      id: i + 1,
      name: a._id,
      genre: a.genres[0] || 'Unknown',
      albums: a.albumCount,
      monthlyPlays: `${(a.totalPlays / 1000).toFixed(1)}K`,
      followers: `${Math.round(a.totalPlays / 3 / 1000)}K`,
      color: COLORS[i % COLORS.length]
    }));

    res.json(result);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};
