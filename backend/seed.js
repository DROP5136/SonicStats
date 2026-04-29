/**
 * seed.js
 * -------
 * Seeds the SonicStats MongoDB database with all initial data.
 * Run once:  node backend/seed.js
 *
 * Data sources (defined below as JS constants):
 *   - ALBUMS           → albums collection (Album schema)
 *   - REVIEWS          → embedded inside each album document
 *   - LISTENING_HISTORY→ embedded inside the main user document (User schema)
 *   - USERS            → users collection (User schema)
 */

'use strict';

const mongoose = require('mongoose');
require('dotenv').config();
const User  = require('./models/User');
const Album = require('./models/Album');

// ─────────────────────────────────────────────
//  SEED DATA  (all mock data lives here)
// ─────────────────────────────────────────────

const COLORS = [
  '#8b5cf6', '#ec4899', '#f59e0b', '#3b82f6',
  '#1db954', '#f43f5e', '#a855f7', '#06b6d4'
];

/** 12 albums — maps to Album schema fields */
const ALBUMS = [
  { id: 1,  title: 'Raag Midnight',    artist: 'Ravi Shankar Jr',   genre: 'Classical', year: 2025, rating: 4.7, totalRatings: 1420, plays: 24100, color: COLORS[0], tracks: 12 },
  { id: 2,  title: 'Teri Yaad',        artist: 'Arijit Singh',      genre: 'Bollywood', year: 2025, rating: 4.5, totalRatings: 980,  plays: 19700, color: COLORS[1], tracks: 10 },
  { id: 3,  title: 'Monsoon Tales',    artist: 'Shreya Ghoshal',    genre: 'Fusion',    year: 2024, rating: 4.4, totalRatings: 1105, plays: 17200, color: COLORS[2], tracks: 14 },
  { id: 4,  title: 'Taj Mahal Dreams', artist: 'Rahman Ensemble',   genre: 'Classical', year: 2024, rating: 4.3, totalRatings: 850,  plays: 15800, color: COLORS[3], tracks: 11 },
  { id: 5,  title: 'Bhairavanaam',     artist: 'Lata Mangeshkar',   genre: 'Classical', year: 2025, rating: 4.2, totalRatings: 620,  plays: 14300, color: COLORS[4], tracks: 9  },
  { id: 6,  title: 'Delhi Vibes',      artist: 'Badshah',           genre: 'Hip Hop',   year: 2024, rating: 4.1, totalRatings: 1250, plays: 12900, color: COLORS[5], tracks: 13 },
  { id: 7,  title: 'Goan Sunset',      artist: 'Asha Parekh',       genre: 'Pop',       year: 2025, rating: 4.0, totalRatings: 490,  plays: 11500, color: COLORS[6], tracks: 10 },
  { id: 8,  title: 'Ganges Flow',      artist: 'Nusrat Ali Khan',   genre: 'Qawwali',   year: 2023, rating: 4.0, totalRatings: 380,  plays: 10200, color: COLORS[7], tracks: 8  },
  { id: 9,  title: 'Himalayan Echo',   artist: 'Shaan',             genre: 'Pop',       year: 2024, rating: 3.9, totalRatings: 410,  plays: 9600,  color: COLORS[0], tracks: 11 },
  { id: 10, title: 'Mumbai Dreams',    artist: 'Yo Yo Honey Singh', genre: 'Hip Hop',   year: 2025, rating: 3.8, totalRatings: 730,  plays: 8700,  color: COLORS[5], tracks: 15 },
  { id: 11, title: 'Kashmir Nights',   artist: 'Hariharan',         genre: 'Classical', year: 2024, rating: 3.7, totalRatings: 290,  plays: 7200,  color: COLORS[3], tracks: 9  },
  { id: 12, title: 'Bangalore Beats',  artist: 'Haricharan',        genre: 'Fusion',    year: 2025, rating: 3.6, totalRatings: 810,  plays: 6800,  color: COLORS[1], tracks: 16 },
];

/**
 * Reviews — embedded in Album.reviews[]
 * Maps: albumId → mock id | userId → 'me' | 'u1' … 'u8'
 * Schema fields: user_id, username, rating, review_text, created_at
 */
const REVIEWS = [
  { albumId: 1, userId: 'u1', username: 'MelodyHunter',  rating: 5, comment: 'An absolute masterpiece. The production quality is unmatched and every track flows seamlessly into the next.', date: '2025-04-20' },
  { albumId: 1, userId: 'u2', username: 'VinylVibes',     rating: 5, comment: 'Hauntingly beautiful. Every listen reveals a new layer of depth.',                                             date: '2025-04-15' },
  { albumId: 2, userId: 'u3', username: 'IndieExplorer',  rating: 5, comment: 'Arijit Singh keeps pushing emotional boundaries. This album is a journey.',                                    date: '2025-04-19' },
];

/**
 * Listening history — embedded in User.listening_history[]
 * Schema fields: album_id, duration_secs, listened_at
 * duration string "MM:SS" is converted to seconds below.
 */
