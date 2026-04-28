const mongoose = require('mongoose');
require('dotenv').config();
const User = require('./models/User');
const Album = require('./models/Album');

// Hardcoded mock data from frontend
const COLORS = ['#8b5cf6','#ec4899','#f59e0b','#3b82f6','#1db954','#f43f5e','#a855f7','#06b6d4'];

const ALBUMS = [
  { id: 1, title: 'Raag Midnight',      artist: 'Ravi Shankar Jr',   genre: 'Classical', year: 2025, rating: 4.7, totalRatings: 1420, plays: 24100, color: COLORS[0], tracks: 12 },
  { id: 2, title: 'Teri Yaad',          artist: 'Arijit Singh',      genre: 'Bollywood', year: 2025, rating: 4.5, totalRatings: 980, plays: 19700, color: COLORS[1], tracks: 10 },
  { id: 3, title: 'Monsoon Tales',      artist: 'Shreya Ghoshal',    genre: 'Fusion',    year: 2024, rating: 4.4, totalRatings: 1105, plays: 17200, color: COLORS[2], tracks: 14 },
  { id: 4, title: 'Taj Mahal Dreams',   artist: 'Rahman Ensemble',   genre: 'Classical', year: 2024, rating: 4.3, totalRatings: 850, plays: 15800, color: COLORS[3], tracks: 11 },
  { id: 5, title: 'Bhairavanaam',       artist: 'Lata Mangeshkar',   genre: 'Classical', year: 2025, rating: 4.2, totalRatings: 620, plays: 14300, color: COLORS[4], tracks: 9 },
  { id: 6, title: 'Delhi Vibes',        artist: 'Badshah',           genre: 'Hip Hop',   year: 2024, rating: 4.1, totalRatings: 1250, plays: 12900, color: COLORS[5], tracks: 13 },
  { id: 7, title: 'Goan Sunset',        artist: 'Asha Parekh',       genre: 'Pop',       year: 2025, rating: 4.0, totalRatings: 490, plays: 11500, color: COLORS[6], tracks: 10 },
  { id: 8, title: 'Ganges Flow',        artist: 'Nusrat Ali Khan',   genre: 'Qawwali',   year: 2023, rating: 4.0, totalRatings: 380, plays: 10200, color: COLORS[7], tracks: 8 },
  { id: 9, title: 'Himalayan Echo',     artist: 'Shaan',             genre: 'Pop',       year: 2024, rating: 3.9, totalRatings: 410, plays: 9600,  color: COLORS[0], tracks: 11 },
  { id: 10, title: 'Mumbai Dreams',     artist: 'Yo Yo Honey Singh',  genre: 'Hip Hop',   year: 2025, rating: 3.8, totalRatings: 730, plays: 8700,  color: COLORS[5], tracks: 15 },
  { id: 11, title: 'Kashmir Nights',    artist: 'Hariharan',         genre: 'Classical', year: 2024, rating: 3.7, totalRatings: 290, plays: 7200,  color: COLORS[3], tracks: 9 },
  { id: 12, title: 'Bangalore Beats',   artist: 'Haricharan',        genre: 'Fusion',    year: 2025, rating: 3.6, totalRatings: 810, plays: 6800,  color: COLORS[1], tracks: 16 },
];

const REVIEWS = [
  { id: 1, albumId: 1, userId: 'u1', username: 'MelodyHunter',   avatar: 'MH', rating: 5, comment: 'An absolute masterpiece. The production quality is unmatched and every track flows seamlessly into the next.', date: '2025-04-20' },
  { id: 2, albumId: 1, userId: 'me', username: 'Lakshay',        avatar: 'LK', rating: 4, comment: 'Incredible soundscapes. Ravi Shankar Jr has outdone himself with this one.', date: '2025-04-18' },
  { id: 3, albumId: 1, userId: 'u2', username: 'VinylVibes',     avatar: 'VV', rating: 5, comment: 'Hauntingly beautiful. Every listen reveals a new layer of depth.', date: '2025-04-15' },
  { id: 4, albumId: 2, userId: 'u3', username: 'IndieExplorer',  avatar: 'IE', rating: 5, comment: 'Arijit Singh keeps pushing emotional boundaries. This album is a journey.', date: '2025-04-19' },
  { id: 5, albumId: 2, userId: 'me', username: 'Lakshay',        avatar: 'LK', rating: 4, comment: 'Vocal work is phenomenal. Raw emotion with polished production.', date: '2025-04-16' },
];

