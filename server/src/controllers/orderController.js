const db = require('../utils/db');

const borrowPowerbank = (req, res) => {
  const { cabinet_id, user_id } = req.body;
  
  if (!cabinet_id || !user_id) {
    return res.status(400).json({ error: '缺少必要参数' });
  }
  
  try {
    const result = db.borrowPowerbank(cabinet_id, user_id);
    res.json({ success: true, data: result });
  } catch (error) {
    res.status(400).json({ success: false, error: error.message });
  }
};

const returnPowerbank = (req, res) => {
  const { order_id, cabinet_id } = req.body;
  
  if (!order_id || !cabinet_id) {
    return res.status(400).json({ error: '缺少必要参数' });
  }
  
  try {
    const result = db.returnPowerbank(order_id, cabinet_id);
    res.json({ success: true, data: result });
  } catch (error) {
    res.status(400).json({ success: false, error: error.message });
  }
};

const getActiveOrder = (req, res) => {
  const { user_id } = req.params;
  const order = db.getActiveOrderByUserId(user_id);
  res.json(order);
};

const getOrderHistory = (req, res) => {
  const { user_id } = req.params;
  const orders = db.getOrderHistoryByUserId(user_id);
  res.json(orders);
};

module.exports = {
  borrowPowerbank,
  returnPowerbank,
  getActiveOrder,
  getOrderHistory
};
