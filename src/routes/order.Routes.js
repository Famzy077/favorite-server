const express = require('express');
const {
  createOrder,
  getAllOrders,
  getOrderById,
  updateOrderStatus,
} = require('../controllers/order.controller');
const { verifyToken, verifyAdmin } = require('../middleware/authMiddleware');

const router = express.Router();

// Route for a user to create an order
router.post('/', verifyToken, createOrder);

// --- Admin-Only Routes for managing orders ---
router.get('/', verifyToken, verifyAdmin, getAllOrders);
router.get('/:id', verifyToken, verifyAdmin, getOrderById);
router.put('/:id/status', verifyToken, verifyAdmin, updateOrderStatus);

module.exports = router;
