const mongoose = require('mongoose');

const reviewSchema = new mongoose.Schema({
  // user_id is the reference to the User model.
  user_id: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  username: { type: String, required: true },
  rating: { type: Number, required: true, min: 1, max: 5 },
  review_text: { type: String, required: true },
  created_at: { type: Date, default: Date.now }
});

const albumSchema = new mongoose.Schema({
  title: { type: String, required: true },
  artist: { type: String, required: true },
  genres: [{ type: String }],
  release_year: { type: Number },
  color: { type: String },
  cover_url: { type: String }, // optional if we load covers from elsewhere
  plays: { type: Number, default: 0 },
  tracks: { type: Number, default: 0 },
  reviews: [reviewSchema],
  average_rating: { type: Number, default: 0 },
  total_ratings: { type: Number, default: 0 }
});

// -----------------------------------
// 5. INDEXING
// -----------------------------------

// Text index: allows efficient searching by title, artist, or review content.
// By giving 'title' a higher weight, matches in title will rank higher.
albumSchema.index(
  { title: 'text', artist: 'text', 'reviews.review_text': 'text' },
  { weights: { title: 10, artist: 5, 'reviews.review_text': 1 } }
);

// Compound index: allows fast filtering when querying by artist and genre together.
// E.g., db.albums.find({ artist: "Luna Vale", genres: "Electronic" })
albumSchema.index({ artist: 1, genres: 1 });

// Index on nested array field: allows efficient querying/sorting of albums containing specific ratings.
// E.g., db.albums.find({ "reviews.rating": { $gte: 4 } })
albumSchema.index({ 'reviews.rating': 1 });

module.exports = mongoose.model('Album', albumSchema);
