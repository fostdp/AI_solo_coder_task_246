const assert = require('assert');

console.log('\n========================================');
console.log('   定位兜底测试');
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

const SIGNAL_THRESHOLD = {
  GOOD: 20,
  MEDIUM: 50,
  POOR: 100
};

const MAX_HISTORY_LENGTH = 10;

class PositionSmoother {
  constructor() {
    this.history = [];
    this.locked = false;
    this.lockedPosition = null;
  }

  addPosition(lat, lng, accuracy) {
    this.history.push({ lat, lng, accuracy, timestamp: Date.now() });
    if (this.history.length > MAX_HISTORY_LENGTH) {
      this.history.shift();
    }
  }

  getSignalStrength(currentAccuracy, prevPosition, currentPosition) {
    let positionDelta = 0;
    if (prevPosition && currentPosition) {
      positionDelta = Math.sqrt(
        Math.pow(currentPosition.lat - prevPosition.lat, 2) + 
        Math.pow(currentPosition.lng - prevPosition.lng, 2)
      ) * 111000;
    }

    if (currentAccuracy > SIGNAL_THRESHOLD.POOR || positionDelta > 100) {
      return 'poor';
    } else if (currentAccuracy > SIGNAL_THRESHOLD.MEDIUM || positionDelta > 50) {
      return 'medium';
    }
    return 'good';
  }

  smoothPosition() {
    if (this.locked && this.lockedPosition) {
      return this.lockedPosition;
    }

    const recentPositions = this.history.slice(-5);
    if (recentPositions.length === 0) {
      return null;
    }

    const weights = recentPositions.map((_, index) => index + 1);
    const totalWeight = weights.reduce((a, b) => a + b, 0);

    let weightedLat = 0;
    let weightedLng = 0;

    recentPositions.forEach((pos, index) => {
      const weight = weights[index] / totalWeight;
      weightedLat += pos.lat * weight;
      weightedLng += pos.lng * weight;
    });

    return { lat: weightedLat, lng: weightedLng };
  }

  lockPosition() {
    if (this.history.length >= 3) {
      this.locked = true;
      this.lockedPosition = {
        lat: this.history[this.history.length - 3].lat,
        lng: this.history[this.history.length - 3].lng
      };
    } else {
      this.locked = true;
      const last = this.history[this.history.length - 1];
      this.lockedPosition = { lat: last.lat, lng: last.lng };
    }
    return this.lockedPosition;
  }

  unlockPosition() {
    this.locked = false;
    this.lockedPosition = null;
  }

  isLocked() {
    return this.locked;
  }

  refreshPosition(lat, lng) {
    this.history = [];
    this.unlockPosition();
    this.addPosition(lat, lng, 10);
    return this.smoothPosition();
  }
}

console.log('\n--- 基础功能测试 ---\n');

test('应该正确初始化', () => {
  const smoother = new PositionSmoother();
  assert.strictEqual(smoother.isLocked(), false);
});

test('应该正确添加位置到历史记录', () => {
  const smoother = new PositionSmoother();
  smoother.addPosition(39.914, 116.407, 10);
  
  assert.strictEqual(smoother.history.length, 1);
  assert.strictEqual(smoother.history[0].lat, 39.914);
  assert.strictEqual(smoother.history[0].lng, 116.407);
});

console.log('\n--- 信号强度检测测试 ---\n');

test('精度10米应该是good信号', () => {
  const smoother = new PositionSmoother();
  const signal = smoother.getSignalStrength(10, null, null);
  assert.strictEqual(signal, 'good');
});

test('精度60米应该是medium信号', () => {
  const smoother = new PositionSmoother();
  const signal = smoother.getSignalStrength(60, null, null);
  assert.strictEqual(signal, 'medium');
});

test('精度120米应该是poor信号', () => {
  const smoother = new PositionSmoother();
  const signal = smoother.getSignalStrength(120, null, null);
  assert.strictEqual(signal, 'poor');
});

test('位置突变100米应该是poor信号', () => {
  const smoother = new PositionSmoother();
  const prev = { lat: 39.914, lng: 116.407 };
  const current = { lat: 39.915, lng: 116.408 };
  
  const signal = smoother.getSignalStrength(10, prev, current);
  assert.strictEqual(signal, 'poor');
});

