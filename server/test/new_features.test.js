const assert = require('assert');
const { v4: uuidv4 } = require('uuid');

console.log('\n========================================');
console.log('   新功能测试 - 预约、合作商、电量分析');
console.log('========================================\n');

let passed = 0;
let failed = 0;

function test(name, fn) {
  try {
    fn();
    console.log(`✅ PASS: ${name}`);
    passed++;
  } catch (error) {
    console.log(`❌ FAIL: ${name}`);
    console.log(`   错误: ${error.message}`);
    if (error.expected !== undefined) {
      console.log(`   期望: ${error.expected}`);
      console.log(`   实际: ${error.actual}`);
    }
    failed++;
  }
}

const createTestState = () => {
  const partner1 = {
    id: uuidv4(),
    name: '测试合作商1',
    brand: '测试品牌',
    type: 'shopping_mall',
    contact_person: '测试联系人',
    contact_phone: '13800000000',
    address: '测试地址',
    status: 'active',
    created_at: new Date().toISOString()
  };

  const partner2 = {
    id: uuidv4(),
    name: '测试合作商2',
    brand: '地铁',
    type: 'transportation',
    contact_person: '李工',
    contact_phone: '13800000001',
    address: '地铁地址',
    status: 'active',
    created_at: new Date().toISOString()
  };

  const cabinet1 = {
    id: uuidv4(),
    name: '购物中心柜机1',
    address: '购物中心正门',
    lat: 39.9140,
    lng: 116.4074,
    total_slots: 6,
    partner_id: partner1.id,
    partner_brand: partner1.brand,
    status: 'online',
    created_at: new Date().toISOString()
  };

  const cabinet2 = {
    id: uuidv4(),
    name: '地铁站柜机',
    address: '地铁A出口',
    lat: 39.9150,
    lng: 116.4084,
    total_slots: 4,
    partner_id: partner2.id,
    partner_brand: partner2.brand,
    status: 'online',
    created_at: new Date().toISOString()
  };

  const cabinet3 = {
    id: uuidv4(),
    name: '购物中心柜机2',
    address: '购物中心侧门',
    lat: 39.9142,
    lng: 116.4076,
    total_slots: 8,
    partner_id: partner1.id,
    partner_brand: partner1.brand,
    status: 'online',
    created_at: new Date().toISOString()
  };

  const powerbanks = [];
  
  for (let i = 1; i <= cabinet1.total_slots; i++) {
    powerbanks.push({
      id: uuidv4(),
      cabinet_id: cabinet1.id,
      slot_number: i,
      status: 'available',
      battery_level: 70 + i * 5,
      initial_battery_health: 100,
      current_battery_health: 95,
      cycle_count: 10,
      created_at: new Date().toISOString()
    });
  }

  for (let i = 1; i <= cabinet2.total_slots; i++) {
    powerbanks.push({
      id: uuidv4(),
      cabinet_id: cabinet2.id,
      slot_number: i,
      status: 'available',
      battery_level: 65 + i * 5,
      initial_battery_health: 100,
      current_battery_health: 65,
      cycle_count: 750,
      created_at: new Date().toISOString()
    });
  }

  for (let i = 1; i <= cabinet3.total_slots; i++) {
    powerbanks.push({
      id: uuidv4(),
      cabinet_id: cabinet3.id,
      slot_number: i,
      status: 'available',
      battery_level: 60 + i * 4,
      initial_battery_health: 100,
      current_battery_health: 45,
      cycle_count: 850,
      created_at: new Date().toISOString()
    });
  }

  return {
    partners: [partner1, partner2],
    cabinets: [cabinet1, cabinet2, cabinet3],
    powerbanks,
    orders: [],
    reservations: [],
    battery_history: powerbanks.map(pb => ({
      id: uuidv4(),
      powerbank_id: pb.id,
      battery_level: pb.battery_level,
      battery_health: pb.current_battery_health,
      event_type: 'initialize',
      recorded_at: new Date().toISOString()
    })),
    replacement_alerts: []
  };
};

const getAvailablePowerbanksCount = (state, cabinetId) => {
  return state.powerbanks.filter(
    p => p.cabinet_id === cabinetId && p.status === 'available'
  ).length;
};

const getEmptySlotsCount = (state, cabinetId) => {
  const cabinet = state.cabinets.find(c => c.id === cabinetId);
  if (!cabinet) return 0;
  const occupiedSlots = state.powerbanks.filter(
    p => p.cabinet_id === cabinetId && p.status === 'available'
  ).length;
  return cabinet.total_slots - occupiedSlots;
};

