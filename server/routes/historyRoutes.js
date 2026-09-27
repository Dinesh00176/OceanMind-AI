const express = require('express');
const router = express.Router();
const { getHistory, deleteHistoryItem, clearHistory } = require('../controllers/historyController');
const { protect } = require('../middleware/authMiddleware');

router.get('/', protect, getHistory);
router.delete('/:id', protect, deleteHistoryItem);
router.delete('/', protect, clearHistory);

module.exports = router;