const LISTENING_HISTORY = [
  { id: 1,  albumId: 1, duration: '42:18', date: '2025-04-26 14:32' },
  { id: 2,  albumId: 2, duration: '38:45', date: '2025-04-26 11:05' },
  { id: 3,  albumId: 3, duration: '51:30', date: '2025-04-25 22:17' },
];

async function seedDB() {
  try {
    await mongoose.connect(process.env.MONGO_URI);
    console.log('Connected to MongoDB. Dropping old database...');
    
    await mongoose.connection.db.dropDatabase();

    // 1. Create Main User
    const alex = new User({
      _id: new mongoose.Types.ObjectId('60d5ecb8b392d700153c3000'),
      name: 'Lakshay',
      email: 'lakshay@gmail.com',
      avatar: 'LK',
      review_activity: []
    });
    await alex.save();
    
    // Create some other dummy users
    const userIds = { 'me': alex._id };
    for (let i = 1; i <= 8; i++) {
      const u = new User({ name: `User ${i}`, email: `u${i}@email.com` });
      await u.save();
      userIds[`u${i}`] = u._id;
    }

    // 2. Create Albums
    const albumIdMap = {}; // map mock ID to MongoDB ObjectId
    for (const albumData of ALBUMS) {
      const newAlbum = new Album({
        title: albumData.title,
        artist: albumData.artist,
        genres: [albumData.genre],
        release_year: albumData.year,
        color: albumData.color,
        plays: albumData.plays,
        tracks: albumData.tracks,
        average_rating: albumData.rating,
        total_ratings: albumData.totalRatings,
        reviews: []
      });
      await newAlbum.save();
      albumIdMap[albumData.id] = newAlbum._id;
    }

    // 3. Add Reviews to Albums (Demonstrating nested arrays)
    for (const review of REVIEWS) {
      const albumOid = albumIdMap[review.albumId];
      const userOid = userIds[review.userId];
      if (albumOid && userOid) {
        await Album.findByIdAndUpdate(albumOid, {
          $push: {
            reviews: {
              user_id: userOid,
              username: review.username,
              rating: review.rating,
              review_text: review.comment,
              created_at: new Date(review.date)
            }
          }
        });
      }
    }

    // 4. Add Review Activity to Main User (tracking review operations)
    // Lakshay created reviews for albums 1 and 2
    const album1Oid = albumIdMap[1];
    const album2Oid = albumIdMap[2];
    const lakshayId = alex._id.toString();
    
    if (album1Oid) {
      const album1 = await Album.findById(album1Oid);
      for (const review of album1.reviews) {
        if (review.user_id.toString() === lakshayId) {
          alex.review_activity.push({
            review_id: review._id,
            album_id: album1Oid,
            action: 'created',
            rating: review.rating,
            review_text: review.review_text,
            timestamp: new Date('2025-04-20 10:30')
          });
        }
      }
    }
    
    if (album2Oid) {
      const album2 = await Album.findById(album2Oid);
      for (const review of album2.reviews) {
        if (review.user_id.toString() === lakshayId) {
          alex.review_activity.push({
            review_id: review._id,
            album_id: album2Oid,
            action: 'created',
            rating: review.rating,
            review_text: review.review_text,
            timestamp: new Date('2025-04-22 14:15')
          });
        }
      }
    }
    
    await alex.save();

    console.log('Database seeded successfully!');
    process.exit(0);
  } catch (error) {
    console.error('Error seeding database:', error);
    process.exit(1);
  }
}

seedDB();
