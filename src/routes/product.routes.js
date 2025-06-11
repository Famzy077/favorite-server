const express = require('express');
const {
  createProduct,
  getAllProducts,
  getProductById,
  updateProduct,
  deleteProduct,
} = require('../controllers/product.controller');
const { verifyToken, verifyAdmin } = require('../middleware/authMiddleware');
const { upload } = require('../middleware/multer.config'); // multer config

const router = express.Router();

// --- Public Routes ---
router.get('/', getAllProducts);
router.get('/:id', getProductById);

// --- Admin-Only Routes ---

router.post('/', verifyToken, verifyAdmin, upload.single('image'), createProduct);
router.put('/:id', verifyToken, verifyAdmin, upload.single('image'), updateProduct);
router.delete('/:id', verifyToken, verifyAdmin, deleteProduct);

module.exports = router;