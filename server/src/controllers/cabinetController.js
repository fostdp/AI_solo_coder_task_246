const db = require('../utils/db');

const getAllCabinets = (req, res) => {
  const cabinets = db.getAllCabinets();
  res.json(cabinets);
};

const getCabinetById = (req, res) => {
  const { id } = req.params;
  const cabinet = db.getCabinetById(id);
  
  if (!cabinet) {
    return res.status(404).json({ error: '柜机不存在' });
  }
  
  res.json(cabinet);
};

const getCabinetSlots = (req, res) => {
  const { id } = req.params;
  const slots = db.getCabinetSlots(id);
  
  if (!slots) {
    return res.status(404).json({ error: '柜机不存在' });
  }
  
  res.json(slots);
};

module.exports = {
  getAllCabinets,
  getCabinetById,
  getCabinetSlots
};
