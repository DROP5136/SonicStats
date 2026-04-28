const mongoose = require('mongoose');
require('dotenv').config();
const Album = require('./models/Album');
const Review = require('./models/Review');

async function debug() {
  try {
    await mongoose.connect(process.env.MONGO_URI);
    console.log('Connected to MongoDB');
    
    // Get first album
    const album = await Album.findOne().select('_id title');
    console.log(`Album: ${album.title} (${album._id})`);
    
    // Find reviews for this album
    const reviews = await Review.find({ album_id: album._id });
    console.log(`Reviews found: ${reviews.length}`);
    reviews.forEach(r => {
      console.log(`  - ${r.username}: ${r.rating}/5 - "${r.review_text.substring(0, 50)}..."`);
    });
    
    // Try with string ID
    const reviewsStr = await Review.find({ album_id: album._id.toString() });
    console.log(`Reviews found (with string ID): ${reviewsStr.length}`);
    
    process.exit(0);
  } catch (error) {
    console.error('Error:', error.message);
    process.exit(1);
  }
}

debug();
