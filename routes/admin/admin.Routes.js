const express = require('express');
const router = express.Router();
const {verifyToken} = require('../../middleware/authMiddleware.js');
const { authorizeRoles } = require('../../middleware/authorize.js');

router.get('/users', verifyToken, authorizeRoles('admin'), (req, res) => {
  res.json({ message: 'This is only for admins!' });
});

module.exports = router;