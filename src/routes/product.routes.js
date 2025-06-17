const express = require('express');
const {
  createProduct,
  getAllProducts,
  getProductById,
  updateProduct,
  deleteProduct,
  searchProducts
} = require('../controllers/product.controller');
const { verifyToken, verifyAdmin } = require('../middleware/authMiddleware');
const { upload } = require('../middleware/multer.config');

const router = express.Router();

// --- Public Routes ---

// Add the new search route HERE, before the /:id route.
// This is important because Express will otherwise think "search" is an ID.
router.get('/search', searchProducts);

router.get('/', getAllProducts);       // Get all products
router.get('/:id', getProductById); // Get a single product

// --- Admin-Only Routes (Protected) ---
router.post('/', verifyToken, verifyAdmin, upload.array('images', 5), createProduct);
router.put('/:id', verifyToken, verifyAdmin, upload.array('images', 5), updateProduct);
router.delete('/:id', verifyToken, verifyAdmin, deleteProduct);

module.exports = router;
