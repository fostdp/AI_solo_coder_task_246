const { v4: uuidv4 } = require('uuid');

const state = {
  partners: [],
  cabinets: [],
  powerbanks: [],
  orders: [],
  reservations: [],
  battery_history: [],
  replacement_alerts: []
};

const initialPartners = [
  {
    id: uuidv4(),
    name: '万达商业',
    brand: '万达',
    type: 'shopping_mall',
    contact_person: '张经理',
    contact_phone: '13800138001',
    address: '北京市朝阳区建国路88号',
    status: 'active'
  },
  {
    id: uuidv4(),
    name: '北京地铁集团',
    brand: '地铁',
    type: 'transportation',
    contact_person: '李工',
    contact_phone: '13800138002',
    address: '北京市西城区西直门外大街',
    status: 'active'
  },
  {
    id: uuidv4(),
    name: '星巴克中国',
    brand: '星巴克',
    type: 'cafe',
    contact_person: '王店长',
    contact_phone: '13800138003',
    address: '北京市东城区王府井大街',
    status: 'active'
  },
  {
    id: uuidv4(),
    name: 'CBD物业联盟',
    brand: 'CBD',
    type: 'office',
    contact_person: '赵总',
    contact_phone: '13800138004',
    address: '北京市朝阳区建国门外大街',
    status: 'active'
  }
];

const initialCabinets = [
  {
    id: uuidv4(),
    name: '万达广场柜机',
    address: '万达广场正门入口',
    lat: 39.9140,
    lng: 116.4074,
    total_slots: 12
  },
  {
    id: uuidv4(),
    name: '地铁站A出口柜机',
    address: '地铁1号线王府井站A出口',
    lat: 39.9150,
    lng: 116.4084,
    total_slots: 12
  },
  {
    id: uuidv4(),
    name: '星巴克咖啡柜机',
    address: '王府井步行街星巴克店内',
    lat: 39.9135,
    lng: 116.4068,
    total_slots: 8
  },
  {
    id: uuidv4(),
    name: '写字楼大厅柜机',
    address: '国贸写字楼A座大厅',
    lat: 39.9128,
    lng: 116.4090,
    total_slots: 16
  },
  {
    id: uuidv4(),
    name: '影院入口柜机',
    address: '万达影城3层入口处',
    lat: 39.9160,
    lng: 116.4060,
    total_slots: 10
  },
  {
    id: uuidv4(),
    name: '酒店大堂柜机',
    address: '王府井希尔顿酒店大堂',
    lat: 39.9145,
    lng: 116.4055,
    total_slots: 8
  },
  {
    id: uuidv4(),
    name: '便利店柜机',
    address: '7-ELEVEN便利店路口店',
    lat: 39.9115,
    lng: 116.4070,
    total_slots: 6
  },
  {
    id: uuidv4(),
    name: '购物中心柜机',
    address: '东方新天地地下一层',
    lat: 39.9132,
    lng: 116.4100,
    total_slots: 12
  }
];

const assignPartnerToCabinet = (cabinetName, partners) => {
  if (cabinetName.includes('万达')) return partners[0].id;
  if (cabinetName.includes('地铁')) return partners[1].id;
  if (cabinetName.includes('星巴克')) return partners[2].id;
  if (cabinetName.includes('写字楼')) return partners[3].id;
  if (cabinetName.includes('影院')) return partners[0].id;
  if (cabinetName.includes('酒店')) return partners[0].id;
  if (cabinetName.includes('便利店')) return partners[2].id;
  if (cabinetName.includes('购物中心')) return partners[3].id;
  return partners[0].id;
};

