const express = require('express');
const router = express.Router();
const { getMetadata, searchProfiles, getFloatTracks } = require('../controllers/dataController');
const { apiLimiter } = require('../middleware/rateLimiter');

router.get('/metadata', apiLimiter, getMetadata);
router.post('/search', apiLimiter, searchProfiles);
router.get('/floats', apiLimiter, getFloatTracks);

module.exports = router;
