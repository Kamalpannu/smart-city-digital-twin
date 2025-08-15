const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000"

export interface WeatherData {
  temperature: number
  humidity: number
  windSpeed: number
  pollution: number
  pressure: number
  timestamp: string
}

export interface TrafficData {
  zones: {
    [key: string]: {
      traffic: number
      pollution: number
      reroute: "none" | "consider" | "now"
    }
  }
  timestamp: string
}

export interface AutomationRule {
  id: string
  name: string
  zone: string
  condition: string
  conditionValue: number
  action: string
  enabled: boolean
  priority: "low" | "medium" | "high"
  description: string
  createdAt: string
  lastTriggered?: string
}

export interface ScenarioRequest {
  ts: string
  zones: Array<{
    id: string
    traffic: number
    pollution: number
    event: string
  }>
}

export interface ScenarioPrediction {
  predicted_traffic: {
    [key: string]: number
  }
  reroute_suggested: {
    [key: string]: boolean
  }
  analysis: string
}

class SmartCityAPI {
  private async request<T>(endpoint: string, options?: RequestInit): Promise<T> {
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
      return this.getMockData(endpoint) as T
    }
  }

  private getMockData(endpoint: string): any {
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

  async getLatestWeather(): Promise<WeatherData> {
    return this.request<WeatherData>("/weather/latest")
  }

  async getLatestTraffic(): Promise<TrafficData> {
    return this.request<TrafficData>("/traffic/latest")
  }

  async getAutomationRules(): Promise<AutomationRule[]> {
    return this.request<AutomationRule[]>("/automation-rules")
  }

  async createAutomationRule(rule: Omit<AutomationRule, "id" | "createdAt">): Promise<AutomationRule> {
    return this.request<AutomationRule>("/automation-rules", {
      method: "POST",
      body: JSON.stringify(rule),
    })
  }

  async updateAutomationRule(id: string, rule: Partial<AutomationRule>): Promise<AutomationRule> {
    return this.request<AutomationRule>(`/automation-rules/${id}`, {
      method: "PUT",
      body: JSON.stringify(rule),
    })
  }

  async deleteAutomationRule(id: string): Promise<void> {
    return this.request<void>(`/automation-rules/${id}`, {
      method: "DELETE",
    })
  }

  async runScenario(scenario: ScenarioRequest): Promise<ScenarioPrediction> {
    return this.request<ScenarioPrediction>("/scenario-bulk", {
      method: "POST",
      body: JSON.stringify(scenario),
    })
  }
}

export const api = new SmartCityAPI()