const LISTENING_HISTORY = [
  { albumId: 1, duration: '42:18', date: '2025-04-26T14:32:00' },
  { albumId: 2, duration: '38:45', date: '2025-04-26T11:05:00' },
  { albumId: 3, duration: '51:30', date: '2025-04-25T22:17:00' },
];

// ─────────────────────────────────────────────
//  HELPERS
// ─────────────────────────────────────────────

/** Convert "MM:SS" duration string to total seconds (Number) */
function durationToSecs(str) {
  const [mins, secs] = str.split(':').map(Number);
  return mins * 60 + secs;
}

// ─────────────────────────────────────────────
//  SEED FUNCTION
// ─────────────────────────────────────────────

async function seedDB() {
  try {
    await mongoose.connect(process.env.MONGO_URI);
    console.log('✅  Connected to MongoDB. Dropping old data…');

    // Wipe all existing documents cleanly
    await mongoose.connection.db.dropDatabase();
    console.log('✅  Old database dropped.');

    // ── 1. Create supporting users (u1 … u8) ────────────────────────────────
    const userIds = {};   // key: 'me' | 'u1'…'u8'  →  value: ObjectId

    for (let i = 1; i <= 8; i++) {
      const u = new User({
        name:  `User${i}`,
        email: `u${i}@sonicstats.dev`,
        avatar: `U${i}`
      });
      await u.save();
      userIds[`u${i}`] = u._id;
    }

    // ── 2. Create main user (Lakshay) with fixed ObjectId ───────────────────
    const lakshay = new User({
      _id:               new mongoose.Types.ObjectId('60d5ecb8b392d700153c3000'),
      name:              'Lakshay',
      email:             'lakshay@sonicstats.dev',
      avatar:            'LK',
      review_activity:   [],
      listening_history: []
    });
    await lakshay.save();
    userIds['me'] = lakshay._id;

    console.log(`✅  Created ${Object.keys(userIds).length} users.`);

    // ── 3. Create Albums ─────────────────────────────────────────────────────
    const albumIdMap = {};   // mock numeric id → MongoDB ObjectId

    for (const a of ALBUMS) {
      const doc = new Album({
        title:          a.title,
        artist:         a.artist,
        genres:         [a.genre],          // schema expects array
        release_year:   a.year,
        color:          a.color,
        plays:          a.plays,
        tracks:         a.tracks,
        average_rating: a.rating,
        total_ratings:  a.totalRatings,
        reviews:        []
      });
      await doc.save();
      albumIdMap[a.id] = doc._id;
    }

    console.log(`✅  Seeded ${ALBUMS.length} albums.`);

    // ── 4. Embed Reviews inside Albums ───────────────────────────────────────
    for (const r of REVIEWS) {
      const albumOid = albumIdMap[r.albumId];
      const userOid  = userIds[r.userId];

      if (!albumOid || !userOid) {
        console.warn(`⚠️  Skipping review: albumId=${r.albumId}, userId=${r.userId} (not found)`);
        continue;
      }

      await Album.findByIdAndUpdate(albumOid, {
        $push: {
          reviews: {
            user_id:     userOid,
            username:    r.username,
            rating:      r.rating,
            review_text: r.comment,
            created_at:  new Date(r.date)
          }
        }
      });
    }

    console.log(`✅  Embedded ${REVIEWS.length} reviews into albums.`);

    // ── 5. Build Lakshay's review_activity from his saved reviews ───────────
    for (const r of REVIEWS.filter(rv => rv.userId === 'me')) {
      const albumOid = albumIdMap[r.albumId];
      if (!albumOid) continue;

      // Fetch the freshly-saved album to grab the generated review _id
      const album = await Album.findById(albumOid);
      const savedReview = album.reviews.find(
        rv => rv.user_id.toString() === lakshay._id.toString()
      );

      if (savedReview) {
        lakshay.review_activity.push({
          review_id:   savedReview._id,
          album_id:    albumOid,
          action:      'created',
          rating:      savedReview.rating,
          review_text: savedReview.review_text,
          timestamp:   new Date(r.date + 'T10:00:00')
        });
      }
    }

    // ── 6. Embed Listening History into Lakshay's document ──────────────────
    for (const entry of LISTENING_HISTORY) {
      const albumOid = albumIdMap[entry.albumId];
      if (!albumOid) {
        console.warn(`⚠️  Skipping listening entry: albumId=${entry.albumId} (not found)`);
        continue;
      }

      lakshay.listening_history.push({
        album_id:      albumOid,
        duration_secs: durationToSecs(entry.duration),  // e.g. "42:18" → 2538
        listened_at:   new Date(entry.date)
      });
    }

    await lakshay.save();

    console.log(`✅  Seeded ${LISTENING_HISTORY.length} listening history entries for Lakshay.`);
    console.log(`✅  Seeded ${lakshay.review_activity.length} review_activity entries for Lakshay.`);
    console.log('\n🎵  Database seeded successfully! All mock data is now in MongoDB.');
    process.exit(0);

  } catch (err) {
    console.error('❌  Error seeding database:', err);
    process.exit(1);
  }
}

seedDB();
