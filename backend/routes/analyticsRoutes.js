const express = require('express');
const router = express.Router();
const analyticsController = require('../controllers/analyticsController');

router.get('/top-rated', analyticsController.getTopRatedAlbums);
router.get('/user-top-rated', analyticsController.getUserTopRatedAlbums);
router.get('/trending-genres', analyticsController.getTrendingGenres);
router.get('/active-users', analyticsController.getActiveUsers);
router.get('/genre-chart', analyticsController.getGenreChartData);
router.get('/dashboard-stats', analyticsController.getDashboardStats);
router.get('/artists', analyticsController.getArtists);

module.exports = router;
