const calculateCost = (startTime, endTime) => {
  const start = new Date(startTime);
  const end = new Date(endTime);
  
  const firstHourRate = 5;
  const perHourRate = 3;
  const maxDailyCost = 30;
  const freeMinutes = 30;
  
  const diffMs = end - start;
  const diffMinutes = Math.max(0, Math.ceil(diffMs / (1000 * 60)));
  
  const getUTCDateString = (date) => {
    const y = date.getUTCFullYear();
    const m = String(date.getUTCMonth() + 1).padStart(2, '0');
    const d = String(date.getUTCDate()).padStart(2, '0');
    return `${y}-${m}-${d}`;
  };
  
  const startDate = getUTCDateString(start);
  const endDate = getUTCDateString(end);
  const isSameDay = startDate === endDate;
  
  let totalCost = 0;
  let breakdown = [];
  
  const calculateDailyCost = (minutes) => {
    if (minutes <= 0) return { cost: 0, breakdown: [] };
    
    const dailyBreakdown = [];
    
    if (minutes <= freeMinutes) {
      dailyBreakdown.push({ 
        description: `前${freeMinutes}分钟免费（实际${minutes}分钟）`, 
        cost: 0 
      });
      return { cost: 0, breakdown: dailyBreakdown };
    }
    
    dailyBreakdown.push({ 
      description: `前${freeMinutes}分钟免费`, 
      cost: 0 
    });
    
    const billableAfterFree = minutes - freeMinutes;
    
    if (billableAfterFree <= 30) {
      dailyBreakdown.push({ 
        description: `首小时计费（${minutes}分钟）`, 
        cost: firstHourRate 
      });
      return { cost: firstHourRate, breakdown: dailyBreakdown };
    }
    
    const totalHours = Math.ceil(minutes / 60);
    const remainingHours = totalHours - 1;
    let cost = firstHourRate;
    
    dailyBreakdown.push({ 
      description: `首小时费用`, 
      cost: firstHourRate 
    });
    
    if (remainingHours > 0) {
      cost += remainingHours * perHourRate;
      dailyBreakdown.push({ 
        description: `后续${remainingHours}小时（每小时${perHourRate}元）`, 
        cost: remainingHours * perHourRate 
      });
    }
    
    if (cost > maxDailyCost) {
      dailyBreakdown.push({ 
        description: `日封顶减免（原${cost}元→${maxDailyCost}元）`, 
        cost: maxDailyCost - cost 
      });
      cost = maxDailyCost;
    }
    
    return { cost, breakdown: dailyBreakdown };
  };
  
  if (diffMinutes <= 0) {
    return {
      cost: 0,
      duration_minutes: 0,
      breakdown: [{ description: '使用时间不足1分钟', cost: 0 }]
    };
  }
  
  if (isSameDay) {
    const result = calculateDailyCost(diffMinutes);
    return {
      cost: result.cost,
      duration_minutes: diffMinutes,
      breakdown: result.breakdown
    };
  } else {
    const day1End = new Date(start);
    day1End.setUTCHours(23, 59, 59, 999);
    const minutesDay1 = Math.max(1, Math.ceil((day1End - start) / (1000 * 60)));
    const minutesDay2 = diffMinutes - minutesDay1;
    
    const result1 = calculateDailyCost(minutesDay1);
    const result2 = minutesDay2 > 0 ? calculateDailyCost(minutesDay2) : { cost: 0, breakdown: [] };
    
    breakdown = [
      ...result1.breakdown.map(item => ({ ...item, description: `第一天：${item.description}` })),
      ...result2.breakdown.map(item => ({ ...item, description: `第二天：${item.description}` }))
    ];
    
    totalCost = result1.cost + result2.cost;
    
    return {
      cost: totalCost,
      duration_minutes: diffMinutes,
      days_used: 2,
      breakdown: breakdown
    };
  }
};

const calculateCostSimple = (startTime, endTime) => {
  const result = calculateCost(startTime, endTime);
  return result.cost;
};

module.exports = { calculateCost, calculateCostSimple };
