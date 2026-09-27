const express = require('express');
const router = express.Router();
const { processQuery, handleKnowledgeQuery, getKnowledgeCatalog } = require('../controllers/queryController');
const { optionalAuth } = require('../middleware/authMiddleware');
const { apiLimiter } = require('../middleware/rateLimiter');

// Primary unified natural-language query endpoint (Data, Knowledge, Hybrid)
router.post('/', apiLimiter, optionalAuth, processQuery);

// Direct RAG knowledge query & catalog endpoints
router.post('/knowledge', apiLimiter, handleKnowledgeQuery);
router.get('/knowledge/sources', apiLimiter, getKnowledgeCatalog);

module.exports = router;
