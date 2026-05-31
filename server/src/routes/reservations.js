const express = require('express');
const router = express.Router();
const reservationController = require('../controllers/reservationController');

router.post('/create', reservationController.createReservation);
router.post('/cancel', reservationController.cancelReservation);
router.get('/active/:user_id', reservationController.getActiveReservation);

module.exports = router;
