const express = require('express');
const { requestSwitch } = require('../controllers/actor');
const { protect, authorize } = require('../middleware/auth');

const router = express.Router();

router.route('/request-switch')
    .post(protect, authorize('Actor'), requestSwitch);

module.exports = router;