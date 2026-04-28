const mongoose = require('mongoose');
require('dotenv').config();
const Album = require('./models/Album');

async function debug() {
  try {
    await mongoose.connect(process.env.MONGO_URI);
    console.log('Connected to MongoDB');
    
    // Get Taj Mahal Dreams album - raw document
    const album = await Album.findOne({ title: 'Taj Mahal Dreams' }).lean();
    
    console.log('Album document keys:', Object.keys(album));
    console.log('\nFull album document:');
    console.log(JSON.stringify(album, null, 2));
    
    process.exit(0);
  } catch (error) {
    console.error('Error:', error.message);
    process.exit(1);
  }
}

debug();