const initializeDatabase = () => {
  if (state.cabinets.length > 0) {
    console.log('数据已存在，跳过初始化');
    return;
  }

  for (const partner of initialPartners) {
    state.partners.push({
      ...partner,
      created_at: new Date().toISOString()
    });
  }

  for (const cabinet of initialCabinets) {
    const partnerId = assignPartnerToCabinet(cabinet.name, state.partners);
    const partner = state.partners.find(p => p.id === partnerId);
    
    state.cabinets.push({
      ...cabinet,
      partner_id: partnerId,
      partner_brand: partner ? partner.brand : null,
      available_slots: 0,
      status: 'online',
      created_at: new Date().toISOString()
    });

    for (let i = 1; i <= cabinet.total_slots; i++) {
      const powerbankId = uuidv4();
      const initialBattery = 70 + Math.floor(Math.random() * 31);
      
      state.powerbanks.push({
        id: powerbankId,
        cabinet_id: state.cabinets[state.cabinets.length - 1].id,
        slot_number: i,
        status: 'available',
        battery_level: initialBattery,
        initial_battery_health: 100,
        current_battery_health: 95 + Math.floor(Math.random() * 5),
        cycle_count: Math.floor(Math.random() * 50),
        created_at: new Date().toISOString()
      });

      state.battery_history.push({
        id: uuidv4(),
        powerbank_id: powerbankId,
        battery_level: initialBattery,
        battery_health: 95 + Math.floor(Math.random() * 5),
        event_type: 'initialize',
        recorded_at: new Date().toISOString()
      });
    }
  }

  console.log(`成功初始化 ${initialPartners.length} 个合作商, ${initialCabinets.length} 个柜机和对应的充电宝`);
};

const getAvailablePowerbanksCount = (cabinetId) => {
  return state.powerbanks.filter(
    p => p.cabinet_id === cabinetId && p.status === 'available'
  ).length;
};

const getEmptySlotsCount = (cabinetId) => {
  const cabinet = state.cabinets.find(c => c.id === cabinetId);
  if (!cabinet) return 0;
  
  const occupiedSlots = state.powerbanks.filter(
    p => p.cabinet_id === cabinetId && p.status === 'available'
  ).length;
  
  return cabinet.total_slots - occupiedSlots;
};

const getAllCabinets = () => {
  return state.cabinets.map(cabinet => {
    const available = getAvailablePowerbanksCount(cabinet.id);
    const emptySlots = getEmptySlotsCount(cabinet.id);
    return { 
      ...cabinet, 
      available_powerbanks: available,
      empty_slots: emptySlots
    };
  });
};

const getCabinetById = (id) => {
  const cabinet = state.cabinets.find(c => c.id === id);
  if (!cabinet) return null;

  const available = getAvailablePowerbanksCount(id);
  const emptySlots = getEmptySlotsCount(id);
  
  const allSlots = [];
  const cabinetPowerbanks = state.powerbanks.filter(p => p.cabinet_id === id && p.status === 'available');
  const occupiedSlotNumbers = new Set(cabinetPowerbanks.map(p => p.slot_number));
  
  for (let i = 1; i <= cabinet.total_slots; i++) {
    const powerbank = cabinetPowerbanks.find(p => p.slot_number === i);
    allSlots.push({
      slot_number: i,
      status: powerbank ? 'available' : 'empty',
      battery_level: powerbank ? powerbank.battery_level : null,
      powerbank_id: powerbank ? powerbank.id : null
    });
  }
  
  return { 
    ...cabinet, 
    available_powerbanks: available,
    empty_slots: emptySlots,
    powerbanks: allSlots
  };
};

const getCabinetSlots = (id) => {
  const cabinet = state.cabinets.find(c => c.id === id);
  if (!cabinet) return null;

  const cabinetPowerbanks = state.powerbanks.filter(p => p.cabinet_id === id && p.status === 'available');
  const allSlots = [];
  
  for (let i = 1; i <= cabinet.total_slots; i++) {
    const powerbank = cabinetPowerbanks.find(p => p.slot_number === i);
    allSlots.push({
      slot_number: i,
      status: powerbank ? 'available' : 'empty',
      battery_level: powerbank ? powerbank.battery_level : null,
      powerbank_id: powerbank ? powerbank.id : null
    });
  }
  
  return allSlots;
};

