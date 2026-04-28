const mongoose = require('mongoose');

const reviewActivitySchema = new mongoose.Schema({
  review_id: { type: mongoose.Schema.Types.ObjectId },
  album_id: { type: mongoose.Schema.Types.ObjectId, ref: 'Album', required: true },
  action: { type: String, enum: ['created', 'edited', 'deleted'], default: 'created' },
  timestamp: { type: Date, default: Date.now },
  rating: { type: Number },
  review_text: { type: String }
});

const userSchema = new mongoose.Schema({
  name: { type: String, required: true },
  email: { type: String, required: true, unique: true },
  avatar: { type: String },
  review_activity: [reviewActivitySchema]
});

module.exports = mongoose.model('User', userSchema);
