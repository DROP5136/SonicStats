const express = require('express');
const router = express.Router();
const albumController = require('../controllers/albumController');

router.get('/', albumController.getAlbums);
router.post('/', albumController.createAlbum);
router.get('/:id', albumController.getAlbumById);

// Reviews
router.post('/:id/review', albumController.addReview);
router.put('/:id/review', albumController.updateReview);
router.delete('/:id/review', albumController.deleteReview);

module.exports = router;
