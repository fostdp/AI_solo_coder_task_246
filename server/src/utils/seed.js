const db = require('./db');
const { v4: uuidv4 } = require('uuid');

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

const initializeData = () => {
  const cabinetCount = db.prepare('SELECT COUNT(*) as count FROM cabinets').get().count;
  
  if (cabinetCount > 0) {
    console.log('数据已存在，跳过初始化');
    return;
  }
  
  const insertCabinet = db.prepare(`
    INSERT INTO cabinets (id, name, address, lat, lng, total_slots, available_slots)
    VALUES (?, ?, ?, ?, ?, ?, ?)
  `);
  
  const insertPowerbank = db.prepare(`
    INSERT INTO powerbanks (id, cabinet_id, slot_number, status, battery_level)
    VALUES (?, ?, ?, 'available', ?)
  `);
  
  const tx = db.transaction((cabinets) => {
    for (const cabinet of cabinets) {
      insertCabinet.run(
        cabinet.id,
        cabinet.name,
        cabinet.address,
        cabinet.lat,
        cabinet.lng,
        cabinet.total_slots,
        cabinet.total_slots
      );
      
      for (let i = 1; i <= cabinet.total_slots; i++) {
        insertPowerbank.run(
          uuidv4(),
          cabinet.id,
          i,
          70 + Math.floor(Math.random() * 31)
        );
      }
    }
  });
  
  tx(initialCabinets);
  console.log(`成功初始化 ${initialCabinets.length} 个柜机和对应的充电宝`);
};

module.exports = { initializeData };
