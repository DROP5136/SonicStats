const Album = require('../models/Album');

// GET /api/search?q=keyword
// 6. SEARCH FUNCTIONALITY (MongoDB text search)
exports.searchAlbums = async (req, res) => {
  try {
    const { q } = req.query;
    
    if (!q) {
      return res.status(400).json({ error: 'Search query is required' });
    }

    // Use $text for text search and sort by the meta textScore
    const results = await Album.find(
      { $text: { $search: q } },
      { score: { $meta: 'textScore' } }
    ).sort({ score: { $meta: 'textScore' } });

    res.json(results);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};
