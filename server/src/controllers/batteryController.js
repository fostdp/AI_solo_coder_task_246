const db = require('../utils/db');

const getPowerbankById = (req, res) => {
  try {
    const { id } = req.params;
    const powerbank = db.getPowerbankById(id);
    
    if (!powerbank) {
      return res.status(404).json({ error: '充电宝不存在' });
    }
    
    res.json({ success: true, data: powerbank });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

const analyzeBatteryHealth = (req, res) => {
  try {
    const { id } = req.params;
    const analysis = db.analyzeBatteryHealth(id);
    
    if (!analysis) {
      return res.status(404).json({ error: '充电宝不存在' });
    }
    
    res.json({ success: true, data: analysis });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

const getReplacementAlerts = (req, res) => {
  try {
    const { status } = req.query;
    const alerts = db.getReplacementAlerts(status || 'all');
    res.json({ success: true, data: alerts });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

const resolveReplacementAlert = (req, res) => {
  try {
    const { alert_id, resolution } = req.body;
    
    if (!alert_id) {
      return res.status(400).json({ error: '提醒ID不能为空' });
    }

    const result = db.resolveReplacementAlert(alert_id, resolution || 'replaced');
    res.json({ success: true, data: result });
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
};

module.exports = {
  getPowerbankById,
  analyzeBatteryHealth,
  getReplacementAlerts,
  resolveReplacementAlert
};
