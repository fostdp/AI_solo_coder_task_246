const express = require('express');
const router = express.Router();
const batteryController = require('../controllers/batteryController');

router.get('/:id', batteryController.getPowerbankById);
router.get('/:id/health', batteryController.analyzeBatteryHealth);
router.get('/alerts/list', batteryController.getReplacementAlerts);
router.post('/alerts/resolve', batteryController.resolveReplacementAlert);

module.exports = router;
