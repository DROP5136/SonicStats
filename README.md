# 🎵 SonicStats — Music Album Review & Analytics Platform

A full-stack web application for reviewing music albums and exploring listening analytics.
Built with **React + Vite** (frontend), **Node.js + Express** (backend), and **MongoDB Atlas** (database).

---

## 🚀 Quick Start

### 1. Install dependencies

```bash
# Root (frontend + dev tooling)
npm install

# Backend
cd backend && npm install
```

### 2. Configure environment

Edit `backend/.env`:

```env
MONGO_URI=mongodb+srv://<user>:<password>@cluster0.hv9f88g.mongodb.net/sonicstats
PORT=5000
```

> ⚠️ The database name at the end of the URI (`/sonicstats`) is **required**.
> Without it, MongoDB defaults to the `test` database and your data won't match what you see in Atlas/Compass.

### 3. Seed the database

```bash
npm run seed
```

This populates MongoDB with 12 albums, 5 reviews, 9 users, and listening history.

### 4. Run the full project (one command)

```bash
npm run dev
```

This starts **both** servers simultaneously:
- `BACKEND` → Express API on `http://localhost:5000`
- `FRONTEND` → Vite dev server on `http://localhost:5173`

---

## 📁 Project Structure

```
SonicStats/
├── src/                          # React frontend
│   ├── pages/
│   │   ├── DashboardPage.jsx     # Overview stats, charts, top albums
│   │   ├── AlbumsPage.jsx        # Browse & filter all albums
│   │   ├── AlbumDetailPage.jsx   # Single album + reviews
│   │   ├── ProfilePage.jsx       # User profile & review history
│   │   └── ActivityPage.jsx      # User activity feed
│   ├── components/               # Reusable UI components
│   └── services/
│       └── api.js                # All fetch calls to /api/*
│
├── backend/
│   ├── models/
│   │   ├── Album.js              # Album + embedded Review schema + indexes
│   │   └── User.js               # User + review_activity + listening_history
│   ├── controllers/
│   │   ├── albumController.js    # CRUD for albums & reviews
│   │   ├── analyticsController.js  # Aggregation pipelines
│   │   ├── userController.js     # User profile & activity ($lookup)
│   │   └── searchController.js   # Full-text search
│   ├── routes/                   # Express route definitions
│   ├── seed.js                   # Database seeder (all initial data)
│   ├── server.js                 # Express app entry point
│   └── .env                      # MONGO_URI, PORT
│
├── package.json                  # Root: unified dev scripts
├── vite.config.js                # Vite proxy → localhost:5000
└── README.md                     # This file
```

---

## 🗄️ MongoDB Concepts Applied

This project intentionally demonstrates five core MongoDB/Mongoose data engineering patterns.
Below is a precise map of **where and how** each concept is used in the code.

---

### 1. 📐 Document Modeling — Embedded Arrays

**File:** `backend/models/Album.js` and `backend/models/User.js`

Instead of separate `reviews` and `listening_history` collections, related data is **embedded directly inside parent documents** as sub-arrays. This keeps related data co-located and eliminates the need for joins on hot read paths.

```js
// Album.js — reviews live INSIDE the album document
const reviewSchema = new mongoose.Schema({
  user_id:     { type: ObjectId, ref: 'User', required: true },
  username:    { type: String,   required: true },
  rating:      { type: Number,   min: 1, max: 5 },
  review_text: { type: String },
  created_at:  { type: Date,     default: Date.now }
});

const albumSchema = new mongoose.Schema({
  title:          String,
  artist:         String,
  genres:         [String],        // ← array of genre strings
  reviews:        [reviewSchema],  // ← embedded subdocument array
  average_rating: Number,
  total_ratings:  Number,
  plays:          Number,
  tracks:         Number,
  color:          String
});
```

```js
// User.js — two embedded arrays per user
const listeningHistorySchema = new mongoose.Schema({
  album_id:      { type: ObjectId, ref: 'Album', required: true },
  duration_secs: Number,   // stored as integer seconds (e.g. "42:18" → 2538)
  listened_at:   Date
});

const userSchema = new mongoose.Schema({
  name:              String,
  review_activity:   [reviewActivitySchema],   // ← every review action logged
  listening_history: [listeningHistorySchema]  // ← every listening session
});
```

---

### 2. 🔍 Indexing — Fast Queries & Text Search

**File:** `backend/models/Album.js` and `backend/models/User.js`

Four indexes are declared on the schemas. MongoDB uses these to avoid full collection scans.

