const express = require('express');
const {
  upsertUserDetails,
  getUserDetails,
  getAllUsers,
  deleteUserDetails,
} = require('../controllers/userDetails.Controller');
const { verifyToken } = require('../middleware/authMiddleware');

const router = express.Router();

router.post('/', verifyToken, upsertUserDetails); // Create or update (upsert) user
router.get('/me', verifyToken, getUserDetails);  // Read
router.get('/', verifyToken, getAllUsers);    // Read all users
router.delete('/:id', verifyToken, deleteUserDetails);    // Delete

module.exports = router;