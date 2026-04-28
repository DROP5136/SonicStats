const Album = require('../models/Album');
const User = require('../models/User');

// GET /api/albums
exports.getAlbums = async (req, res) => {
  try {
    const albums = await Album.find().sort({ average_rating: -1 });
    res.json(albums);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

// GET /api/albums/:id
exports.getAlbumById = async (req, res) => {
  try {
    const album = await Album.findById(req.params.id);
    if (!album) return res.status(404).json({ error: 'Album not found' });
    res.json(album);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

// POST /api/albums
exports.createAlbum = async (req, res) => {
  try {
    const album = new Album(req.body);
    await album.save();
    res.status(201).json(album);
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
};

// -----------------------------------
// 2. CRUD + UPDATE OPERATORS (Reviews)
// -----------------------------------

// POST /api/albums/:id/review
exports.addReview = async (req, res) => {
  try {
    const { user_id, rating, review_text } = req.body;
    
    if (rating < 1 || rating > 5) {
      return res.status(400).json({ error: 'Rating must be between 1 and 5' });
    }

    const user = await User.findById(user_id);
    if (!user) return res.status(404).json({ error: 'User not found' });

    // Ensure one review per user per album using validation logic
    const albumCheck = await Album.findOne({
      _id: req.params.id,
      'reviews.user_id': user_id
    });
    
    if (albumCheck) {
      return res.status(400).json({ error: 'User has already reviewed this album' });
    }

    const review = {
      user_id,
      username: user.name,
      rating,
      review_text
    };

    // Demonstrating update operators:
    // $push appends the new review.
    // $inc increments total_ratings.
    // Note: To properly update average_rating, we would need to fetch first, but let's do a simple update
    // We will recalculate average_rating in a post-save or do it simply.
    
    // Calculate new average:
    const album = await Album.findById(req.params.id);
    const newTotal = album.total_ratings + 1;
    const newAverage = ((album.average_rating * album.total_ratings) + rating) / newTotal;

    const updatedAlbum = await Album.findByIdAndUpdate(
      req.params.id,
      {
        $push: { reviews: review },
        $inc: { total_ratings: 1 },
        $set: { average_rating: newAverage }
      },
      { new: true } // Return updated document
    );

    // Track review activity in user's profile
    const newReview = updatedAlbum.reviews[updatedAlbum.reviews.length - 1];
    await User.findByIdAndUpdate(
      user_id,
      {
        $push: {
          review_activity: {
            review_id: newReview._id,
            album_id: req.params.id,
            action: 'created',
            rating,
            review_text
          }
        }
      }
    );

    // Return just the new review object to the frontend
    res.status(201).json(newReview);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

// PUT /api/albums/:id/review
exports.updateReview = async (req, res) => {
  try {
    const { user_id, rating, review_text } = req.body;

    if (rating < 1 || rating > 5) {
      return res.status(400).json({ error: 'Rating must be between 1 and 5' });
    }

    // Recalculate average rating
    // This is more complex since we need the old rating. 
    // In a real scenario, we might use an aggregation pipeline to recalculate average.
    // Let's use the $ positional operator to update the specific nested review.
    const result = await Album.findOneAndUpdate(
      { _id: req.params.id, 'reviews.user_id': user_id },
      {
        $set: {
          'reviews.$.rating': rating,
          'reviews.$.review_text': review_text,
          'reviews.$.created_at': new Date()
        }
      },
      { new: true }
    );

    if (!result) return res.status(404).json({ error: 'Review not found' });

    // Recalculate average using aggregation as an example of 4. AGGREGATION PIPELINES
    const avgCalc = await Album.aggregate([
      { $match: { _id: result._id } },
      { $unwind: '$reviews' },
      { $group: { _id: '$_id', avgRating: { $avg: '$reviews.rating' } } }
    ]);
    
    if (avgCalc.length > 0) {
      result.average_rating = avgCalc[0].avgRating;
      await result.save();
    }

    // Track review activity in user's profile for edit action
    const updatedReview = result.reviews.find(r => r.user_id.toString() === user_id);
    await User.findByIdAndUpdate(
      user_id,
      {
        $push: {
          review_activity: {
            review_id: updatedReview._id,
            album_id: req.params.id,
            action: 'edited',
            rating,
            review_text
          }
        }
      }
    );

    // Return the updated review to frontend
    res.json(updatedReview);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

// DELETE /api/albums/:id/review
exports.deleteReview = async (req, res) => {
  try {
    const { user_id } = req.body; // Usually passed in query or body

    // Demonstrating $pull to remove an item from an array
    const result = await Album.findOneAndUpdate(
      { _id: req.params.id },
      {
        $pull: { reviews: { user_id: user_id } },
        $inc: { total_ratings: -1 }
      },
      { new: true }
    );

    if (!result) return res.status(404).json({ error: 'Album not found' });

    // Recalculate average using aggregation
    const avgCalc = await Album.aggregate([
      { $match: { _id: result._id } },
      { $unwind: '$reviews' },
      { $group: { _id: '$_id', avgRating: { $avg: '$reviews.rating' } } }
    ]);
    
    result.average_rating = avgCalc.length > 0 ? avgCalc[0].avgRating : 0;
    await result.save();

    // Track review activity in user's profile for delete action
    await User.findByIdAndUpdate(
      user_id,
      {
        $push: {
          review_activity: {
            album_id: req.params.id,
            action: 'deleted',
            timestamp: new Date()
          }
        }
      }
    );

    res.json({ message: 'Review deleted successfully' });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};
