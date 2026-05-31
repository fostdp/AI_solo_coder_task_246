import React, { useState, useEffect } from 'react';
import { useOrderContext } from '../App.jsx';
import { API } from '../services/api.js';

function OrdersPage() {
  const { activeOrder, refreshData, userId } = useOrderContext();
  const [orderHistory, setOrderHistory] = useState([]);
  const [loading, setLoading] = useState(true);
  const [elapsedTime, setElapsedTime] = useState(0);

  useEffect(() => {
    const fetchHistory = async () => {
      setLoading(true);
      try {
        const history = await API.getOrderHistory(userId);
        setOrderHistory(history);
      } catch (error) {
        console.error('获取订单历史失败:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchHistory();
    const interval = setInterval(fetchHistory, 5000);
    return () => clearInterval(interval);
  }, [userId]);

  useEffect(() => {
    if (!activeOrder) {
      setElapsedTime(0);
      return;
    }

    const updateTime = () => {
      const borrowTime = new Date(activeOrder.borrow_time);
      const now = new Date();
      setElapsedTime(Math.floor((now - borrowTime) / 1000));
    };

    updateTime();
    const timer = setInterval(updateTime, 1000);
    return () => clearInterval(timer);
  }, [activeOrder]);

  const formatElapsedTime = (seconds) => {
    const hours = Math.floor(seconds / 3600);
    const minutes = Math.floor((seconds % 3600) / 60);
    const secs = seconds % 60;
    return `${hours.toString().padStart(2, '0')}:${minutes.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };

  const formatTime = (isoString) => {
    if (!isoString) return '-';
    const date = new Date(isoString);
    return date.toLocaleString('zh-CN');
  };

  const formatDuration = (minutes) => {
    if (!minutes) return '-';
    if (minutes < 60) {
      return `${minutes} 分钟`;
    }
    const hours = Math.floor(minutes / 60);
    const mins = minutes % 60;
    return `${hours} 小时 ${mins} 分钟`;
  };

  if (loading && orderHistory.length === 0) {
    return (
      <div>
        <h2 className="page-title">📋 我的订单</h2>
        <div className="loading">加载中...</div>
      </div>
    );
  }

  const completedOrders = orderHistory.filter(o => o.status === 'completed');

  return (
    <div>
      <h2 className="page-title">📋 我的订单</h2>

      {activeOrder && (
        <div className="active-order-card">
          <h3>⏱️ 正在进行的订单</h3>
          <div className="order-details">
            <div className="order-detail-item">
              <label>使用时长</label>
              <div className="value timer">{formatElapsedTime(elapsedTime)}</div>
            </div>
            <div className="order-detail-item">
              <label>借出柜机</label>
              <div className="value">{activeOrder.cabinet_name}</div>
            </div>
            <div className="order-detail-item">
              <label>位置</label>
              <div className="value">{activeOrder.cabinet_address}</div>
            </div>
            <div className="order-detail-item">
              <label>借出时间</label>
              <div className="value">{formatTime(activeOrder.borrow_time)}</div>
            </div>
          </div>
          <div className="alert alert-info">
            💡 请前往地图页面选择柜机归还充电宝
          </div>
        </div>
      )}

      <h3 style={{ margin: '1.5rem 0 1rem' }}>
        📜 历史订单
        {completedOrders.length > 0 && ` (${completedOrders.length})`}
      </h3>

      {completedOrders.length === 0 ? (
        <div className="orders-list">
          <div className="empty-state">
            <div className="empty-state-icon">📦</div>
            <p>暂无历史订单</p>
            <p style={{ fontSize: '0.875rem', marginTop: '0.5rem' }}>
              前往地图页面借出充电宝开始使用
            </p>
          </div>
        </div>
      ) : (
        <div className="orders-list">
          {completedOrders.map((order, index) => (
            <div key={order.id} className="order-item">
              <div className="order-item-header">
                <div>
                  <strong>{order.cabinet_name}</strong>
                  <span style={{ color: '#999', marginLeft: '0.5rem', fontSize: '0.875rem' }}>
                    #{index + 1}
                  </span>
                </div>
                <span className={`order-status ${order.status}`}>
                  {order.status === 'active' ? '进行中' : '已完成'}
                </span>
              </div>
              <div className="order-item-details">
                <div className="order-item-detail">
                  <strong>借出时间：</strong>{formatTime(order.borrow_time)}
                </div>
                <div className="order-item-detail">
                  <strong>归还柜机：</strong>{order.return_cabinet_name || '-'}
                </div>
                <div className="order-item-detail">
                  <strong>归还时间：</strong>{formatTime(order.return_time)}
                </div>
                <div className="order-item-detail">
                  <strong>使用时长：</strong>{formatDuration(order.duration_minutes)}
                </div>
                <div className="order-item-detail">
                  <strong>费用：</strong>
                  <span style={{ color: order.cost > 0 ? '#f44336' : '#4caf50', fontWeight: '600' }}>
                    ¥{order.cost}
                  </span>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      <div style={{ marginTop: '2rem', background: 'white', borderRadius: '12px', padding: '1.5rem', boxShadow: '0 4px 20px rgba(0,0,0,0.08)' }}>
        <h3 style={{ marginBottom: '1rem' }}>💰 费用统计</h3>
        {completedOrders.length === 0 ? (
          <p style={{ color: '#999' }}>暂无消费记录</p>
        ) : (
          <div className="order-details">
            <div className="order-detail-item">
              <label>总订单数</label>
              <div className="value">{completedOrders.length} 次</div>
            </div>
            <div className="order-detail-item">
              <label>总使用时长</label>
              <div className="value">{formatDuration(completedOrders.reduce((sum, o) => sum + (o.duration_minutes || 0), 0))}</div>
            </div>
            <div className="order-detail-item">
              <label>总消费</label>
              <div className="value" style={{ color: '#f44336' }}>
                ¥{completedOrders.reduce((sum, o) => sum + (o.cost || 0), 0).toFixed(2)}
              </div>
            </div>
            <div className="order-detail-item">
              <label>平均每次消费</label>
              <div className="value">
                ¥{(completedOrders.reduce((sum, o) => sum + (o.cost || 0), 0) / completedOrders.length).toFixed(2)}
              </div>
            </div>
          </div>
        )}
      </div>

      <div style={{ marginTop: '2rem' }} className="pricing-info">
        <h3>📖 计费规则说明</h3>
        <ul>
          <li><strong>免费期：</strong>前30分钟免费使用</li>
          <li><strong>首小时：</strong>超过30分钟但不足1小时，收取5元</li>
          <li><strong>超时计费：</strong>超过1小时后，每小时收取3元</li>
          <li><strong>日封顶：</strong>每天最高消费30元封顶</li>
          <li><strong>跨柜归还：</strong>支持任意柜机归还，费用规则相同</li>
        </ul>
      </div>
    </div>
  );
}

export default OrdersPage;