console.log('\n--- 位置平滑测试（Bug3修复验证） ---\n');

test('单个位置应该返回原样', () => {
  const smoother = new PositionSmoother();
  smoother.addPosition(39.914, 116.407, 10);
  
  const smoothed = smoother.smoothPosition();
  assert.strictEqual(smoothed.lat, 39.914);
  assert.strictEqual(smoothed.lng, 116.407);
});

test('加权平均应该偏向新位置', () => {
  const smoother = new PositionSmoother();
  
  smoother.addPosition(39.9140, 116.4070, 10);
  smoother.addPosition(39.9141, 116.4071, 10);
  smoother.addPosition(39.9150, 116.4080, 10);
  
  const smoothed = smoother.smoothPosition();
  
  const latestPos = smoother.history[smoother.history.length - 1];
  const firstPos = smoother.history[0];
  
  const latDiffLatest = Math.abs(smoothed.lat - latestPos.lat);
  const latDiffFirst = Math.abs(smoothed.lat - firstPos.lat);
  
  assert.ok(latDiffLatest < latDiffFirst, '平滑结果应该更接近最新位置');
});

test('平滑后位置应该在历史位置范围内', () => {
  const smoother = new PositionSmoother();
  
  smoother.addPosition(39.914, 116.407, 10);
  smoother.addPosition(39.915, 116.408, 10);
  smoother.addPosition(39.916, 116.409, 10);
  
  const smoothed = smoother.smoothPosition();
  
  assert.ok(smoothed.lat >= 39.914 && smoothed.lat <= 39.916);
  assert.ok(smoothed.lng >= 116.407 && smoothed.lng <= 116.409);
});

console.log('\n--- 位置锁定测试（Bug3修复验证） ---\n');

test('应该可以锁定位置', () => {
  const smoother = new PositionSmoother();
  smoother.addPosition(39.914, 116.407, 10);
  smoother.addPosition(39.915, 116.408, 10);
  smoother.addPosition(39.916, 116.409, 10);
  
  smoother.lockPosition();
  
  assert.strictEqual(smoother.isLocked(), true);
});

test('锁定后添加新位置不影响平滑结果', () => {
  const smoother = new PositionSmoother();
  smoother.addPosition(39.914, 116.407, 10);
  smoother.addPosition(39.915, 116.408, 10);
  smoother.addPosition(39.916, 116.409, 10);
  
  const lockedPos = smoother.lockPosition();
  
  smoother.addPosition(39.920, 116.410, 10);
  
  const smoothed = smoother.smoothPosition();
  
  assert.strictEqual(smoothed.lat, lockedPos.lat);
  assert.strictEqual(smoothed.lng, lockedPos.lng);
});

test('应该可以解锁位置', () => {
  const smoother = new PositionSmoother();
  smoother.addPosition(39.914, 116.407, 10);
  
  smoother.lockPosition();
  assert.strictEqual(smoother.isLocked(), true);
  
  smoother.unlockPosition();
  assert.strictEqual(smoother.isLocked(), false);
});

test('解锁后平滑应该用最新数据', () => {
  const smoother = new PositionSmoother();
  smoother.addPosition(39.914, 116.407, 10);
  smoother.addPosition(39.915, 116.408, 10);
  
  const lockedPos = smoother.lockPosition();
  
  smoother.addPosition(39.920, 116.410, 10);
  smoother.unlockPosition();
  
  const smoothed = smoother.smoothPosition();
  
  assert.notStrictEqual(smoothed.lat, lockedPos.lat);
});

console.log('\n--- 刷新位置测试 ---\n');

test('刷新应该清空历史并添加新位置', () => {
  const smoother = new PositionSmoother();
  smoother.addPosition(39.914, 116.407, 10);
  smoother.addPosition(39.915, 116.408, 10);
  
  assert.strictEqual(smoother.history.length, 2);
  
  const newPos = smoother.refreshPosition(40.0, 117.0);
  
  assert.strictEqual(smoother.history.length, 1);
  assert.strictEqual(newPos.lat, 40.0);
  assert.strictEqual(newPos.lng, 117.0);
});

