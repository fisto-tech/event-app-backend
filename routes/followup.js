const express = require('express');
const router = express.Router();
const { authenticateToken, isAdmin } = require('../middleware/auth');

const {
  getFollowupsByDate,
  getFollowupDetail,
  getFollowupHistory,
  createFollowupLog,
  getAdminMissedFollowups,
} = require('../controllers/FollowupController');

router.use(authenticateToken);

// Main followup page
router.get('/', getFollowupsByDate);

// ADMIN routes FIRST
router.get('/admin/missed', isAdmin, getAdminMissedFollowups);

// Customer routes
router.get('/:id/detail', getFollowupDetail);
router.get('/:id/history', getFollowupHistory);

// Submit log
router.post('/:customer_id/log', createFollowupLog);

module.exports = router;