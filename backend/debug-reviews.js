const mongoose = require('mongoose');
require('dotenv').config();
const Review = require('./models/Review');

async function debug() {
  try {
    await mongoose.connect(process.env.MONGO_URI);
    console.log('Connected to MongoDB');
    
    const count = await Review.countDocuments();
    console.log(`Total reviews in database: ${count}`);
    
    const reviews = await Review.find().limit(5);
    console.log(`First 5 reviews:`, JSON.stringify(reviews, null, 2));
    
    process.exit(0);
  } catch (error) {
    console.error('Error:', error.message);
    process.exit(1);
  }
}

debug();
