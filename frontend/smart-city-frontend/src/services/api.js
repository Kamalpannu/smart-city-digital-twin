const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:3001';

class ApiService {
  constructor() { this.baseURL = API_BASE_URL; }

  async request(endpoint, options = {}) {
    const url = `${this.baseURL}${endpoint}`;
    const config = { headers: { 'Content-Type': 'application/json', ...options.headers }, ...options };
    
    try {
      const response = await fetch(url, config);
      if (!response.ok) throw new Error(`HTTP error! status: ${response.status}`);
      return await response.json();
    } catch (error) {
      console.error(`API request failed for ${endpoint}:`, error);
      throw error;
    }
  }

  async getWeatherLatest() { return this.request('/weather/latest'); }
  async getTrafficLatest() { return this.request('/traffic/latest'); }
  async testScenario(data) { return this.request('/scenario-bulk', { method: 'POST', body: JSON.stringify(data) }); }
  async getAutomationRules() { return this.request('/automation-rules'); }
  async createAutomationRule(rule) { return this.request('/automation-rules', { method: 'POST', body: JSON.stringify(rule) }); }
  async updateAutomationRule(id, rule) { return this.request(`/automation-rules/${id}`, { method: 'PUT', body: JSON.stringify(rule) }); }
  async deleteAutomationRule(id) { return this.request(`/automation-rules/${id}`, { method: 'DELETE' }); }
}

export const api = new ApiService();
export default api;