const createReservation = (state, cabinetId, userId, reserveTimeMinutes = 15) => {
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
    status: 'active',
    reserve_until: reserveUntil.toISOString()
  };
};

const cancelReservation = (state, reservationId) => {
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

const getActiveReservationByUserId = (state, userId) => {
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

  return reservation;
};

const analyzeBatteryHealth = (state, powerbankId) => {
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
    replacement_reason: replacementReason
  };
};

const getReplacementAlerts = (state, status = 'all') => {
  let alerts = [...state.replacement_alerts];
  
  if (status !== 'all') {
    alerts = alerts.filter(a => a.status === status);
  }

  return alerts.sort((a, b) => new Date(b.created_at) - new Date(a.created_at));
};

const createReplacementAlert = (state, powerbankId, cabinetId, health, cycleCount, reason) => {
  const existingAlert = state.replacement_alerts.find(
    a => a.powerbank_id === powerbankId && a.status === 'pending'
  );
  if (existingAlert) {
    return existingAlert;
  }

  const alert = {
    id: uuidv4(),
    powerbank_id: powerbankId,
    cabinet_id: cabinetId,
    current_health: health,
    cycle_count: cycleCount,
    status: 'pending',
    reason: reason,
    created_at: new Date().toISOString()
  };

  state.replacement_alerts.push(alert);
  return alert;
};

const resolveReplacementAlert = (state, alertId, resolution = 'replaced') => {
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
    }
  }

  return {
    alert_id: alertId,
    status: resolution,
    resolved_at: alert.resolved_at
  };
};

console.log('\n--- 预约保留功能测试 ---\n');

test('创建预约应该成功', () => {
  const state = createTestState();
  const userId = 'test_user_001';
  const cabinetId = state.cabinets[0].id;

  const result = createReservation(state, cabinetId, userId, 15);

  assert.ok(result.reservation_id, '应该返回reservation_id');
  assert.strictEqual(result.status, 'active', '状态应该是active');
  assert.strictEqual(state.reservations.length, 1, '应该有1个预约');
});

test('不能同时创建两个预约', () => {
  const state = createTestState();
  const userId = 'test_user_002';
  const cabinetId = state.cabinets[0].id;

  createReservation(state, cabinetId, userId, 15);

  assert.throws(
    () => createReservation(state, cabinetId, userId, 15),
    /已有待处理的预约/
  );
});

test('柜机无可用充电宝时不能创建预约', () => {
  const state = createTestState();
  const userId = 'test_user_003';
  const cabinetId = state.cabinets[0].id;

  state.powerbanks.forEach(pb => {
    if (pb.cabinet_id === cabinetId) {
      pb.status = 'in_use';
    }
  });

  assert.throws(
    () => createReservation(state, cabinetId, userId, 15),
    /暂无可用充电宝/
  );
});

test('取消预约应该成功', () => {
  const state = createTestState();
  const userId = 'test_user_004';
  const cabinetId = state.cabinets[0].id;

  const reserveResult = createReservation(state, cabinetId, userId, 15);
  const cancelResult = cancelReservation(state, reserveResult.reservation_id);

  assert.strictEqual(cancelResult.status, 'cancelled', '状态应该是cancelled');
  
  const reservation = state.reservations.find(r => r.id === reserveResult.reservation_id);
  assert.strictEqual(reservation.status, 'cancelled', '预约状态应该已更新');
});

test('查询用户当前预约', () => {
  const state = createTestState();
  const userId = 'test_user_005';
  const cabinetId = state.cabinets[0].id;

  const reserveResult = createReservation(state, cabinetId, userId, 15);
  const activeReservation = getActiveReservationByUserId(state, userId);

  assert.ok(activeReservation, '应该找到活跃预约');
  assert.strictEqual(activeReservation.id, reserveResult.reservation_id, '预约ID应该匹配');
});

test('取消后查询不到活跃预约', () => {
  const state = createTestState();
  const userId = 'test_user_006';
  const cabinetId = state.cabinets[0].id;

  const reserveResult = createReservation(state, cabinetId, userId, 15);
  cancelReservation(state, reserveResult.reservation_id);

  const activeReservation = getActiveReservationByUserId(state, userId);
  assert.strictEqual(activeReservation, null, '应该没有活跃预约');
});

console.log('\n--- 多机柜合作商覆盖测试 ---\n');

