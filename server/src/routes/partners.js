const express = require('express');
const router = express.Router();
const partnerController = require('../controllers/partnerController');

router.get('/', partnerController.getAllPartners);
router.get('/:id', partnerController.getPartnerById);
router.get('/:partner_id/cabinets', partnerController.getCabinetsByPartner);

module.exports = router;
