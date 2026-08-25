const express = require('express');
const router = express.Router();
const { requestHandout, getHandoutStatus } = require('../controllers/handout.controller');
const { requireAuth } = require('../middlewares/auth.middleware');

router.post('/generate', requireAuth, requestHandout);
router.get('/status/:jobId', requireAuth, getHandoutStatus);

module.exports = router;