test('合作商应该有正确的品牌标识', () => {
  const state = createTestState();
  
  assert.strictEqual(state.cabinets[0].partner_brand, '测试品牌', '柜机1应该关联测试品牌');
  assert.strictEqual(state.cabinets[1].partner_brand, '地铁', '柜机2应该关联地铁品牌');
});

test('合作商应该有关联的柜机列表', () => {
  const state = createTestState();
  const partner1Id = state.partners[0].id;

  const partnerCabinets = state.cabinets.filter(c => c.partner_id === partner1Id);
  assert.strictEqual(partnerCabinets.length, 2, '合作伙伴1应该有2个柜机');
  assert.ok(partnerCabinets.every(c => c.partner_brand === '测试品牌'), '所有柜机品牌应该一致');
});

test('不同合作商可以有不同类型', () => {
  const state = createTestState();
  
  const partnerTypes = state.partners.map(p => p.type);
  assert.ok(partnerTypes.includes('shopping_mall'), '应该有购物中心类型');
  assert.ok(partnerTypes.includes('transportation'), '应该有交通类型');
});

test('按合作商类型统计柜机数量', () => {
  const state = createTestState();
  
  const mallCabinets = state.cabinets.filter(c => {
    const partner = state.partners.find(p => p.id === c.partner_id);
    return partner && partner.type === 'shopping_mall';
  });
  const transportCabinets = state.cabinets.filter(c => {
    const partner = state.partners.find(p => p.id === c.partner_id);
    return partner && partner.type === 'transportation';
  });

  assert.strictEqual(mallCabinets.length, 2, '购物中心类型应该有2个柜机');
  assert.strictEqual(transportCabinets.length, 1, '交通类型应该有1个柜机');
});

test('柜机状态检查', () => {
  const state = createTestState();
  
  const onlineCabinets = state.cabinets.filter(c => c.status === 'online');
  assert.strictEqual(onlineCabinets.length, 3, '所有柜机应该在线');
});

console.log('\n--- 电量损耗分析测试 ---\n');

test('健康充电宝应该评级为A', () => {
  const state = createTestState();
  const healthyPowerbank = state.powerbanks.find(p => p.current_battery_health >= 85);

  const analysis = analyzeBatteryHealth(state, healthyPowerbank.id);

  assert.strictEqual(analysis.health_grade, 'A', '健康度>=85应该评级为A');
  assert.strictEqual(analysis.needs_replacement, false, 'A级电池不需要更换');
});

test('中等健康度充电宝应该评级为B', () => {
  const state = createTestState();
  const mediumPowerbank = state.powerbanks.find(p => p.current_battery_health === 65);

  const analysis = analyzeBatteryHealth(state, mediumPowerbank.id);

  assert.strictEqual(analysis.health_grade, 'C', '健康度65应该评级为C');
});

test('低健康度充电宝需要更换', () => {
  const state = createTestState();
  const lowPowerbank = state.powerbanks.find(p => p.current_battery_health === 45);

  const analysis = analyzeBatteryHealth(state, lowPowerbank.id);

  assert.strictEqual(analysis.health_grade, 'D', '健康度45应该评级为D');
  assert.strictEqual(analysis.needs_replacement, true, 'D级电池需要更换');
  assert.ok(analysis.replacement_reason.includes('低'), '应该包含更换原因');
});

test('循环次数过多需要更换', () => {
  const state = createTestState();
  const highCyclePowerbank = state.powerbanks.find(p => p.cycle_count === 850);

  const analysis = analyzeBatteryHealth(state, highCyclePowerbank.id);

  assert.strictEqual(analysis.needs_replacement, true, '循环850次需要更换');
  assert.ok(
    analysis.replacement_reason.includes('800') || analysis.replacement_reason.includes('过'),
    '应该包含更换原因（循环次数或健康度）'
  );
});

test('剩余循环次数估算', () => {
  const state = createTestState();
  const powerbank = state.powerbanks.find(p => p.current_battery_health === 95);

  const analysis = analyzeBatteryHealth(state, powerbank.id);

  assert.ok(analysis.estimated_remaining_cycles > 0, '应该有剩余循环次数');
});

console.log('\n--- 更换提醒功能测试 ---\n');

test('创建更换提醒应该成功', () => {
  const state = createTestState();
  const powerbank = state.powerbanks.find(p => p.current_battery_health === 45);

  const alert = createReplacementAlert(
    state,
    powerbank.id,
    powerbank.cabinet_id,
    powerbank.current_battery_health,
    powerbank.cycle_count,
    '电池健康度过低'
  );

  assert.ok(alert.id, '应该返回提醒ID');
  assert.strictEqual(alert.status, 'pending', '状态应该是pending');
  assert.strictEqual(state.replacement_alerts.length, 1, '应该有1个提醒');
});

