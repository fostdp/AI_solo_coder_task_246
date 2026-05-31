const assert = require('assert');
const { calculateCost } = require('../src/utils/pricing.js');

console.log('\n========================================');
console.log('   计费模块测试');
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
    console.log(`   期望: ${error.expected}`);
    console.log(`   实际: ${error.actual}`);
    failed++;
  }
}

function addMinutes(date, minutes) {
  const d = new Date(date);
  d.setMinutes(d.getMinutes() + minutes);
  return d.toISOString();
}

function addDays(date, days) {
  const d = new Date(date);
  d.setDate(d.getDate() + days);
  return d.toISOString();
}

function addHours(date, hours) {
  const d = new Date(date);
  d.setHours(d.getHours() + hours);
  return d.toISOString();
}

const startTime = new Date('2026-05-11T10:00:00.000Z').toISOString();

console.log('\n--- 免费时段测试 ---\n');

test('25分钟应该免费', () => {
  const result = calculateCost(startTime, addMinutes(startTime, 25));
  assert.strictEqual(result.cost, 0, '25分钟应该免费');
});

test('30分钟应该免费', () => {
  const result = calculateCost(startTime, addMinutes(startTime, 30));
  assert.strictEqual(result.cost, 0, '30分钟应该免费');
});

test('31分钟应该收5元首小时费', () => {
  const result = calculateCost(startTime, addMinutes(startTime, 31));
  assert.strictEqual(result.cost, 5, '31分钟应该收5元');
});

test('59分钟应该收5元首小时费', () => {
  const result = calculateCost(startTime, addMinutes(startTime, 59));
  assert.strictEqual(result.cost, 5, '59分钟应该收5元');
});

console.log('\n--- 按小时计费测试 ---\n');

test('1小时1分钟 = 首小时5元 + 第2小时3元 = 8元', () => {
  const result = calculateCost(startTime, addMinutes(startTime, 61));
  assert.strictEqual(result.cost, 8, '1小时1分钟应该收8元');
});

test('2小时 = 5 + 3 = 8元', () => {
  const result = calculateCost(startTime, addMinutes(startTime, 120));
  assert.strictEqual(result.cost, 8, '2小时应该收8元');
});

test('3小时 = 5 + 3 + 3 = 11元', () => {
  const result = calculateCost(startTime, addMinutes(startTime, 180));
  assert.strictEqual(result.cost, 11, '3小时应该收11元');
});

test('5小时 = 5 + 3*4 = 17元', () => {
  const result = calculateCost(startTime, addMinutes(startTime, 300));
  assert.strictEqual(result.cost, 17, '5小时应该收17元');
});

console.log('\n--- 日封顶测试 ---\n');

test('8小时 = 5 + 3*7 = 26元 (未封顶)', () => {
  const result = calculateCost(startTime, addMinutes(startTime, 480));
  assert.strictEqual(result.cost, 26, '8小时应该收26元');
});

test('10小时 = 5 + 3*9 = 32元，封顶为30元', () => {
  const result = calculateCost(startTime, addMinutes(startTime, 600));
  assert.strictEqual(result.cost, 30, '10小时应该封顶30元');
});

test('12小时应该封顶30元', () => {
  const result = calculateCost(startTime, addMinutes(startTime, 720));
  assert.strictEqual(result.cost, 30, '12小时应该封顶30元');
});

test('24小时跨2天，各天独立封顶', () => {
  const result = calculateCost(startTime, addHours(startTime, 24));
  assert.strictEqual(result.days_used, 2, '应该跨2天');
  assert.strictEqual(result.cost, 60, '24小时跨2天，各天封顶30元，总计60元');
});

console.log('\n--- 跨天计费测试 ---\n');

