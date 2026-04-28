const mongoose = require('mongoose');

const reviewActivitySchema = new mongoose.Schema({
  review_id:   { type: mongoose.Schema.Types.ObjectId },
  album_id:    { type: mongoose.Schema.Types.ObjectId, ref: 'Album', required: true },
  action:      { type: String, enum: ['created', 'edited', 'deleted'], default: 'created' },
  timestamp:   { type: Date, default: Date.now },
  rating:      { type: Number },
  review_text: { type: String }
});

// Embedded listening session per user
const listeningHistorySchema = new mongoose.Schema({
  album_id:       { type: mongoose.Schema.Types.ObjectId, ref: 'Album', required: true },
  duration_secs:  { type: Number },          // total seconds listened
  listened_at:    { type: Date, required: true }
});

const userSchema = new mongoose.Schema({
  name:              { type: String, required: true },
  email:             { type: String, required: true, unique: true },
  avatar:            { type: String },
  review_activity:   [reviewActivitySchema],
  listening_history: [listeningHistorySchema]
});

// Index for querying a user's history by date
userSchema.index({ 'listening_history.listened_at': -1 });

module.exports = mongoose.model('User', userSchema);
