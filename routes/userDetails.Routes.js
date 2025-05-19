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
router.get('/', verifyToken, getUserDetails);          // Read
router.put('/', verifyToken, updateUserDetails);       // Update
router.delete('/', verifyToken, deleteUserDetails);    // Delete

module.exports = router;