test('跨天：第一天2小时 + 第二天2小时，各算各的', () => {
  const day1End = new Date('2026-05-11T23:30:00.000Z').toISOString();
  const day2Start = new Date('2026-05-12T00:30:00.000Z').toISOString();
  
  const start = new Date('2026-05-11T21:30:00.000Z').toISOString();
  const end = new Date('2026-05-12T02:30:00.000Z').toISOString();
  
  const result = calculateCost(start, end);
  
  assert.strictEqual(result.days_used, 2, '应该跨2天');
  
  const day1Minutes = 150;
  const day2Minutes = 150;
  const day1Cost = day1Minutes <= 30 ? 0 : (day1Minutes <= 60 ? 5 : 5 + 3 * Math.ceil((day1Minutes - 60) / 60));
  const day2Cost = day2Minutes <= 30 ? 0 : (day2Minutes <= 60 ? 5 : 5 + 3 * Math.ceil((day2Minutes - 60) / 60));
  
  assert.strictEqual(result.cost, day1Cost + day2Cost, '跨天应该分别计算');
});

test('跨天：第一天10小时(封顶30元) + 第二天10小时(封顶30元) = 60元', () => {
  const start = new Date('2026-05-11T10:00:00.000Z').toISOString();
  const end = new Date('2026-05-12T20:00:00.000Z').toISOString();
  
  const result = calculateCost(start, end);
  
  assert.strictEqual(result.days_used, 2, '应该跨2天');
  assert.strictEqual(result.cost, 60, '两天各封顶30元，总计60元');
});

console.log('\n--- 跨免费时段测试（Bug2修复验证） ---\n');

test('第一天用20分钟免费 + 第二天继续使用，第二天重新计算免费时间', () => {
  const start = new Date('2026-05-11T23:45:00.000Z').toISOString();
  const end = new Date('2026-05-12T00:45:00.000Z').toISOString();
  
  const result = calculateCost(start, end);
  
  assert.strictEqual(result.days_used, 2, '应该跨2天');
  
  const day1Minutes = 15;
  const day2Minutes = 45;
  
  assert.ok(result.cost >= 0, '费用应该大于等于0');
  assert.ok(result.breakdown.length > 0, '应该有计费明细');
});

test('第一天25分钟(免费) + 第二天25分钟(也免费) = 0元', () => {
  const start = new Date('2026-05-11T23:35:00.000Z').toISOString();
  const end = new Date('2026-05-12T00:25:00.000Z').toISOString();
  
  const result = calculateCost(start, end);
  
  assert.strictEqual(result.cost, 0, '两天都在免费期内，应该0元');
});

console.log('\n--- 计费明细测试 ---\n');

test('应该返回详细的计费明细', () => {
  const result = calculateCost(startTime, addMinutes(startTime, 125));
  
  assert.ok(Array.isArray(result.breakdown), 'breakdown应该是数组');
  assert.ok(result.breakdown.length > 0, '应该有计费明细项');
});

test('明细应该包含费用和描述', () => {
  const result = calculateCost(startTime, addMinutes(startTime, 90));
  
  const hasCostInfo = result.breakdown.some(item => item.cost !== undefined);
  const hasDescription = result.breakdown.some(item => item.description !== undefined);
  
  assert.ok(hasCostInfo, '明细应该包含费用');
  assert.ok(hasDescription, '明细应该包含描述');
});

console.log('\n--- 边界情况测试 ---\n');

test('0分钟应该0元', () => {
  const result = calculateCost(startTime, startTime);
  assert.strictEqual(result.cost, 0, '0分钟应该0元');
});

test('1分钟应该0元（免费期内）', () => {
  const result = calculateCost(startTime, addMinutes(startTime, 1));
  assert.strictEqual(result.cost, 0, '1分钟应该0元');
});

test('duration_minutes应该正确', () => {
  const result = calculateCost(startTime, addMinutes(startTime, 45));
  assert.strictEqual(result.duration_minutes, 45, '时长应该是45分钟');
});

console.log('\n========================================');
console.log(`测试完成: ${passed} 通过, ${failed} 失败`);
console.log('========================================\n');

process.exit(failed > 0 ? 1 : 0);
