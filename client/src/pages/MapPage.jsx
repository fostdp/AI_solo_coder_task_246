import React, { useState, useEffect, useCallback, useRef } from 'react';
import { useOrderContext } from '../App.jsx';
import CabinetModal from '../components/CabinetModal.jsx';
import { API } from '../services/api.js';

const SIGNAL_THRESHOLD = {
  GOOD: 20,
  MEDIUM: 50,
  POOR: 100
};

function MapPage() {
  const { cabinets, activeOrder } = useOrderContext();
  const [selectedCabinet, setSelectedCabinet] = useState(null);
  const [cabinetDetail, setCabinetDetail] = useState(null);
  const [elapsedTime, setElapsedTime] = useState(0);
  
  const [userPosition, setUserPosition] = useState(null);
  const [signalStrength, setSignalStrength] = useState('good');
  const [signalAccuracy, setSignalAccuracy] = useState(10);
  const [isPositionLocked, setIsPositionLocked] = useState(false);
  const [positionHistory, setPositionHistory] = useState([]);
  const [showSignalWarning, setShowSignalWarning] = useState(false);
  
  const positionHistoryRef = useRef([]);
  const maxHistoryLength = 10;

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

  const smoothPosition = useCallback((newLat, newLng, accuracy) => {
    const history = positionHistoryRef.current;
    
    history.push({ lat: newLat, lng: newLng, accuracy, timestamp: Date.now() });
    if (history.length > maxHistoryLength) {
      history.shift();
    }
    
    const recentPositions = history.slice(-5);
    const weights = recentPositions.map((_, index) => index + 1);
    const totalWeight = weights.reduce((a, b) => a + b, 0);
    
    let weightedLat = 0;
    let weightedLng = 0;
    
    recentPositions.forEach((pos, index) => {
      const weight = weights[index] / totalWeight;
      weightedLat += pos.lat * weight;
      weightedLng += pos.lng * weight;
    });
    
    const lastPos = history[history.length - 1];
    const prevPos = history.length > 1 ? history[history.length - 2] : lastPos;
    const positionDelta = Math.sqrt(
      Math.pow(lastPos.lat - prevPos.lat, 2) + 
      Math.pow(lastPos.lng - prevPos.lng, 2)
    ) * 111000;
    
    let currentSignal = 'good';
    if (accuracy > SIGNAL_THRESHOLD.POOR || positionDelta > 100) {
      currentSignal = 'poor';
    } else if (accuracy > SIGNAL_THRESHOLD.MEDIUM || positionDelta > 50) {
      currentSignal = 'medium';
    }
    
    setSignalStrength(currentSignal);
    setSignalAccuracy(accuracy);
    
    if (currentSignal === 'poor' && !isPositionLocked) {
      setShowSignalWarning(true);
    }
    
    if (isPositionLocked && history.length >= 3) {
      const stableLat = history[history.length - 3].lat;
      const stableLng = history[history.length - 3].lng;
      return { lat: stableLat, lng: stableLng };
    }
    
    return { lat: weightedLat, lng: weightedLng };
  }, [isPositionLocked]);

  useEffect(() => {
    if (cabinets.length === 0) return;
    
    const minLat = Math.min(...cabinets.map(c => c.lat));
    const maxLat = Math.max(...cabinets.map(c => c.lat));
    const minLng = Math.min(...cabinets.map(c => c.lng));
    const maxLng = Math.max(...cabinets.map(c => c.lng));
    
    const centerLat = (minLat + maxLat) / 2;
    const centerLng = (minLng + maxLng) / 2;
    
    const initialPos = smoothPosition(centerLat, centerLng, 10);
    setUserPosition(initialPos);
    
    let driftInterval;
    if (!isPositionLocked) {
      driftInterval = setInterval(() => {
        const currentPos = positionHistoryRef.current[positionHistoryRef.current.length - 1];
        if (currentPos) {
          const drift = (Math.random() - 0.5) * 0.0005;
          const newLat = currentPos.lat + drift;
          const newLng = currentPos.lng + drift;
          const newAccuracy = 10 + Math.random() * 90;
          
          const smoothed = smoothPosition(newLat, newLng, newAccuracy);
          setUserPosition(smoothed);
        }
      }, 3000);
    }
    
    return () => {
      if (driftInterval) clearInterval(driftInterval);
    };
  }, [cabinets, smoothPosition, isPositionLocked]);

  const handleRefreshLocation = () => {
    if (cabinets.length === 0) return;
    
    const minLat = Math.min(...cabinets.map(c => c.lat));
    const maxLat = Math.max(...cabinets.map(c => c.lat));
    const minLng = Math.min(...cabinets.map(c => c.lng));
    const maxLng = Math.max(...cabinets.map(c => c.lng));
    
    const centerLat = (minLat + maxLat) / 2;
    const centerLng = (minLng + maxLng) / 2;
    
    positionHistoryRef.current = [];
    const newPos = smoothPosition(centerLat, centerLng, 10);
    setUserPosition(newPos);
    setShowSignalWarning(false);
  };

  const togglePositionLock = () => {
    setIsPositionLocked(!isPositionLocked);
    if (!isPositionLocked) {
      setShowSignalWarning(false);
    }
  };

  const formatElapsedTime = (seconds) => {
    const hours = Math.floor(seconds / 3600);
    const minutes = Math.floor((seconds % 3600) / 60);
    const secs = seconds % 60;
    return `${hours.toString().padStart(2, '0')}:${minutes.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };

  const handleCabinetClick = async (cabinet) => {
    setSelectedCabinet(cabinet);
    try {
      const detail = await API.getCabinetById(cabinet.id);
      setCabinetDetail(detail);
    } catch (error) {
      console.error('获取柜机详情失败:', error);
      setCabinetDetail(cabinet);
    }
  };

  const closeModal = () => {
    setSelectedCabinet(null);
    setCabinetDetail(null);
  };

  const getCabinetStatus = (cabinet) => {
    const ratio = cabinet.available_powerbanks / cabinet.total_slots;
    if (ratio === 0) return 'full';
    if (ratio < 0.3) return 'low';
    return 'available';
  };

  const getSignalIcon = () => {
    switch (signalStrength) {
      case 'good': return '📶';
      case 'medium': return '📶';
      case 'poor': return '⚠️';
      default: return '❓';
    }
  };

  const getSignalColor = () => {
    switch (signalStrength) {
      case 'good': return '#4caf50';
      case 'medium': return '#ff9800';
      case 'poor': return '#f44336';
      default: return '#999';
    }
  };

  const getSignalText = () => {
    switch (signalStrength) {
      case 'good': return 'GPS信号良好';
      case 'medium': return 'GPS信号一般';
      case 'poor': return 'GPS信号弱';
      default: return '定位中...';
    }
  };

  if (cabinets.length === 0 || !userPosition) {
    return (
      <div>
        <h2 className="page-title">🗺️ 附近柜机</h2>
        <div className="loading">加载中...</div>
      </div>
    );
  }

  const minLat = Math.min(...cabinets.map(c => c.lat));
  const maxLat = Math.max(...cabinets.map(c => c.lat));
  const minLng = Math.min(...cabinets.map(c => c.lng));
  const maxLng = Math.max(...cabinets.map(c => c.lng));
  
  const mapPadding = 0.002;

  const getPosition = (lat, lng, mapWidth, mapHeight) => {
    const latRange = (maxLat - minLat) + mapPadding * 2;
    const lngRange = (maxLng - minLng) + mapPadding * 2;
    
    const x = ((lng - (minLng - mapPadding)) / lngRange) * mapWidth;
    const y = ((maxLat + mapPadding - lat) / latRange) * mapHeight;
    
    return { x, y };
  };

  const mapWidth = 800;
  const mapHeight = 500;

  const userMapPos = getPosition(userPosition.lat, userPosition.lng, mapWidth, mapHeight);

  return (
    <div>
      <h2 className="page-title">🗺️ 附近柜机</h2>

      <div style={{ 
        display: 'flex', 
        justifyContent: 'space-between', 
        alignItems: 'center', 
        marginBottom: '1rem',
        flexWrap: 'wrap',
        gap: '1rem'
      }}>
        <div style={{ 
          display: 'flex', 
          alignItems: 'center', 
          gap: '1rem',
          padding: '0.5rem 1rem',
          background: 'white',
          borderRadius: '8px',
          boxShadow: '0 2px 8px rgba(0,0,0,0.1)'
        }}>
          <span style={{ fontSize: '1.25rem' }}>{getSignalIcon()}</span>
          <div>
            <div style={{ fontWeight: 600, color: getSignalColor() }}>
              {getSignalText()}
            </div>
            <div style={{ fontSize: '0.75rem', color: '#999' }}>
              精度: ±{Math.round(signalAccuracy)}米
            </div>
          </div>
          {isPositionLocked && (
            <span style={{ 
              fontSize: '0.75rem', 
              background: '#4caf50', 
              color: 'white', 
              padding: '2px 8px', 
              borderRadius: '4px' 
            }}>
              位置已锁定
            </span>
          )}
        </div>
        
        <div style={{ display: 'flex', gap: '0.5rem' }}>
          <button 
            className="btn btn-secondary" 
            style={{ padding: '0.5rem 1rem', fontSize: '0.875rem' }}
            onClick={handleRefreshLocation}
          >
            🔄 刷新位置
          </button>
          <button 
            className={`btn ${isPositionLocked ? 'btn-success' : 'btn-secondary'}`}
            style={{ padding: '0.5rem 1rem', fontSize: '0.875rem' }}
            onClick={togglePositionLock}
          >
            {isPositionLocked ? '🔓 解锁位置' : '🔒 锁定位置'}
          </button>
        </div>
      </div>

      {showSignalWarning && (
        <div className="alert alert-error" style={{ marginBottom: '1rem' }}>
          <strong>⚠️ GPS信号较弱！</strong>
          <p style={{ marginTop: '0.5rem', fontSize: '0.875rem' }}>
            您的位置可能会出现漂移，建议：
          </p>
          <ul style={{ marginLeft: '1.5rem', marginTop: '0.25rem', fontSize: '0.875rem' }}>
            <li>移动到开阔地带</li>
            <li>点击"锁定位置"固定当前位置</li>
            <li>使用下方柜机列表直接选择柜机</li>
          </ul>
        </div>
      )}

      {activeOrder && (
        <div className="active-order-card">
          <h3>⏱️ 正在使用充电宝</h3>
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
              <label>借出时间</label>
              <div className="value">{new Date(activeOrder.borrow_time).toLocaleString('zh-CN')}</div>
            </div>
          </div>
          <div className="pricing-info">
            💡 提示：选择地图上的柜机可以查看详情并归还充电宝
          </div>
        </div>
      )}

      <div className="map-container">
        <div className="map-wrapper">
          <svg width="100%" height="100%" viewBox={`0 0 ${mapWidth} ${mapHeight}`} preserveAspectRatio="xMidYMid slice">
            <defs>
              <pattern id="grid" width="40" height="40" patternUnits="userSpaceOnUse">
                <path d="M 40 0 L 0 0 0 40" fill="none" stroke="#a5d6a7" strokeWidth="0.5" opacity="0.5"/>
              </pattern>
            </defs>
            <rect width="100%" height="100%" fill="url(#grid)" />
            
            <rect x="100" y="80" width="200" height="120" fill="#d1c4e9" opacity="0.6" rx="4" />
            <rect x="350" y="60" width="150" height="80" fill="#ffccbc" opacity="0.6" rx="4" />
            <rect x="550" y="120" width="180" height="100" fill="#c8e6c9" opacity="0.6" rx="4" />
            <rect x="200" y="280" width="250" height="100" fill="#bbdefb" opacity="0.6" rx="4" />
            <rect x="500" y="300" width="200" height="80" fill="#f0f4c3" opacity="0.6" rx="4" />
            <rect x="60" y="350" width="120" height="100" fill="#e1bee7" opacity="0.6" rx="4" />
            <rect x="150" y="180" width="80" height="60" fill="#ffe0b2" opacity="0.4" rx="4" />
            <rect x="400" y="200" width="100" height="50" fill="#b2ebf2" opacity="0.4" rx="4" />
          </svg>

          {cabinets.map(cabinet => {
            const { x, y } = getPosition(cabinet.lat, cabinet.lng, mapWidth, mapHeight);
            const status = getCabinetStatus(cabinet);
            
            return (
              <div
                key={cabinet.id}
                className="cabinet-marker"
                style={{ left: `${(x / mapWidth) * 100}%`, top: `${(y / mapHeight) * 100}%` }}
                onClick={() => handleCabinetClick(cabinet)}
              >
                <div className={`marker-icon ${status}`}>
                  <span>🔋</span>
                </div>
                <div className="marker-label">
                  {cabinet.name}
                  <br />
                  {cabinet.available_powerbanks}/{cabinet.total_slots}
                </div>
              </div>
            );
          })}

          <div
            className="user-location"
            style={{ 
              left: `${(userMapPos.x / mapWidth) * 100}%`, 
              top: `${(userMapPos.y / mapHeight) * 100}%`,
              opacity: signalStrength === 'poor' ? 0.6 : 1
            }}
          >
            <div 
              className="user-marker"
              style={{
                boxShadow: `0 0 0 ${signalStrength === 'poor' ? '8px' : '4px'} rgba(33, 150, 243, ${signalStrength === 'poor' ? '0.2' : '0.3'})`
              }}
            ></div>
            {signalStrength === 'poor' && (
              <div style={{
                position: 'absolute',
                top: '-25px',
                left: '50%',
                transform: 'translateX(-50%)',
                background: 'rgba(244, 67, 54, 0.9)',
                color: 'white',
                padding: '2px 6px',
                borderRadius: '4px',
                fontSize: '10px',
                whiteSpace: 'nowrap'
              }}>
                信号弱
              </div>
            )}
          </div>

          <div className="map-legend">
            <div className="legend-item">
              <div className="legend-dot available"></div>
              <span>充电宝充足</span>
            </div>
            <div className="legend-item">
              <div className="legend-dot low"></div>
              <span>充电宝紧张</span>
            </div>
            <div className="legend-item">
              <div className="legend-dot full"></div>
              <span>无可用充电宝</span>
            </div>
            <div className="legend-item">
              <div className="legend-dot user"></div>
              <span>我的位置</span>
            </div>
          </div>
        </div>
      </div>

      <h3 style={{ marginTop: '2rem', marginBottom: '1rem' }}>📋 柜机列表</h3>
      <div className="cabinet-list">
        {cabinets.map(cabinet => {
          const status = getCabinetStatus(cabinet);
          return (
            <div
              key={cabinet.id}
              className={`cabinet-card ${status}`}
              onClick={() => handleCabinetClick(cabinet)}
            >
              <div className="cabinet-card-header">
                <div>
                  <h3>{cabinet.name}</h3>
                  <div className="cabinet-card-address">{cabinet.address}</div>
                </div>
                <span className={`order-status ${status}`}>
                  {status === 'available' ? '充足' : status === 'low' ? '紧张' : '无货'}
                </span>
              </div>
              <div className="cabinet-card-stats">
                <div className="stat-item">
                  <label>可用</label>
                  <div className="value">{cabinet.available_powerbanks} 🔋</div>
                </div>
                <div className="stat-item">
                  <label>空位</label>
                  <div className="value">{cabinet.empty_slots || (cabinet.total_slots - cabinet.available_powerbanks)} ↩️</div>
                </div>
                <div className="stat-item">
                  <label>总仓位</label>
                  <div className="value">{cabinet.total_slots} 📦</div>
                </div>
              </div>
            </div>
          );
        })}
      </div>

      {selectedCabinet && cabinetDetail && (
        <CabinetModal
          cabinet={cabinetDetail}
          onClose={closeModal}
        />
      )}
    </div>
  );
}

export default MapPage;
