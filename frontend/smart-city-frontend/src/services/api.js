const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:4000';

class ApiService {
  constructor() {
    this.baseURL = API_BASE_URL;
  }

  async request(endpoint, options = {}) {
    const url = `${this.baseURL}${endpoint}`;
    const config = {
      headers: { 'Content-Type': 'application/json', ...options.headers },
      ...options,
    };

    try {
      const response = await fetch(url, config);
      if (!response.ok) throw new Error(`HTTP error! status: ${response.status}`);
      if (response.status === 204) return null;
      return await response.json();
    } catch (error) {
      console.error(`API request failed for ${endpoint}:`, error);
      throw error;
    }
  }
  async getHealth() {
    return this.request('/health');
  }
  async getLatest() {
    return this.request('/latest');
  }
  async ingest(data) {
    return this.request('/ingest', {
      method: 'POST',
      body: JSON.stringify(data),
    });
  }
  async getAutomationRules() {
    return this.request('/automation-rules');
  }

  async createAutomationRule(rule) {
    return this.request('/automation-rules', {
      method: 'POST',
      body: JSON.stringify(rule),
    });
  }

  async updateAutomationRule(id, rule) {
    return this.request(`/automation-rules/${id}`, {
      method: 'PUT',
      body: JSON.stringify(rule),
    });
  }

  async deleteAutomationRule(id) {
    return this.request(`/automation-rules/${id}`, {
      method: 'DELETE',
    });
  }
}

export const api = new ApiService();
export default api;