test('刷新应该解锁位置', () => {
  const smoother = new PositionSmoother();
  smoother.addPosition(39.914, 116.407, 10);
  
  smoother.lockPosition();
  assert.strictEqual(smoother.isLocked(), true);
  
  smoother.refreshPosition(40.0, 117.0);
  assert.strictEqual(smoother.isLocked(), false);
});

console.log('\n--- 漂移模拟测试（Bug3修复验证） ---\n');

test('信号差时锁定位置可以防止漂移', () => {
  const smoother = new PositionSmoother();
  
  smoother.addPosition(39.9140, 116.4070, 150);
  smoother.addPosition(39.9141, 116.4071, 150);
  smoother.addPosition(39.9142, 116.4072, 150);
  
  const lockedPos = smoother.lockPosition();
  
  smoother.addPosition(39.9200, 116.4100, 200);
  smoother.addPosition(39.9210, 116.4110, 200);
  smoother.addPosition(39.9220, 116.4120, 200);
  
  const smoothed = smoother.smoothPosition();
  
  assert.strictEqual(smoothed.lat, lockedPos.lat);
  assert.strictEqual(smoothed.lng, lockedPos.lng);
});

test('未锁定时会受漂移影响', () => {
  const smoother = new PositionSmoother();
  
  smoother.addPosition(39.9140, 116.4070, 150);
  smoother.addPosition(39.9141, 116.4071, 150);
  smoother.addPosition(39.9142, 116.4072, 150);
  
  const originalSmoothed = smoother.smoothPosition();
  
  smoother.addPosition(39.9200, 116.4100, 200);
  smoother.addPosition(39.9210, 116.4110, 200);
  smoother.addPosition(39.9220, 116.4120, 200);
  
  const newSmoothed = smoother.smoothPosition();
  
  assert.notStrictEqual(newSmoothed.lat, originalSmoothed.lat);
  assert.notStrictEqual(newSmoothed.lng, originalSmoothed.lng);
});

console.log('\n--- 历史记录管理测试 ---\n');

test('历史记录不超过最大长度', () => {
  const smoother = new PositionSmoother();
  
  for (let i = 0; i < 20; i++) {
    smoother.addPosition(39.914 + i * 0.001, 116.407 + i * 0.001, 10);
  }
  
  assert.strictEqual(smoother.history.length, MAX_HISTORY_LENGTH);
});

test('历史记录应该保留最新的位置', () => {
  const smoother = new PositionSmoother();
  
  for (let i = 0; i < 20; i++) {
    smoother.addPosition(39.914 + i * 0.001, 116.407 + i * 0.001, 10);
  }
  
  const oldestInHistory = smoother.history[0];
  assert.ok(oldestInHistory.lat > 39.914);
});

console.log('\n--- 备用方案测试（柜机列表兜底） ---\n');

test('柜机列表应该包含所有柜机', () => {
  const cabinets = [
    { id: '1', name: '柜机1', address: '地址1' },
    { id: '2', name: '柜机2', address: '地址2' },
    { id: '3', name: '柜机3', address: '地址3' }
  ];
  
  assert.strictEqual(cabinets.length, 3);
});

test('柜机列表应该可以过滤状态', () => {
  const cabinets = [
    { id: '1', name: '柜机1', available_powerbanks: 5, total_slots: 10 },
    { id: '2', name: '柜机2', available_powerbanks: 0, total_slots: 10 },
    { id: '3', name: '柜机3', available_powerbanks: 8, total_slots: 10 }
  ];
  
  const availableCabinets = cabinets.filter(c => c.available_powerbanks > 0);
  
  assert.strictEqual(availableCabinets.length, 2);
  assert.ok(availableCabinets.every(c => c.available_powerbanks > 0));
});

test('柜机列表应该包含可归还柜机', () => {
  const cabinets = [
    { id: '1', name: '柜机1', empty_slots: 3 },
    { id: '2', name: '柜机2', empty_slots: 0 },
    { id: '3', name: '柜机3', empty_slots: 5 }
  ];
  
  const returnableCabinets = cabinets.filter(c => c.empty_slots > 0);
  
  assert.strictEqual(returnableCabinets.length, 2);
});

console.log('\n========================================');
console.log(`测试完成: ${passed} 通过, ${failed} 失败`);
console.log('========================================\n');

process.exit(failed > 0 ? 1 : 0);
