const express = require('express');
const {
  createProduct,
  getAllProducts,
  getProductById,
  updateProduct,
  deleteProduct,
} = require('../controllers/product.controller');
const { verifyToken, verifyAdmin } = require('../middleware/authMiddleware');
const { upload } = require('../middleware/multer.config');

const router = express.Router();

// --- Public Route (Anyone can view products) ---
router.get('/', getAllProducts); // Get all products
router.get('/:id', getProductById); // Get a single product

// --- Admin-Only Routes (Protected) ---
// Note: verifyAdmin runs after verifyToken, so req.user is available
router.post('/', verifyToken, verifyAdmin, upload.single('productImage'), createProduct);
router.put('/:id', verifyToken, verifyAdmin, upload.single('productImage'), updateProduct);
router.delete('/:id', verifyToken, verifyAdmin, deleteProduct);

module.exports = router;