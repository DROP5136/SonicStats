const User = require('../models/User');
const Album = require('../models/Album');

// GET /api/users/:id/activity
// Returns user's review activity with album details via $lookup
exports.getUserActivity = async (req, res) => {
  try {
    const mongoose = require('mongoose');
    const userId = new mongoose.Types.ObjectId(req.params.id);

    const activity = await User.aggregate([
      { $match: { _id: userId } },
      { $unwind: '$review_activity' },
      {
        $lookup: {
          from: 'albums',
          localField: 'review_activity.album_id',
          foreignField: '_id',
          as: 'albumDetails'
        }
      },
      { $unwind: '$albumDetails' },
      { $sort: { 'review_activity.timestamp': -1 } },
      {
        $project: {
          _id: '$review_activity._id',
          album: '$albumDetails.title',
          artist: '$albumDetails.artist',
          action: '$review_activity.action',
          rating: '$review_activity.rating',
          reviewText: '$review_activity.review_text',
          date: {
            $dateToString: {
              format: '%Y-%m-%d %H:%M',
              date: '$review_activity.timestamp',
              timezone: 'Asia/Kolkata'
            }
          },
          color: '$albumDetails.color'
        }
      }
    ]);

    res.json(activity);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

// GET /api/users/:id/profile
// Returns user profile with computed stats from DB
exports.getUserProfile = async (req, res) => {
  try {
    const mongoose = require('mongoose');
    const userId = new mongoose.Types.ObjectId(req.params.id);

    const user = await User.findById(userId);
    if (!user) return res.status(404).json({ error: 'User not found' });

    // Compute stats from review_activity
    const totalReviewsWritten = user.review_activity.filter(a => a.action === 'created').length;
    const ratingsGiven = user.review_activity.filter(a => a.rating != null).map(a => a.rating);
    const avgRating = ratingsGiven.length > 0
      ? (ratingsGiven.reduce((s, r) => s + r, 0) / ratingsGiven.length).toFixed(1)
      : 0;

    // Count unique albums the user has reviewed
    const uniqueAlbums = new Set(
      user.review_activity.map(a => a.album_id.toString())
    ).size;

    // Get user's actual review entries with album details
    const reviewDetails = await User.aggregate([
      { $match: { _id: userId } },
      { $unwind: '$review_activity' },
      { $match: { 'review_activity.action': 'created' } },
      {
        $lookup: {
          from: 'albums',
          localField: 'review_activity.album_id',
          foreignField: '_id',
          as: 'albumInfo'
        }
      },
      { $unwind: '$albumInfo' },
      { $sort: { 'review_activity.timestamp': -1 } },
      {
        $project: {
          albumId: '$albumInfo._id',
          albumTitle: '$albumInfo.title',
          artist: '$albumInfo.artist',
          rating: '$review_activity.rating',
          comment: '$review_activity.review_text',
          date: {
            $dateToString: {
              format: '%Y-%m-%d',
              date: '$review_activity.timestamp',
              timezone: 'Asia/Kolkata'
            }
          },
          color: '$albumInfo.color'
        }
      }
    ]);

    res.json({
      name: user.name,
      email: user.email,
      avatar: user.avatar || user.name.slice(0, 2).toUpperCase(),
      location: 'Mumbai, India',
      memberSince: user._id.getTimestamp().getFullYear().toString(),
      plan: 'Premium',
      stats: {
        totalAlbums: uniqueAlbums || totalReviewsWritten,
        avgRating: parseFloat(avgRating),
        hoursListened: Math.round(uniqueAlbums * 45 + totalReviewsWritten * 12),
        reviewsWritten: totalReviewsWritten
      },
      reviews: reviewDetails
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};
