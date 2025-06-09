const express = require('express');
const router = express.Router();
const { verifyToken } = require('../../middleware/authMiddleware');
const { authorizeRoles } = require('../../middleware/authorize');
const { getAllUsers } = require('../../controllers/admin.Controller');

router.get('/', verifyToken, authorizeRoles('ADMIN'), getAllUsers);

module.exports = router;