```js
// Album.js

// INDEX 1: Full-text search — searches title, artist, and review text
// Weights control relevance ranking: title matches rank highest
albumSchema.index(
  { title: 'text', artist: 'text', 'reviews.review_text': 'text' },
  { weights: { title: 10, artist: 5, 'reviews.review_text': 1 } }
);
// Used by: GET /api/search?q=<term>

// INDEX 2: Compound index — fast filtering by artist AND genre together
albumSchema.index({ artist: 1, genres: 1 });
// Used by: any query like Album.find({ artist: 'Arijit Singh', genres: 'Bollywood' })

// INDEX 3: Nested array field index — fast queries on review ratings
albumSchema.index({ 'reviews.rating': 1 });
// Used by: Album.find({ 'reviews.rating': { $gte: 4 } })
```

```js
// User.js

// INDEX 4: Descending date index on listening history
userSchema.index({ 'listening_history.listened_at': -1 });
// Used by: sorting a user's recent listening sessions efficiently
```

---

### 3. ⚙️ CRUD Operations — MongoDB Update Operators

**File:** `backend/controllers/albumController.js`

Every review operation uses MongoDB update operators to mutate embedded arrays atomically — no read-modify-write round trips.

#### POST `/api/albums/:id/review` — Add a review

Uses `$push` (append to array), `$inc` (atomic increment), `$set` (update field):

```js
const updatedAlbum = await Album.findByIdAndUpdate(
  albumId,
  {
    $push: { reviews: newReview },      // ← appends review to the embedded array
    $inc:  { total_ratings: 1 },        // ← atomically increments counter by 1
    $set:  { average_rating: newAvg }   // ← updates cached average
  },
  { new: true }  // ← return the updated document
);
```

#### PUT `/api/albums/:id/review` — Edit an existing review

Uses the `$` **positional operator** to update only the matched array element:

```js
await Album.findOneAndUpdate(
  { _id: albumId, 'reviews.user_id': userId },  // ← match album + specific review
  {
    $set: {
      'reviews.$.rating':      newRating,     // ← $ refers to the matched subdoc
      'reviews.$.review_text': newText,
      'reviews.$.created_at':  new Date()
    }
  },
  { new: true }
);
// After update, recalculate average via aggregation pipeline
```

#### DELETE `/api/albums/:id/review` — Remove a review

Uses `$pull` to remove a matching subdocument from the array:

```js
await Album.findOneAndUpdate(
  { _id: albumId },
  {
    $pull: { reviews: { user_id: userId } },  // ← removes matching subdoc
    $inc:  { total_ratings: -1 }              // ← decrements counter atomically
  },
  { new: true }
);
```

---

### 4. 📊 Aggregation Pipelines

Aggregation pipelines compute analytics server-side inside MongoDB, returning only the final shaped result to Node.js. The app uses five distinct pipelines.

**File:** `backend/controllers/analyticsController.js`

---

#### Pipeline A — Trending Genres (`GET /api/analytics/trending-genres`)

Explodes the `genres` array per album, groups by genre, sums plays.

```js
Album.aggregate([
  { $unwind: '$genres' },            // ← one doc per genre string
  {
    $group: {
      _id:        '$genres',
      count:      { $sum: 1 },
      totalPlays: { $sum: '$plays' },
      avgRating:  { $avg: '$average_rating' }
    }
  },
  { $sort: { totalPlays: -1 } },     // ← rank by most played
  { $limit: 8 }
]);
```

---

#### Pipeline B — Genre Doughnut Chart (`GET /api/analytics/genre-chart`)

Same grouping, but shapes output into `{ genres[], values[], colors[] }` for Chart.js:

```js
// After aggregation, transform in JS:
const genres = genreStats.map(g => g._id);
const values = genreStats.map(g => g.totalPlays);
const colors = genreStats.map((_, i) => GENRE_COLORS[i % GENRE_COLORS.length]);
res.json({ genres, values, colors });
```

---

#### Pipeline C — Dashboard Stats (`GET /api/analytics/dashboard-stats`)

Runs three queries in parallel using `Promise.all`, plus an aggregation to count embedded reviews:

```js
const [albumCount, userCount, reviewStats] = await Promise.all([
  Album.countDocuments(),
  User.countDocuments(),
  Album.aggregate([
    { $unwind: '$reviews' },
    { $group: { _id: null, total: { $sum: 1 } } }  // ← count all embedded reviews
  ])
]);
// Also counts unique artists:
const artistResult = await Album.aggregate([
  { $group: { _id: '$artist' } },
  { $count: 'total' }
]);
```

---

#### Pipeline D — User Activity with `$lookup` (`GET /api/users/:id/activity`)

**File:** `backend/controllers/userController.js`

Performs a **join** between the user's `review_activity` array and the `albums` collection to enrich each entry with album details:

