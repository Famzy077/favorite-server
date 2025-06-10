// In src/routes/admin.routes.js

const express = require('express');
const { 
    getAllUsers,
    toggleUserBlockStatus,
    getDashboardStats } = require('../../controllers/admin.Controller');
const { verifyToken, verifyAdmin } = require('../../middleware/authMiddleware');

const router = express.Router();

// Apply verifyToken and verifyAdmin middleware to all routes in this file
router.use(verifyToken, verifyAdmin);

// --- Routes ---

// GET /api/admin/stats -> Fetches stats for the overview cards
router.get('/stats', getDashboardStats);

// GET /api/admin/users -> Fetches the list of all users
router.get('/users', getAllUsers);

// PUT /api/admin/users/:id/toggle-block -> Blocks or unblocks a specific user
router.put('/users/:id/toggle-block', toggleUserBlockStatus);

module.exports = router;