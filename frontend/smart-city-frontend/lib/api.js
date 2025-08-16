const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000"

class SmartCityAPI {
  async request(endpoint, options) {
    try {
      const response = await fetch(`${API_BASE_URL}${endpoint}`, {
        headers: {
          "Content-Type": "application/json",
          ...options?.headers,
        },
        ...options,
      })

      if (!response.ok) {
        throw new Error(`API Error: ${response.status} ${response.statusText}`)
      }

      return await response.json()
    } catch (error) {
      console.error(`API request failed for ${endpoint}:`, error)
      // Return mock data for development
      return this.getMockData(endpoint)
    }
  }

  getMockData(endpoint) {
    const now = new Date().toISOString()

    switch (endpoint) {
      case "/weather/latest":
        return {
          temperature: Math.floor(Math.random() * 15) + 20,
          humidity: Math.floor(Math.random() * 30) + 45,
          windSpeed: Math.floor(Math.random() * 10) + 5,
          pollution: Math.floor(Math.random() * 50) + 25,
          pressure: Math.floor(Math.random() * 20) + 1010,
          timestamp: now,
        }

      case "/traffic/latest":
        return {
          zones: {
            "Zone A": {
              traffic: Math.floor(Math.random() * 40) + 60,
              pollution: Math.floor(Math.random() * 30) + 40,
              reroute: Math.random() > 0.7 ? "consider" : Math.random() > 0.9 ? "now" : "none",
            },
            "Zone B": {
              traffic: Math.floor(Math.random() * 30) + 30,
              pollution: Math.floor(Math.random() * 40) + 70,
              reroute: Math.random() > 0.6 ? "now" : Math.random() > 0.8 ? "consider" : "none",
            },
            "Zone C": {
              traffic: Math.floor(Math.random() * 20) + 20,
              pollution: Math.floor(Math.random() * 20) + 15,
              reroute: Math.random() > 0.9 ? "consider" : "none",
            },
          },
          timestamp: now,
        }

      default:
        return {}
    }
  }

  async getLatestWeather() {
    return this.request("/weather/latest")
  }

  async getLatestTraffic() {
    return this.request("/traffic/latest")
  }

  async getAutomationRules() {
    return this.request("/automation-rules")
  }

  async createAutomationRule(rule) {
    return this.request("/automation-rules", {
      method: "POST",
      body: JSON.stringify(rule),
    })
  }

  async updateAutomationRule(id, rule) {
    return this.request(`/automation-rules/${id}`, {
      method: "PUT",
      body: JSON.stringify(rule),
    })
  }

  async deleteAutomationRule(id) {
    return this.request(`/automation-rules/${id}`, {
      method: "DELETE",
    })
  }

  async runScenario(scenario) {
    return this.request("/scenario-bulk", {
      method: "POST",
      body: JSON.stringify(scenario),
    })
  }
}

export const api = new SmartCityAPI()
