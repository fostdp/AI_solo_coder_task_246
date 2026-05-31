import React, { useState } from 'react';
import { useOrderContext } from '../App.jsx';
import { API } from '../services/api.js';

function CabinetModal({ cabinet, onClose }) {
  const { activeOrder, userId, refreshData } = useOrderContext();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [success, setSuccess] = useState(null);
  const [returnCabinetId, setReturnCabinetId] = useState('');
  const [showReturnResult, setShowReturnResult] = useState(false);
  const [returnResult, setReturnResult] = useState(null);
  const [showBorrowResult, setShowBorrowResult] = useState(false);
  const [borrowResult, setBorrowResult] = useState(null);

  const handleBorrow = async () => {
    setLoading(true);
    setError(null);
    setSuccess(null);

    try {
      const result = await API.borrowPowerbank(cabinet.id, userId);
      if (result.success) {
        setBorrowResult(result.data);
        setShowBorrowResult(true);
        refreshData();
      } else {
        setError(result.error);
      }
    } catch (err) {
      setError('操作失败，请重试');
    } finally {
      setLoading(false);
    }
  };

  const handleReturn = async () => {
    if (!returnCabinetId) {
      setError('请选择归还柜机');
      return;
    }

    setLoading(true);
    setError(null);

    try {
      const result = await API.returnPowerbank(activeOrder.id, returnCabinetId);
      if (result.success) {
        setReturnResult(result.data);
        setShowReturnResult(true);
        refreshData();
      } else {
        setError(result.error);
      }
    } catch (err) {
      setError('操作失败，请重试');
    } finally {
      setLoading(false);
    }
  };

  const getCabinetStatus = () => {
    const ratio = cabinet.available_powerbanks / cabinet.total_slots;
    if (ratio === 0) return 'full';
    if (ratio < 0.3) return 'low';
    return 'available';
  };

  const getStatusText = (status) => {
    const texts = {
      available: '充电宝充足',
      low: '充电宝紧张',
      full: '无可用充电宝'
    };
    return texts[status] || '未知';
  };

  const formatTime = (isoString) => {
    const date = new Date(isoString);
    return date.toLocaleString('zh-CN');
  };

  const { cabinets } = useOrderContext();

  if (showBorrowResult && borrowResult) {
    return (
      <div className="modal-overlay" onClick={onClose}>
        <div className="modal-content" onClick={e => e.stopPropagation()}>
          <div className="modal-header">
            <h2>借出成功</h2>
            <button className="modal-close" onClick={onClose}>×</button>
          </div>
          <div className="modal-body">
            <div className="success-animation">
              <div className="success-icon">✅</div>
              <div className="success-message">充电宝借出成功！</div>
            </div>
            <div className="order-details">
              <div className="order-detail-item">
                <label>柜机名称</label>
                <div className="value">{borrowResult.cabinet_name}</div>
              </div>
              <div className="order-detail-item">
                <label>位置</label>
                <div className="value">{borrowResult.cabinet_address}</div>
              </div>
              <div className="order-detail-item">
                <label>充电宝编号</label>
                <div className="value">{borrowResult.powerbank_id.substring(0, 8)}</div>
              </div>
              <div className="order-detail-item">
                <label>仓位</label>
                <div className="value">#{borrowResult.slot_number}</div>
              </div>
              <div className="order-detail-item">
                <label>电量</label>
                <div className="value">{borrowResult.battery_level}%</div>
              </div>
              <div className="order-detail-item">
                <label>借出时间</label>
                <div className="value">{formatTime(borrowResult.borrow_time)}</div>
              </div>
            </div>
            <div className="pricing-info">
              <h4>💰 计费规则</h4>
              <ul>
                <li>前30分钟免费</li>
                <li>首小时5元</li>
                <li>之后每小时3元</li>
                <li>每天最高30元封顶</li>
              </ul>
            </div>
            <div className="action-buttons">
              <button className="btn btn-primary" onClick={onClose}>
                知道了
              </button>
            </div>
          </div>
        </div>
      </div>
    );
  }

  if (showReturnResult && returnResult) {
    return (
      <div className="modal-overlay" onClick={onClose}>
        <div className="modal-content" onClick={e => e.stopPropagation()}>
          <div className="modal-header">
            <h2>归还成功</h2>
            <button className="modal-close" onClick={onClose}>×</button>
          </div>
          <div className="modal-body">
            <div className="success-animation">
              <div className="success-icon">🎉</div>
              <div className="success-message">充电宝归还成功！</div>
            </div>
            <div className="cost-display">
              <div className="cost-amount">¥{returnResult.cost}</div>
              <div className="cost-label">本次费用</div>
            </div>
            <div className="order-details">
              <div className="order-detail-item">
                <label>使用时长</label>
                <div className="value">{returnResult.duration_minutes} 分钟</div>
              </div>
              <div className="order-detail-item">
                <label>归还时间</label>
                <div className="value">{formatTime(returnResult.return_time)}</div>
              </div>
            </div>
            <div className="action-buttons">
              <button className="btn btn-primary" onClick={onClose}>
                完成
              </button>
            </div>
          </div>
        </div>
      </div>
    );
  }

  const getEmptySlots = (c) => {
    if (c.empty_slots !== undefined) {
      return c.empty_slots;
    }
    return c.total_slots - c.available_powerbanks;
  };

  const availableCabinetsForReturn = cabinets.filter(
    c => c.id !== activeOrder?.cabinet_id && getEmptySlots(c) > 0
  );

  const sameCabinetAvailable = getEmptySlots(cabinet) > 0;

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal-content" onClick={e => e.stopPropagation()}>
        <div className="modal-header">
          <h2>{cabinet.name}</h2>
          <button className="modal-close" onClick={onClose}>×</button>
        </div>
        <div className="modal-body">
          {error && <div className="alert alert-error">{error}</div>}
          {success && <div className="alert alert-success">{success}</div>}

          <div className="cabinet-info">
            <p><strong>📍 地址：</strong>{cabinet.address}</p>
            <p><strong>🔋 可用充电宝：</strong>
              {cabinet.available_powerbanks} / {cabinet.total_slots}
            </p>
            <p><strong>� 空位数：</strong>
              {cabinet.empty_slots !== undefined ? cabinet.empty_slots : (cabinet.total_slots - cabinet.available_powerbanks)}
            </p>
            <p><strong>�📊 状态：</strong>
              <span className={`order-status ${getCabinetStatus()}`}>
                {getStatusText(getCabinetStatus())}
              </span>
            </p>
          </div>

          <div>
            <strong>📦 仓位状态：</strong>
            <div className="slots-grid">
              {cabinet.powerbanks?.map((slot) => (
                <div
                  key={slot.slot_number}
                  className={`slot-item ${slot.status}`}
                  title={`仓位 #${slot.slot_number} - ${slot.status === 'available' ? '可用' : slot.status === 'empty' ? '空位' : '占用'}`}
                >
                  <span>#{slot.slot_number}</span>
                  <span className="slot-battery">
                    {slot.status === 'available' ? `${slot.battery_level}%` : slot.status === 'empty' ? '空' : '—'}
                  </span>
                </div>
              ))}
            </div>
            <div style={{ fontSize: '0.75rem', color: '#999', marginTop: '0.5rem' }}>
              💚 绿色=可用充电宝 | ⚪ 灰色=空位可归还
            </div>
          </div>

          {!activeOrder ? (
            <>
              <div className="pricing-info">
                <h4>💰 计费规则</h4>
                <ul>
                  <li>前30分钟免费</li>
                  <li>首小时5元</li>
                  <li>之后每小时3元</li>
                  <li>每天最高30元封顶</li>
                </ul>
              </div>
              <div className="action-buttons">
                <button
                  className="btn btn-secondary"
                  onClick={onClose}
                  disabled={loading}
                >
                  取消
                </button>
                <button
                  className="btn btn-primary"
                  onClick={handleBorrow}
                  disabled={loading || cabinet.available_powerbanks === 0}
                >
                  {loading ? '处理中...' : '借出充电宝'}
                </button>
              </div>
            </>
          ) : (
            <>
              <div className="alert alert-info">
                ⚠️ 您当前有正在使用的充电宝，请到柜机归还后再借出
              </div>
              
              {activeOrder && (
                <div style={{ marginTop: '1rem' }}>
                  <strong>🔄 归还到当前柜机：</strong>
                  
                  {sameCabinetAvailable ? (
                    <div className="action-buttons" style={{ marginTop: '0.5rem' }}>
                      <button
                        className="btn btn-secondary"
                        onClick={onClose}
                        disabled={loading}
                      >
                        取消
                      </button>
                      <button
                        className="btn btn-success"
                        onClick={() => {
                          setReturnCabinetId(cabinet.id);
                          setTimeout(handleReturn, 0);
                        }}
                        disabled={loading}
                      >
                        {loading ? '处理中...' : '归还到此柜机'}
                      </button>
                    </div>
                  ) : (
                    <p style={{ color: '#f44336', fontSize: '0.875rem', marginTop: '0.5rem' }}>
                      该柜机已满，请选择其他柜机归还
                    </p>
                  )}
                </div>
              )}

              {availableCabinetsForReturn.length > 0 && (
                <div style={{ marginTop: '1rem' }}>
                  <strong>📍 或选择其他柜机归还：</strong>
                  <select
                    className="return-select"
                    value={returnCabinetId}
                    onChange={e => setReturnCabinetId(e.target.value)}
                  >
                    <option value="">请选择柜机...</option>
                    {availableCabinetsForReturn.map(c => (
                      <option key={c.id} value={c.id}>
                        {c.name} - 可用位置: {c.total_slots - c.available_powerbanks}
                      </option>
                    ))}
                  </select>
                  {returnCabinetId && (
                    <div className="action-buttons">
                      <button
                        className="btn btn-secondary"
                        onClick={onClose}
                        disabled={loading}
                      >
                        取消
                      </button>
                      <button
                        className="btn btn-success"
                        onClick={handleReturn}
                        disabled={loading}
                      >
                        {loading ? '处理中...' : '确认归还'}
                      </button>
                    </div>
                  )}
                </div>
              )}
            </>
          )}
        </div>
      </div>
    </div>
  );
}

export default CabinetModal;
