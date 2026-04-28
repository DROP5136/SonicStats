const mongoose = require('mongoose');
require('dotenv').config();
const Album = require('./models/Album');
const Review = require('./models/Review');

async function debug() {
  try {
    await mongoose.connect(process.env.MONGO_URI);
    console.log('Connected to MongoDB');
    
    // Get Taj Mahal Dreams album
    const album = await Album.findOne({ title: 'Taj Mahal Dreams' }).select('_id title average_rating total_ratings');
    console.log(`Album: ${album.title}`);
    console.log(`  Average rating: ${album.average_rating}, Total ratings: ${album.total_ratings}`);
    console.log(`  Album ID: ${album._id}`);
    
    // Find reviews for this album
    const reviews = await Review.find({ album_id: album._id });
    console.log(`Reviews found: ${reviews.length}`);
    reviews.forEach(r => {
      console.log(`  - ${r.username}: ${r.rating}/5`);
    });
    
    process.exit(0);
  } catch (error) {
    console.error('Error:', error.message);
    process.exit(1);
  }
}

debug();
