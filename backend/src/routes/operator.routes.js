const express = require('express');
const router = express.Router();
const { getTelemetry } = require('../controllers/operator.controller');
const { requireAuth, requireOperator } = require('../middlewares/auth.middleware');

router.get('/telemetry', requireAuth, requireOperator, getTelemetry);

module.exports = router;
