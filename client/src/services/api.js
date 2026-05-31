const API_BASE = '/api';

export const API = {
  async getHealth() {
    const response = await fetch(`${API_BASE}/health`);
    return response.json();
  },

  async getAllCabinets() {
    const response = await fetch(`${API_BASE}/cabinets`);
    return response.json();
  },

  async getCabinetById(id) {
    const response = await fetch(`${API_BASE}/cabinets/${id}`);
    return response.json();
  },

  async getCabinetSlots(id) {
    const response = await fetch(`${API_BASE}/cabinets/${id}/slots`);
    return response.json();
  },

  async borrowPowerbank(cabinetId, userId) {
    const response = await fetch(`${API_BASE}/orders/borrow`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ cabinet_id: cabinetId, user_id: userId })
    });
    return response.json();
  },

  async returnPowerbank(orderId, cabinetId) {
    const response = await fetch(`${API_BASE}/orders/return`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ order_id: orderId, cabinet_id: cabinetId })
    });
    return response.json();
  },

  async getActiveOrder(userId) {
    const response = await fetch(`${API_BASE}/orders/active/${userId}`);
    return response.json();
  },

  async getOrderHistory(userId) {
    const response = await fetch(`${API_BASE}/orders/history/${userId}`);
    return response.json();
  },

  async createReservation(cabinetId, userId, reserveMinutes = 15) {
    const response = await fetch(`${API_BASE}/reservations/create`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ cabinet_id: cabinetId, user_id: userId, reserve_minutes: reserveMinutes })
    });
    return response.json();
  },

  async cancelReservation(reservationId) {
    const response = await fetch(`${API_BASE}/reservations/cancel`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ reservation_id: reservationId })
    });
    return response.json();
  },

  async getActiveReservation(userId) {
    const response = await fetch(`${API_BASE}/reservations/active/${userId}`);
    return response.json();
  },

  async getAllPartners() {
    const response = await fetch(`${API_BASE}/partners`);
    return response.json();
  },

  async getPartnerById(id) {
    const response = await fetch(`${API_BASE}/partners/${id}`);
    return response.json();
  },

  async getCabinetsByPartner(partnerId) {
    const response = await fetch(`${API_BASE}/partners/${partnerId}/cabinets`);
    return response.json();
  },

  async getPowerbankById(id) {
    const response = await fetch(`${API_BASE}/battery/${id}`);
    return response.json();
  },

  async analyzeBatteryHealth(id) {
    const response = await fetch(`${API_BASE}/battery/${id}/health`);
    return response.json();
  },

  async getReplacementAlerts(status = 'all') {
    const response = await fetch(`${API_BASE}/battery/alerts/list?status=${status}`);
    return response.json();
  },

  async resolveReplacementAlert(alertId, resolution = 'replaced') {
    const response = await fetch(`${API_BASE}/battery/alerts/resolve`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ alert_id: alertId, resolution })
    });
    return response.json();
  }
};

export const USER_ID = 'user_' + Math.random().toString(36).substr(2, 9);
