const express = require('express');
const router = express.Router();
const { checkEligibility } = require('../controllers/eligibility.controller');
const { validateEligibilityCheck } = require('../validators/eligibility.validator');
const { optionalAuth } = require('../middlewares/auth.middleware');

router.post('/check', optionalAuth, validateEligibilityCheck, checkEligibility);

module.exports = router;