const getActiveOrderByUserId = (userId) => {
  const order = state.orders.find(o => o.user_id === userId && o.status === 'active');
  if (!order) return null;

  const cabinet = state.cabinets.find(c => c.id === order.cabinet_id);
  const powerbank = state.powerbanks.find(p => p.id === order.powerbank_id);

  return {
    ...order,
    cabinet_name: cabinet ? cabinet.name : null,
    cabinet_address: cabinet ? cabinet.address : null,
    battery_level: powerbank ? powerbank.battery_level : null
  };
};

const getOrderHistoryByUserId = (userId) => {
  return state.orders
    .filter(o => o.user_id === userId)
    .sort((a, b) => new Date(b.borrow_time) - new Date(a.borrow_time))
    .map(order => {
      const cabinet = state.cabinets.find(c => c.id === order.cabinet_id);
      const returnCabinet = order.return_cabinet_id 
        ? state.cabinets.find(c => c.id === order.return_cabinet_id)
        : null;

      return {
        ...order,
        cabinet_name: cabinet ? cabinet.name : null,
        return_cabinet_name: returnCabinet ? returnCabinet.name : null
      };
    });
};

const borrowPowerbank = (cabinetId, userId) => {
  const existingOrder = state.orders.find(
    o => o.user_id === userId && o.status === 'active'
  );
  
  if (existingOrder) {
    throw new Error('您已有正在使用的充电宝，请先归还');
  }

  const availablePowerbanks = state.powerbanks.filter(
    p => p.cabinet_id === cabinetId && p.status === 'available'
  );

  if (availablePowerbanks.length === 0) {
    throw new Error('该柜机暂无可用充电宝');
  }

  availablePowerbanks.sort((a, b) => b.battery_level - a.battery_level);
  const selectedPowerbank = availablePowerbanks[0];

  const cabinet = state.cabinets.find(c => c.id === cabinetId);
  const originalSlot = selectedPowerbank.slot_number;
  
  const borrowTime = new Date().toISOString();
  const orderId = uuidv4();

  selectedPowerbank.status = 'in_use';
  selectedPowerbank.cabinet_id = null;
  selectedPowerbank.slot_number = null;

  const order = {
    id: orderId,
    user_id: userId,
    cabinet_id: cabinetId,
    powerbank_id: selectedPowerbank.id,
    borrow_time: borrowTime,
    return_time: null,
    return_cabinet_id: null,
    duration_minutes: null,
    cost: null,
    status: 'active',
    created_at: new Date().toISOString()
  };

  state.orders.push(order);

  return {
    order_id: orderId,
    powerbank_id: selectedPowerbank.id,
    slot_number: originalSlot,
    battery_level: selectedPowerbank.battery_level,
    borrow_time: borrowTime,
    cabinet_name: cabinet.name,
    cabinet_address: cabinet.address
  };
};