```js
User.aggregate([
  { $match: { _id: userId } },
  { $unwind: '$review_activity' },          // ← one doc per activity entry
  {
    $lookup: {                              // ← LEFT JOIN albums collection
      from:         'albums',
      localField:   'review_activity.album_id',
      foreignField: '_id',
      as:           'albumDetails'
    }
  },
  { $unwind: '$albumDetails' },
  { $sort: { 'review_activity.timestamp': -1 } },
  {
    $project: {                             // ← reshape output fields
      album:      '$albumDetails.title',
      artist:     '$albumDetails.artist',
      action:     '$review_activity.action',
      rating:     '$review_activity.rating',
      reviewText: '$review_activity.review_text',
      date: {
        $dateToString: {
          format: '%Y-%m-%d %H:%M',
          date:   '$review_activity.timestamp'
        }
      },
      color: '$albumDetails.color'
    }
  }
]);
```

---

#### Pipeline E — Artist Stats (`GET /api/analytics/artists`)

Groups all albums by artist, computing per-artist totals and unique genre list:

```js
Album.aggregate([
  {
    $group: {
      _id:        '$artist',
      albumCount: { $sum: 1 },
      totalPlays: { $sum: '$plays' },
      avgRating:  { $avg: '$average_rating' },
      genres:     { $addToSet: { $arrayElemAt: ['$genres', 0] } }  // ← unique genres
    }
  },
  { $sort: { totalPlays: -1 } }
]);
```

---

### 5. 🌱 Database Seeding

**File:** `backend/seed.js`

All initial data is declared as plain JS constants and then mapped to the exact Mongoose schema fields:

| Constant | Maps to |
|----------|---------|
| `ALBUMS[]` | `Album` documents (12 total) |
| `REVIEWS[]` | Embedded into `Album.reviews[]` |
| `LISTENING_HISTORY[]` | Embedded into `User.listening_history[]` |

A helper converts duration strings to integers:
```js
function durationToSecs("42:18") → 2538  // stored as Number, not String
```

The main user (Lakshay) is seeded with a **fixed ObjectId** (`60d5ecb8b392d700153c3000`) so the frontend's hardcoded `CURRENT_USER_ID` always resolves correctly.

---

## 🌐 API Reference

| Method | Endpoint | MongoDB Operation |
|--------|----------|-------------------|
| `GET` | `/api/albums` | `Album.find().sort()` |
| `GET` | `/api/albums/:id` | `Album.findById()` |
| `POST` | `/api/albums/:id/review` | `$push`, `$inc`, `$set` |
| `PUT` | `/api/albums/:id/review` | `$` positional, `$set` + aggregation avg |
| `DELETE` | `/api/albums/:id/review` | `$pull`, `$inc` + aggregation avg |
| `GET` | `/api/analytics/top-rated` | `Album.find().sort({ average_rating })` |
| `GET` | `/api/analytics/genre-chart` | `$unwind` → `$group` → `$sort` |
| `GET` | `/api/analytics/trending-genres` | `$unwind` → `$group` → `$sort` |
| `GET` | `/api/analytics/dashboard-stats` | `countDocuments` + `$unwind` + `$group` |
| `GET` | `/api/analytics/artists` | `$group` + `$addToSet` + `$sort` |
| `GET` | `/api/users/:id/profile` | `User.findById()` + review aggregation |
| `GET` | `/api/users/:id/activity` | `$unwind` → `$lookup` → `$project` |
| `GET` | `/api/search?q=` | `$text` index search |

---

## 🛠️ npm Scripts

| Script | What it does |
|--------|-------------|
| `npm run dev` | **Starts backend + frontend together** (use this) |
| `npm run dev:frontend` | Vite dev server only — `http://localhost:5173` |
| `npm run dev:backend` | Express server only — `http://localhost:5000` |
| `npm run seed` | Wipe DB and re-seed all data |
| `npm run build` | Production frontend bundle |

---

## 🔌 Frontend ↔ Backend Connection

Vite's built-in proxy (`vite.config.js`) forwards every `/api/*` request to Express during development — no CORS issues, no hardcoded backend URLs in the frontend:

```js
// vite.config.js
proxy: {
  '/api': { target: 'http://localhost:5000', changeOrigin: true }
}
```

All API calls are centralized in `src/services/api.js`. No page component imports mock data or hardcodes values — everything fetches from the live MongoDB database.

---

## 🧱 Tech Stack

| Layer | Technology |
|-------|-----------|
| Frontend | React 19, Vite 8, Chart.js 4, react-chartjs-2 |
| Backend | Node.js, Express 5, Mongoose 9 |
| Database | MongoDB Atlas (cloud hosted) |
| Dev Tools | concurrently, nodemon, dotenvx |
