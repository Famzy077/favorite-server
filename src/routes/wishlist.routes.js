const express = require('express');
const { getWishlist, addToWishlist, removeFromWishlist } = require('../controllers/wishlist.controller');
const { verifyToken } = require('../middleware/authMiddleware');

const router = express.Router();

// All wishlist routes require a logged-in user
router.use(verifyToken);

router.get('/', getWishlist);
router.post('/', addToWishlist);
router.delete('/:productId', removeFromWishlist);

module.exports = router;