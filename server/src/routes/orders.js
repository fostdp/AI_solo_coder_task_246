const express = require('express');
const router = express.Router();
const orderController = require('../controllers/orderController');

router.post('/borrow', orderController.borrowPowerbank);
router.post('/return', orderController.returnPowerbank);
router.get('/active/:user_id', orderController.getActiveOrder);
router.get('/history/:user_id', orderController.getOrderHistory);

module.exports = router;
