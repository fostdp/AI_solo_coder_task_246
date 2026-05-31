const db = require('../utils/db');

const createReservation = (req, res) => {
  try {
    const { cabinet_id, user_id, reserve_minutes } = req.body;
    
    if (!cabinet_id || !user_id) {
      return res.status(400).json({ error: '柜机ID和用户ID不能为空' });
    }

    const result = db.createReservation(cabinet_id, user_id, reserve_minutes || 15);
    res.json({ success: true, data: result });
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
};

const cancelReservation = (req, res) => {
  try {
    const { reservation_id } = req.body;
    
    if (!reservation_id) {
      return res.status(400).json({ error: '预约ID不能为空' });
    }

    const result = db.cancelReservation(reservation_id);
    res.json({ success: true, data: result });
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
};

const getActiveReservation = (req, res) => {
  try {
    const { user_id } = req.params;
    const reservation = db.getActiveReservationByUserId(user_id);
    res.json({ success: true, data: reservation });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

module.exports = {
  createReservation,
  cancelReservation,
  getActiveReservation
};
