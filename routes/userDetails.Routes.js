const express = require('express');
const {
  createUserDetails,
  getUserDetails,
  updateUserDetails,
  deleteUserDetails
} = require('../controllers/userDetails.Controller');
const { verifyToken } = require('../middleware/authMiddleware');

const router = express.Router();

router.post('/', verifyToken, createUserDetails);      // Create
router.get('/:id', verifyToken, getUserDetails);          // Read
router.put('/:id', verifyToken, updateUserDetails);       // Update
router.delete('/:id', verifyToken, deleteUserDetails);    // Delete

module.exports = router;