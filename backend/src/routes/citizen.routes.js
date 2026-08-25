const express = require('express');
const router = express.Router();
const { getHistory } = require('../controllers/citizen.controller');
const { requireAuth } = require('../middlewares/auth.middleware');

router.get('/history', requireAuth, getHistory);

module.exports = router;
