import React, { useState, useEffect, createContext, useContext } from 'react';
import { Routes, Route, NavLink } from 'react-router-dom';
import MapPage from './pages/MapPage.jsx';
import OrdersPage from './pages/OrdersPage.jsx';
import { API, USER_ID } from './services/api.js';

const OrderContext = createContext();

export const useOrderContext = () => useContext(OrderContext);

function App() {
  const [activeOrder, setActiveOrder] = useState(null);
  const [cabinets, setCabinets] = useState([]);
  const [loading, setLoading] = useState(true);

  const fetchData = async () => {
    try {
      const [cabinetsData, orderData] = await Promise.all([
        API.getAllCabinets(),
        API.getActiveOrder(USER_ID)
      ]);
      setCabinets(cabinetsData);
      setActiveOrder(orderData);
    } catch (error) {
      console.error('获取数据失败:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
    const interval = setInterval(fetchData, 5000);
    return () => clearInterval(interval);
  }, []);

  const refreshData = () => {
    fetchData();
  };

  if (loading) {
    return (
      <div className="app-container">
        <header className="header">
          <h1>🔋 共享充电宝柜模拟</h1>
        </header>
        <main className="main-content">
          <div className="loading">加载中...</div>
        </main>
      </div>
    );
  }

  return (
    <OrderContext.Provider value={{ activeOrder, cabinets, refreshData, userId: USER_ID }}>
      <div className="app-container">
        <header className="header">
          <h1>🔋 共享充电宝柜模拟</h1>
          <nav className="nav-links">
            <NavLink to="/" end className={({ isActive }) => isActive ? 'active' : ''}>
              🗺️ 地图
            </NavLink>
            <NavLink to="/orders" className={({ isActive }) => isActive ? 'active' : ''}>
              📋 订单
              {activeOrder && <span style={{ marginLeft: '4px' }}>(进行中)</span>}
            </NavLink>
          </nav>
        </header>
        <main className="main-content">
          <Routes>
            <Route path="/" element={<MapPage />} />
            <Route path="/orders" element={<OrdersPage />} />
          </Routes>
        </main>
      </div>
    </OrderContext.Provider>
  );
}

export default App;
