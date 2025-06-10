const express = require('express');
const {
  createProduct,
  getAllProducts,
  getProductById,
  updateProduct,
  deleteProduct,
} = require('../controllers/product.controller');
const { verifyToken, verifyAdmin } = require('../middleware/authMiddleware');
const { upload } = require('../middleware/multer.config'); // Your multer config

const router = express.Router();

// --- Public Routes ---
router.get('/', getAllProducts);
router.get('/:id', getProductById);

// --- Admin-Only Routes ---

// The fix is here: changed 'productImage' to 'image'
router.post('/', verifyToken, verifyAdmin, upload.single('image'), createProduct);

// And also here for the update route
router.put('/:id', verifyToken, verifyAdmin, upload.single('image'), updateProduct);

router.delete('/:id', verifyToken, verifyAdmin, deleteProduct);

module.exports = router;