const express = require('express');
const {
  createOrUpdateUserDetails,
  getUserDetails,
  updateUserDetails,
  deleteUserDetails
} = require('../controllers/userDetails.Controller');
const { verifyToken } = require('../middleware/authMiddleware');

const router = express.Router();

router.post('/', verifyToken, createOrUpdateUserDetails);      // Create
router.get('/:id', verifyToken, getUserDetails);          // Read
router.put('/:id', verifyToken, updateUserDetails);       // Update
router.delete('/:id', verifyToken, deleteUserDetails);    // Delete

module.exports = router;