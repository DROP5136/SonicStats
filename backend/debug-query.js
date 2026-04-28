const mongoose = require('mongoose');
require('dotenv').config();
const Album = require('./models/Album');
const Review = require('./models/Review');

async function debug() {
  try {
    await mongoose.connect(process.env.MONGO_URI);
    console.log('Connected to MongoDB');
    
    // Get the test album
    const albumId = "69f0e6df9d2d24eb19cb6464";
    const album = await Album.findById(albumId).select('_id title');
    
    if (!album) {
      console.log('Album not found!');
      process.exit(1);
    }
    
    console.log(`Album: ${album.title}`);
    console.log(`Album ID: ${album._id}`);
    console.log(`Album ID string: ${album._id.toString()}`);
    
    // Test different ways to query reviews
    console.log('\n--- Testing Review.find() ---');
    
    // Method 1: Direct ObjectId
    const reviews1 = await Review.find({ album_id: album._id });
    console.log(`Method 1 (ObjectId): ${reviews1.length} reviews`);
    
    // Method 2: String ID
    const reviews2 = await Review.find({ album_id: album._id.toString() });
    console.log(`Method 2 (String): ${reviews2.length} reviews`);
    
    // Method 3: All reviews in database
    const allReviews = await Review.find();
    console.log(`Total reviews in DB: ${allReviews.length}`);
    
    // Show all reviews with their album_id
    console.log('\nAll reviews:');
    allReviews.forEach(r => {
      console.log(`  - Album: ${r.album_id} (string: ${r.album_id.toString()}), User: ${r.username}, Rating: ${r.rating}`);
    });
    
    process.exit(0);
  } catch (error) {
    console.error('Error:', error.message);
    process.exit(1);
  }
}

debug();
