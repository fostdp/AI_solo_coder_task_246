const express = require('express');
const cors = require('cors');
const http = require('http');

const cabinetsRouter = require('./routes/cabinets');
const ordersRouter = require('./routes/orders');
const reservationsRouter = require('./routes/reservations');
const partnersRouter = require('./routes/partners');
const batteryRouter = require('./routes/battery');

const app = express();

app.use(cors());
app.use(express.json());

app.get('/api/health', (req, res) => {
  res.json({ status: 'ok', timestamp: new Date().toISOString() });
});

app.use('/api/cabinets', cabinetsRouter);
app.use('/api/orders', ordersRouter);
app.use('/api/reservations', reservationsRouter);
app.use('/api/partners', partnersRouter);
app.use('/api/battery', batteryRouter);

const findAvailablePort = (startPort) => {
  return new Promise((resolve, reject) => {
    const server = http.createServer();
    server.listen(startPort, () => {
      server.close(() => resolve(startPort));
    });
    server.on('error', () => {
      resolve(findAvailablePort(startPort + 1));
    });
  });
};

findAvailablePort(8080).then((port) => {
  app.listen(port, () => {
    console.log(`共享充电宝柜服务已启动: http://localhost:${port}`);
    console.log(`API地址: http://localhost:${port}/api`);
  });
});