const returnPowerbank = (orderId, cabinetId) => {
  const order = state.orders.find(
    o => o.id === orderId && o.status === 'active'
  );

  if (!order) {
    throw new Error('订单不存在或已归还');
  }

  const powerbank = state.powerbanks.find(p => p.id === order.powerbank_id);
  if (!powerbank) {
    throw new Error('充电宝不存在');
  }

  const targetCabinet = state.cabinets.find(c => c.id === cabinetId);
  if (!targetCabinet) {
    throw new Error('目标柜机不存在');
  }

  const emptySlots = getEmptySlotsCount(cabinetId);
  
  if (emptySlots === 0) {
    throw new Error('该柜机已满，暂无空位');
  }

  const cabinetPowerbanks = state.powerbanks.filter(
    p => p.cabinet_id === cabinetId && p.status === 'available'
  );
  const occupiedSlotNumbers = new Set(cabinetPowerbanks.map(p => p.slot_number));
  
  let emptySlotNumber = null;
  for (let i = 1; i <= targetCabinet.total_slots; i++) {
    if (!occupiedSlotNumbers.has(i)) {
      emptySlotNumber = i;
      break;
    }
  }

  if (emptySlotNumber === null) {
    throw new Error('该柜机已满，暂无空位');
  }

  const returnTime = new Date().toISOString();
  
  const { calculateCost } = require('./pricing');
  const pricingResult = calculateCost(order.borrow_time, returnTime);
  const cost = pricingResult.cost;
  const durationMinutes = pricingResult.duration_minutes;

  powerbank.cabinet_id = cabinetId;
  powerbank.slot_number = emptySlotNumber;
  powerbank.status = 'available';

  const orderIndex = state.orders.findIndex(o => o.id === orderId);
  if (orderIndex !== -1) {
    state.orders[orderIndex] = {
      ...order,
      return_time: returnTime,
      return_cabinet_id: cabinetId,
      duration_minutes: durationMinutes,
      cost: cost,
      cost_breakdown: pricingResult.breakdown,
      status: 'completed'
    };
  }

  powerbank.cycle_count = (powerbank.cycle_count || 0) + 1;
  
  const healthChange = Math.random() * 0.5;
  powerbank.current_battery_health = Math.max(50, powerbank.current_battery_health - healthChange);

  state.battery_history.push({
    id: uuidv4(),
    powerbank_id: powerbank.id,
    battery_level: powerbank.battery_level,
    battery_health: powerbank.current_battery_health,
    event_type: 'return',
    order_id: orderId,
    recorded_at: returnTime
  });

  if (powerbank.current_battery_health < 70) {
    const existingAlert = state.replacement_alerts.find(
      a => a.powerbank_id === powerbank.id && a.status === 'pending'
    );
    if (!existingAlert) {
      state.replacement_alerts.push({
        id: uuidv4(),
        powerbank_id: powerbank.id,
        cabinet_id: cabinetId,
        current_health: powerbank.current_battery_health,
        cycle_count: powerbank.cycle_count,
        status: 'pending',
        created_at: new Date().toISOString()
      });
    }
  }

  return {
    order_id: orderId,
    return_time: returnTime,
    duration_minutes: durationMinutes,
    cost: cost,
    cost_breakdown: pricingResult.breakdown,
    status: 'completed',
    slot_number: emptySlotNumber
  };
};

const createReservation = (cabinetId, userId, reserveTimeMinutes = 15) => {
  const existingReservation = state.reservations.find(
    r => r.user_id === userId && r.status === 'active'
  );
  if (existingReservation) {
    throw new Error('您已有待处理的预约');
  }

  const availablePowerbanks = state.powerbanks.filter(
    p => p.cabinet_id === cabinetId && p.status === 'available'
  );

  if (availablePowerbanks.length === 0) {
    throw new Error('该柜机暂无可用充电宝');
  }

  const reserveUntil = new Date();
  reserveUntil.setMinutes(reserveUntil.getMinutes() + reserveTimeMinutes);

  const reservationId = uuidv4();
  const reservation = {
    id: reservationId,
    user_id: userId,
    cabinet_id: cabinetId,
    status: 'active',
    reserve_until: reserveUntil.toISOString(),
    created_at: new Date().toISOString(),
    expires_at: reserveUntil.toISOString()
  };

  state.reservations.push(reservation);

  const cabinet = state.cabinets.find(c => c.id === cabinetId);

  return {
    reservation_id: reservationId,
    cabinet_id: cabinetId,
    cabinet_name: cabinet ? cabinet.name : null,
    cabinet_address: cabinet ? cabinet.address : null,
    status: 'active',
    reserve_until: reserveUntil.toISOString(),
    expires_in_seconds: reserveTimeMinutes * 60
  };
};