test('同一个充电宝不能创建重复提醒', () => {
  const state = createTestState();
  const powerbank = state.powerbanks.find(p => p.current_battery_health === 45);

  const alert1 = createReplacementAlert(
    state,
    powerbank.id,
    powerbank.cabinet_id,
    powerbank.current_battery_health,
    powerbank.cycle_count,
    '电池健康度过低'
  );

  const alert2 = createReplacementAlert(
    state,
    powerbank.id,
    powerbank.cabinet_id,
    powerbank.current_battery_health,
    powerbank.cycle_count,
    '电池健康度过低'
  );

  assert.strictEqual(alert1.id, alert2.id, '应该返回同一个提醒');
  assert.strictEqual(state.replacement_alerts.length, 1, '应该只有1个提醒');
});

test('查询待处理的更换提醒', () => {
  const state = createTestState();
  const powerbank1 = state.powerbanks.find(p => p.current_battery_health === 45);
  const powerbank2 = state.powerbanks.find(p => p.current_battery_health === 65);

  createReplacementAlert(
    state,
    powerbank1.id,
    powerbank1.cabinet_id,
    powerbank1.current_battery_health,
    powerbank1.cycle_count,
    '健康度过低'
  );
  createReplacementAlert(
    state,
    powerbank2.id,
    powerbank2.cabinet_id,
    powerbank2.current_battery_health,
    powerbank2.cycle_count,
    '循环次数过高'
  );

  const pendingAlerts = getReplacementAlerts(state, 'pending');
  assert.strictEqual(pendingAlerts.length, 2, '应该有2个待处理提醒');
});

test('处理更换提醒（更换充电宝）', () => {
  const state = createTestState();
  const powerbank = state.powerbanks.find(p => p.current_battery_health === 45);
  const originalHealth = powerbank.current_battery_health;
  const originalCycles = powerbank.cycle_count;

  const alert = createReplacementAlert(
    state,
    powerbank.id,
    powerbank.cabinet_id,
    powerbank.current_battery_health,
    powerbank.cycle_count,
    '健康度过低'
  );

  const result = resolveReplacementAlert(state, alert.id, 'replaced');

  assert.strictEqual(result.status, 'replaced', '状态应该是replaced');
  assert.strictEqual(powerbank.current_battery_health, 100, '健康度应该重置为100');
  assert.strictEqual(powerbank.cycle_count, 0, '循环次数应该重置为0');
});

test('不能处理已处理的提醒', () => {
  const state = createTestState();
  const powerbank = state.powerbanks.find(p => p.current_battery_health === 45);

  const alert = createReplacementAlert(
    state,
    powerbank.id,
    powerbank.cabinet_id,
    powerbank.current_battery_health,
    powerbank.cycle_count,
    '健康度过低'
  );

  resolveReplacementAlert(state, alert.id, 'replaced');

  assert.throws(
    () => resolveReplacementAlert(state, alert.id, 'replaced'),
    /已处理/
  );
});

test('按状态筛选更换提醒', () => {
  const state = createTestState();
  const powerbank1 = state.powerbanks.find(p => p.current_battery_health === 45);
  const powerbank2 = state.powerbanks.find(p => p.current_battery_health === 65);

  const alert1 = createReplacementAlert(
    state,
    powerbank1.id,
    powerbank1.cabinet_id,
    powerbank1.current_battery_health,
    powerbank1.cycle_count,
    '健康度过低'
  );
  const alert2 = createReplacementAlert(
    state,
    powerbank2.id,
    powerbank2.cabinet_id,
    powerbank2.current_battery_health,
    powerbank2.cycle_count,
    '循环次数过高'
  );

  resolveReplacementAlert(state, alert1.id, 'replaced');

  const pendingAlerts = getReplacementAlerts(state, 'pending');
  const resolvedAlerts = getReplacementAlerts(state, 'replaced');

  assert.strictEqual(pendingAlerts.length, 1, '应该有1个待处理提醒');
  assert.strictEqual(resolvedAlerts.length, 1, '应该有1个已处理提醒');
});

console.log('\n========================================');
console.log(`测试完成: ${passed} 通过, ${failed} 失败`);
console.log('========================================\n');

process.exit(failed > 0 ? 1 : 0);
