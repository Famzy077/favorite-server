const express = require('express');
const {
  upsertUserDetails,
  getUserDetails,
  getAllUsers,
  deleteUserDetails,
} = require('../controllers/userDetails.Controller');
const { testAuth } = require('./test-auth'); 
const { verifyToken } = require('../middleware/authMiddleware');

const router = express.Router();

router.post('/', verifyToken, upsertUserDetails); // Create or update (upsert) user
router.get('/:id', verifyToken, getUserDetails);          // Read
router.get('/', verifyToken, getAllUsers);    // Update
router.delete('/:id', verifyToken, deleteUserDetails);    // Delete

router.post('/test', verifyToken, testAuth)

module.exports = router;