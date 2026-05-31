const db = require('../utils/db');

const getAllPartners = (req, res) => {
  try {
    const partners = db.getAllPartners();
    res.json({ success: true, data: partners });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

const getPartnerById = (req, res) => {
  try {
    const { id } = req.params;
    const partner = db.getPartnerById(id);
    
    if (!partner) {
      return res.status(404).json({ error: '合作商不存在' });
    }
    
    res.json({ success: true, data: partner });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

const getCabinetsByPartner = (req, res) => {
  try {
    const { partner_id } = req.params;
    const cabinets = db.getCabinetsByPartner(partner_id);
    res.json({ success: true, data: cabinets });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

module.exports = {
  getAllPartners,
  getPartnerById,
  getCabinetsByPartner
};
