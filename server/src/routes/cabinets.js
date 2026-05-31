const express = require('express');
const router = express.Router();
const cabinetController = require('../controllers/cabinetController');

router.get('/', cabinetController.getAllCabinets);
router.get('/:id', cabinetController.getCabinetById);
router.get('/:id/slots', cabinetController.getCabinetSlots);

module.exports = router;