const cancelReservation = (reservationId) => {
  const reservation = state.reservations.find(r => r.id === reservationId);
  if (!reservation) {
    throw new Error('预约不存在');
  }
  if (reservation.status !== 'active') {
    throw new Error('预约已过期或已取消');
  }

  reservation.status = 'cancelled';
  reservation.cancelled_at = new Date().toISOString();

  return {
    reservation_id: reservationId,
    status: 'cancelled'
  };
};

const getActiveReservationByUserId = (userId) => {
  const reservation = state.reservations.find(
    r => r.user_id === userId && r.status === 'active'
  );
  if (!reservation) return null;

  const now = new Date();
  const expiresAt = new Date(reservation.reserve_until);
  
  if (now > expiresAt) {
    reservation.status = 'expired';
    return null;
  }

  const cabinet = state.cabinets.find(c => c.id === reservation.cabinet_id);
  const expiresInSeconds = Math.max(0, Math.floor((expiresAt - now) / 1000));

  return {
    ...reservation,
    cabinet_name: cabinet ? cabinet.name : null,
    cabinet_address: cabinet ? cabinet.address : null,
    expires_in_seconds: expiresInSeconds
  };
};

const getAllPartners = () => {
  return state.partners.map(partner => {
    const partnerCabinets = state.cabinets.filter(c => c.partner_id === partner.id);
    const cabinetCount = partnerCabinets.length;
    const totalSlots = partnerCabinets.reduce((sum, c) => sum + c.total_slots, 0);
    
    return {
      ...partner,
      cabinet_count: cabinetCount,
      total_slots: totalSlots
    };
  });
};

const getPartnerById = (partnerId) => {
  const partner = state.partners.find(p => p.id === partnerId);
  if (!partner) return null;

  const partnerCabinets = state.cabinets.filter(c => c.partner_id === partnerId);
  const cabinetCount = partnerCabinets.length;
  const totalSlots = partnerCabinets.reduce((sum, c) => sum + c.total_slots, 0);
  const availablePowerbanks = state.powerbanks.filter(
    p => p.cabinet_id && partnerCabinets.some(c => c.id === p.cabinet_id) && p.status === 'available'
  ).length;

  return {
    ...partner,
    cabinet_count: cabinetCount,
    total_slots: totalSlots,
    available_powerbanks: availablePowerbanks,
    cabinets: partnerCabinets
  };
};

const getCabinetsByPartner = (partnerId) => {
  return state.cabinets
    .filter(c => c.partner_id === partnerId)
    .map(cabinet => {
      const available = getAvailablePowerbanksCount(cabinet.id);
      const emptySlots = getEmptySlotsCount(cabinet.id);
      return {
        ...cabinet,
        available_powerbanks: available,
        empty_slots: emptySlots
      };
    });
};

const getPowerbankById = (powerbankId) => {
  const powerbank = state.powerbanks.find(p => p.id === powerbankId);
  if (!powerbank) return null;

  const cabinet = state.cabinets.find(c => c.id === powerbank.cabinet_id);
  const history = state.battery_history
    .filter(h => h.powerbank_id === powerbankId)
    .sort((a, b) => new Date(b.recorded_at) - new Date(a.recorded_at))
    .slice(0, 20);

  return {
    ...powerbank,
    cabinet_name: cabinet ? cabinet.name : null,
    cabinet_address: cabinet ? cabinet.address : null,
    partner_brand: cabinet ? cabinet.partner_brand : null,
    history: history
  };
};

