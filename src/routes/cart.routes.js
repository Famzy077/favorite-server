const express = require('express');
const {
  getCart,
  addItemToCart,
  updateCartItemQuantity,
  removeCartItem,
  clearCart,
} = require('../controllers/cart.controller');
const { verifyToken } = require('../middleware/authMiddleware');

const router = express.Router();

router.use(verifyToken);

router.get('/', getCart);                      // Get the user's cart
router.post('/items', addItemToCart);          // Add an item
router.put('/items/:productId', updateCartItemQuantity); // Update item quantity
router.delete('/items/:productId', removeCartItem); // Remove a specific item
router.delete('/', clearCart);                 // Clear the whole cart

module.exports = router;