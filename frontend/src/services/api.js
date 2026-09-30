const API_BASE = '/api';

export const api = {
  // Public & Citizen System API
  async getHealth() {
    try {
      const res = await fetch(`${API_BASE}/health`);
      return await res.json();
    } catch (e) {
      return { status: 'offline', error: e.message };
    }
  },

  async getPublicStats() {
    try {
      const res = await fetch(`${API_BASE}/complaints/public-stats`);
      return await res.json();
    } catch (e) {
      return { success: false, stats: { total: 0, pending: 0, inProgress: 0, approved: 0, rejected: 0 } };
    }
  },

  // Citizen Authentication & Password System
  async citizenLogin(phone, password) {
    const res = await fetch(`${API_BASE}/citizen/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ phone, password })
    });
    return await res.json();
  },

  async citizenRegister(payload) {
    const res = await fetch(`${API_BASE}/citizen/register`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload)
    });
    return await res.json();
  },

  async citizenForgotPasswordSendOtp(phone) {
    const res = await fetch(`${API_BASE}/citizen/forgot-password/send-otp`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ phone })
    });
    return await res.json();
  },

  async citizenForgotPasswordReset(payload) {
    const res = await fetch(`${API_BASE}/citizen/forgot-password/reset`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload)
    });
    return await res.json();
  },

  // 7-day Session & Device Concurrency Verification
  async verifyCitizenSession(phone, token) {
    try {
      const res = await fetch(`${API_BASE}/citizen/verify-session`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ phone, token })
      });
      return await res.json();
    } catch (e) {
      return { valid: false, error: e.message };
    }
  },

  async citizenLogout(phone) {
    try {
      const res = await fetch(`${API_BASE}/citizen/logout`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ phone })
      });
      return await res.json();
    } catch (e) {
      return { success: true };
    }
  },

  // Official Goghat Locations
  async getGoghatLocations() {
    try {
      const res = await fetch(`${API_BASE}/goghat/locations`);
      return await res.json();
    } catch (e) {
      return { success: false, error: e.message };
    }
  },

  // Legacy direct OTP endpoints
  async citizenSendOtp(phone) {
    const res = await fetch(`${API_BASE}/citizen/send-otp`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ phone })
    });
    return await res.json();
  },

  async citizenVerifyOtp(payload) {
    const res = await fetch(`${API_BASE}/citizen/verify-otp`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload)
    });
    return await res.json();
  },

  async getCitizenComplaints(phone) {
    const res = await fetch(`${API_BASE}/citizen/my-complaints?phone=${encodeURIComponent(phone)}`);
    return await res.json();
  },

  async updateCitizenProfile(profileData) {
    const res = await fetch(`${API_BASE}/citizen/profile`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(profileData)
    });
    return await res.json();
  },

  // Complaints Submission & Tracking
  async submitComplaint(complaintData) {
    const res = await fetch(`${API_BASE}/complaints`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(complaintData)
    });
    return await res.json();
  },

  async trackComplaint(ticketIdOrPhone) {
    const res = await fetch(`${API_BASE}/complaints/track/${encodeURIComponent(ticketIdOrPhone)}`);
    return await res.json();
  },

  // Bidhayak / Admin API
  async adminLogin(email, password) {
    const res = await fetch(`${API_BASE}/admin/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email, password })
    });
    return await res.json();
  },

  async adminForgotPasswordSendOtp(identifier) {
    const res = await fetch(`${API_BASE}/admin/forgot-password/send-otp`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ identifier })
    });
    return await res.json();
  },

  async adminForgotPasswordReset(payload) {
    const res = await fetch(`${API_BASE}/admin/forgot-password/reset`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload)
    });
    return await res.json();
  },

  async getAdminStats() {
    const res = await fetch(`${API_BASE}/admin/dashboard-stats`);
    return await res.json();
  },

  async getComplaints(filters = {}) {
    const query = new URLSearchParams();
    if (filters.status && filters.status !== 'all') query.append('status', filters.status);
    if (filters.q) query.append('q', filters.q);
    if (filters.problemType && filters.problemType !== 'all') query.append('problemType', filters.problemType);
    if (filters.ward && filters.ward !== 'all') query.append('ward', filters.ward);
    if (filters.priority && filters.priority !== 'all') query.append('priority', filters.priority);
    if (filters.sort) query.append('sort', filters.sort);

    const res = await fetch(`${API_BASE}/admin/complaints?${query.toString()}`);
    return await res.json();
  },

  async getComplaintById(id) {
    const res = await fetch(`${API_BASE}/admin/complaints/${id}`);
    return await res.json();
  },

  async updateComplaintStatus(id, updateData) {
    const res = await fetch(`${API_BASE}/admin/complaints/${id}/status`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(updateData)
    });
    return await res.json();
  },

  async updateComplaintFull(id, fullData) {
    const res = await fetch(`${API_BASE}/admin/complaints/${id}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(fullData)
    });
    return await res.json();
  },

  async addComplaintRemark(id, remarks) {
    const res = await fetch(`${API_BASE}/admin/complaints/${id}/remarks`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ remarks })
    });
    return await res.json();
  },

  async deleteComplaint(id) {
    const res = await fetch(`${API_BASE}/admin/complaints/${id}`, {
      method: 'DELETE'
    });
    return await res.json();
  },

  async exportComplaints() {
    const res = await fetch(`${API_BASE}/admin/export`);
    return await res.json();
  }
};
