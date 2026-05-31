const assert = require('assert');
const { v4: uuidv4 } = require('uuid');

console.log('\n========================================');
console.log('   归还逻辑测试');
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

const createTestDB = () => {
  const state = {
    cabinets: [],
    powerbanks: [],
    orders: []
  };

  const cabinet1 = {
    id: uuidv4(),
    name: '测试柜机1',
    address: '测试地址1',
    lat: 39.9140,
    lng: 116.4074,
    total_slots: 6,
    available_slots: 0,
    created_at: new Date().toISOString()
  };

  const cabinet2 = {
    id: uuidv4(),
    name: '测试柜机2',
    address: '测试地址2',
    lat: 39.9150,
    lng: 116.4084,
    total_slots: 4,
    available_slots: 0,
    created_at: new Date().toISOString()
  };

  state.cabinets.push(cabinet1, cabinet2);

  for (let i = 1; i <= cabinet1.total_slots; i++) {
    state.powerbanks.push({
      id: uuidv4(),
      cabinet_id: cabinet1.id,
      slot_number: i,
      status: 'available',
      battery_level: 70 + i * 5,
      created_at: new Date().toISOString()
    });
  }

  for (let i = 1; i <= cabinet2.total_slots - 1; i++) {
    state.powerbanks.push({
      id: uuidv4(),
      cabinet_id: cabinet2.id,
      slot_number: i,
      status: 'available',
      battery_level: 70 + i * 5,
      created_at: new Date().toISOString()
    });
  }

  return {
    state,
    cabinet1,
    cabinet2
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

const borrowPowerbank = (state, cabinetId, userId) => {
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

  const originalSlot = selectedPowerbank.slot_number;

  selectedPowerbank.status = 'in_use';
  selectedPowerbank.cabinet_id = null;
  selectedPowerbank.slot_number = null;

  const borrowTime = new Date().toISOString();
  const orderId = uuidv4();

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
    battery_level: selectedPowerbank.battery_level
  };
};

const returnPowerbank = (state, orderId, cabinetId) => {
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

  const occupiedSlots = state.powerbanks.filter(
    p => p.cabinet_id === cabinetId && p.status === 'available'
  ).length;

  const emptySlots = targetCabinet.total_slots - occupiedSlots;

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

  powerbank.cabinet_id = cabinetId;
  powerbank.slot_number = emptySlotNumber;
  powerbank.status = 'available';

  const returnTime = new Date().toISOString();
  const orderIndex = state.orders.findIndex(o => o.id === orderId);
  if (orderIndex !== -1) {
    state.orders[orderIndex] = {
      ...order,
      return_time: returnTime,
      return_cabinet_id: cabinetId,
      status: 'completed'
    };
  }

  return {
    order_id: orderId,
    slot_number: emptySlotNumber
  };
};

console.log('\n--- 基本借出和归还测试 ---\n');

test('正常借出充电宝', () => {
  const { state, cabinet1 } = createTestDB();
  const userId = 'test_user_001';

  const result = borrowPowerbank(state, cabinet1.id, userId);

  assert.ok(result.order_id, '应该返回order_id');
  assert.strictEqual(state.orders.length, 1, '应该有1个订单');
  assert.strictEqual(state.orders[0].status, 'active', '订单状态应该是active');
  
  const borrowedPowerbank = state.powerbanks.find(p => p.id === result.powerbank_id);
  assert.strictEqual(borrowedPowerbank.status, 'in_use', '充电宝状态应该是in_use');
  assert.strictEqual(borrowedPowerbank.cabinet_id, null, '借出后cabinet_id应该为null');
});

test('不能同时借出两个充电宝', () => {
  const { state, cabinet1, cabinet2 } = createTestDB();
  const userId = 'test_user_002';

  borrowPowerbank(state, cabinet1.id, userId);

  assert.throws(
    () => borrowPowerbank(state, cabinet2.id, userId),
    /已有正在使用的充电宝/
  );
});

console.log('\n--- 柜满拒绝测试（Bug1修复验证） ---\n');

test('柜满时归还应该被拒绝', () => {
  const { state, cabinet1 } = createTestDB();
  const userId = 'test_user_003';
  const totalSlots = cabinet1.total_slots;

  const borrowResult = borrowPowerbank(state, cabinet1.id, userId);
  
  const cabinetPowerbanks = state.powerbanks.filter(
    p => p.cabinet_id === cabinet1.id && p.status === 'available'
  );
  
  assert.notStrictEqual(cabinetPowerbanks.length, totalSlots, '借出后柜机内充电宝数应减少1');

  for (let i = 1; i <= totalSlots; i++) {
    const pb = {
      id: uuidv4(),
      cabinet_id: cabinet1.id,
      slot_number: cabinetPowerbanks.length + i,
      status: 'available',
      battery_level: 80
    };
    state.powerbanks.push(pb);
  }

  const occupiedAfter = state.powerbanks.filter(
    p => p.cabinet_id === cabinet1.id && p.status === 'available'
  ).length;

  assert.throws(
    () => returnPowerbank(state, borrowResult.order_id, cabinet1.id),
    /该柜机已满/
  );
});

test('柜满后归还到空柜机应该成功', () => {
  const { state, cabinet1, cabinet2 } = createTestDB();
  const userId = 'test_user_004';

  const borrowResult = borrowPowerbank(state, cabinet1.id, userId);

  const cabinetPowerbanks = state.powerbanks.filter(
    p => p.cabinet_id === cabinet1.id && p.status === 'available'
  );
  const totalSlots = cabinet1.total_slots;
  
  for (let i = 1; i <= totalSlots; i++) {
    const pb = {
      id: uuidv4(),
      cabinet_id: cabinet1.id,
      slot_number: cabinetPowerbanks.length + i,
      status: 'available',
      battery_level: 80
    };
    state.powerbanks.push(pb);
  }

  const cabinet2Before = state.powerbanks.filter(
    p => p.cabinet_id === cabinet2.id && p.status === 'available'
  ).length;

  const returnResult = returnPowerbank(state, borrowResult.order_id, cabinet2.id);

  assert.ok(returnResult.slot_number, '应该返回slot_number');

  const returnedPowerbank = state.powerbanks.find(p => p.id === borrowResult.powerbank_id);
  assert.strictEqual(returnedPowerbank.status, 'available', '充电宝状态应该是available');
  assert.strictEqual(returnedPowerbank.cabinet_id, cabinet2.id, '应该归还到cabinet2');
  assert.strictEqual(state.orders[0].status, 'completed', '订单状态应该是completed');
});

console.log('\n--- 槽位分配测试 ---\n');

test('归还应该分配第一个空槽位', () => {
  const { state, cabinet1 } = createTestDB();
  const userId = 'test_user_005';

  const borrowResult = borrowPowerbank(state, cabinet1.id, userId);
  const returnResult = returnPowerbank(state, borrowResult.order_id, cabinet1.id);

  assert.strictEqual(returnResult.slot_number, borrowResult.slot_number, '应该归还到原来的槽位（因为它空了）');
});

test('归还应该分配最小的空槽位', () => {
  const { state, cabinet1 } = createTestDB();
  const userId1 = 'test_user_006';
  const userId2 = 'test_user_007';

  const result1 = borrowPowerbank(state, cabinet1.id, userId1);
  const result2 = borrowPowerbank(state, cabinet1.id, userId2);

  const slot1 = result1.slot_number;
  const slot2 = result2.slot_number;
  const minSlot = Math.min(slot1, slot2);
  const maxSlot = Math.max(slot1, slot2);

  const returnResult1 = returnPowerbank(state, result1.order_id, cabinet1.id);
  assert.strictEqual(returnResult1.slot_number, minSlot, '第一个归还应该分配最小的空槽位');

  const returnResult2 = returnPowerbank(state, result2.order_id, cabinet1.id);
  assert.strictEqual(returnResult2.slot_number, maxSlot, '第二个归还应该分配下一个最小的空槽位');
});

console.log('\n--- 跨柜归还测试 ---\n');

test('从柜机1借出，柜机2归还', () => {
  const { state, cabinet1, cabinet2 } = createTestDB();
  const userId = 'test_user_008';

  const borrowResult = borrowPowerbank(state, cabinet1.id, userId);

  const cabinet1Before = state.powerbanks.filter(
    p => p.cabinet_id === cabinet1.id && p.status === 'available'
  ).length;
  const cabinet2Before = state.powerbanks.filter(
    p => p.cabinet_id === cabinet2.id && p.status === 'available'
  ).length;

  const returnResult = returnPowerbank(state, borrowResult.order_id, cabinet2.id);

  const cabinet1After = state.powerbanks.filter(
    p => p.cabinet_id === cabinet1.id && p.status === 'available'
  ).length;
  const cabinet2After = state.powerbanks.filter(
    p => p.cabinet_id === cabinet2.id && p.status === 'available'
  ).length;

  assert.strictEqual(cabinet1After, cabinet1Before, '柜机1的充电宝数应该不变');
  assert.strictEqual(cabinet2After, cabinet2Before + 1, '柜机2的充电宝数应该增加1');
});

console.log('\n--- 订单状态测试 ---\n');

test('归还后订单应该更新订单信息', () => {
  const { state, cabinet1 } = createTestDB();
  const userId = 'test_user_009';

  const borrowResult = borrowPowerbank(state, cabinet1.id, userId);
  returnPowerbank(state, borrowResult.order_id, cabinet1.id);

  const order = state.orders.find(o => o.id === borrowResult.order_id);
  
  assert.strictEqual(order.status, 'completed', '订单状态应该是completed');
  assert.ok(order.return_time, '应该有return_time');
  assert.strictEqual(order.return_cabinet_id, cabinet1.id, '应该记录归还柜机ID');
});

test('不能归还已完成的订单', () => {
  const { state, cabinet1 } = createTestDB();
  const userId = 'test_user_010';

  const borrowResult = borrowPowerbank(state, cabinet1.id, userId);
  returnPowerbank(state, borrowResult.order_id, cabinet1.id);

  assert.throws(
    () => returnPowerbank(state, borrowResult.order_id, cabinet1.id),
    /订单不存在或已归还/
  );
});

console.log('\n--- 空柜机不能借出 ---\n');

test('空柜机不能借出', () => {
  const { state, cabinet1 } = createTestDB();
  const userId = 'test_user_011';

  const powerbanksInCabinet = state.powerbanks.filter(
    p => p.cabinet_id === cabinet1.id
  );
  
  for (const pb of powerbanksInCabinet) {
    pb.status = 'in_use';
    pb.cabinet_id = null;
    pb.slot_number = null;
  }

  assert.throws(
    () => borrowPowerbank(state, cabinet1.id, userId),
    /该柜机暂无可用充电宝/
  );
});

console.log('\n========================================');
console.log(`测试完成: ${passed} 通过, ${failed} 失败`);
console.log('========================================\n');

process.exit(failed > 0 ? 1 : 0);