const analyzeBatteryHealth = (powerbankId) => {
  const powerbank = state.powerbanks.find(p => p.id === powerbankId);
  if (!powerbank) return null;

  const history = state.battery_history
    .filter(h => h.powerbank_id === powerbankId)
    .sort((a, b) => new Date(a.recorded_at) - new Date(b.recorded_at));

  let healthTrend = 'stable';
  let healthGrade = 'A';
  let estimatedRemainingCycles = 1000;
  let needsReplacement = false;
  let replacementReason = null;

  const currentHealth = powerbank.current_battery_health || 100;
  const cycleCount = powerbank.cycle_count || 0;

  if (history.length >= 2) {
    const oldestHealth = history[0].battery_health;
    const healthDecline = oldestHealth - currentHealth;
    
    if (healthDecline > 20) {
      healthTrend = 'declining_fast';
    } else if (healthDecline > 10) {
      healthTrend = 'declining';
    }
  }

  if (currentHealth >= 85) {
    healthGrade = 'A';
    estimatedRemainingCycles = Math.max(0, 800 - cycleCount);
  } else if (currentHealth >= 70) {
    healthGrade = 'B';
    estimatedRemainingCycles = Math.max(0, 500 - cycleCount);
  } else if (currentHealth >= 50) {
    healthGrade = 'C';
    estimatedRemainingCycles = Math.max(0, 200 - cycleCount);
    needsReplacement = true;
    replacementReason = '电池健康度低于70%';
  } else {
    healthGrade = 'D';
    estimatedRemainingCycles = 0;
    needsReplacement = true;
    replacementReason = '电池健康度过低，需要立即更换';
  }

  if (cycleCount > 800) {
    needsReplacement = true;
    replacementReason = replacementReason || '循环次数超过800次';
  }

  return {
    powerbank_id: powerbankId,
    current_health: currentHealth,
    health_grade: healthGrade,
    health_trend: healthTrend,
    cycle_count: cycleCount,
    estimated_remaining_cycles: estimatedRemainingCycles,
    needs_replacement: needsReplacement,
    replacement_reason: replacementReason,
    history_count: history.length
  };
};

const getReplacementAlerts = (status = 'all') => {
  let alerts = [...state.replacement_alerts];
  
  if (status !== 'all') {
    alerts = alerts.filter(a => a.status === status);
  }

  return alerts.map(alert => {
    const powerbank = state.powerbanks.find(p => p.id === alert.powerbank_id);
    const cabinet = state.cabinets.find(c => c.id === alert.cabinet_id);
    
    return {
      ...alert,
      battery_level: powerbank ? powerbank.battery_level : null,
      cycle_count: powerbank ? powerbank.cycle_count : null,
      cabinet_name: cabinet ? cabinet.name : null,
      cabinet_address: cabinet ? cabinet.address : null,
      partner_brand: cabinet ? cabinet.partner_brand : null
    };
  }).sort((a, b) => new Date(b.created_at) - new Date(a.created_at));
};

const resolveReplacementAlert = (alertId, resolution = 'replaced') => {
  const alert = state.replacement_alerts.find(a => a.id === alertId);
  if (!alert) {
    throw new Error('更换提醒不存在');
  }
  if (alert.status !== 'pending') {
    throw new Error('该提醒已处理');
  }

  alert.status = resolution;
  alert.resolved_at = new Date().toISOString();

  if (resolution === 'replaced') {
    const powerbank = state.powerbanks.find(p => p.id === alert.powerbank_id);
    if (powerbank) {
      powerbank.current_battery_health = 100;
      powerbank.cycle_count = 0;
      powerbank.status = 'available';
      
      state.battery_history.push({
        id: uuidv4(),
        powerbank_id: powerbank.id,
        battery_level: 100,
        battery_health: 100,
        event_type: 'replacement',
        recorded_at: new Date().toISOString()
      });
    }
  }

  return {
    alert_id: alertId,
    status: resolution,
    resolved_at: alert.resolved_at
  };
};

initializeDatabase();

module.exports = {
  getAllCabinets,
  getCabinetById,
  getCabinetSlots,
  getActiveOrderByUserId,
  getOrderHistoryByUserId,
  borrowPowerbank,
  returnPowerbank,
  createReservation,
  cancelReservation,
  getActiveReservationByUserId,
  getAllPartners,
  getPartnerById,
  getCabinetsByPartner,
  getPowerbankById,
  analyzeBatteryHealth,
  getReplacementAlerts,
  resolveReplacementAlert
};
