"use client"

import { useState } from "react"
import { Building2, BarChart3, Settings, TestTube } from "lucide-react"
import CityMap3D from "./components/CityMap3D"
import Dashboard from "./components/Dashboard"
import AutomationRules from "./components/AutomationRules"
import ScenarioTesting from "./components/ScenarioTesting"
import { RealTimeDataProvider } from "./contexts/RealTimeDataContext"
import "./index.css"

const App = () => {
  const [activeTab, setActiveTab] = useState("map")

  const navItems = [
    { id: "map", label: "3D City Map", icon: Building2 },
    { id: "dashboard", label: "Live Dashboard", icon: BarChart3 },
    { id: "automation", label: "Automation Rules", icon: Settings },
    { id: "scenarios", label: "Scenario Testing", icon: TestTube },
  ]

  const renderContent = () => {
    switch (activeTab) {
      case "map":
        return <CityMap3D />
      case "dashboard":
        return <Dashboard />
      case "automation":
        return <AutomationRules />
      case "scenarios":
        return <ScenarioTesting />
      default:
        return <CityMap3D />
    }
  }

  return (
    <RealTimeDataProvider>
      <div className="app">
        <div className="sidebar">
          <div className="logo">
            <Building2 className="logo-icon" />
            <span className="logo-text">Smart City Control</span>
          </div>

          <nav>
            <ul className="nav-menu">
              {navItems.map((item) => {
                const Icon = item.icon
                return (
                  <li
                    key={item.id}
                    className={`nav-item ${activeTab === item.id ? "active" : ""}`}
                    onClick={() => setActiveTab(item.id)}
                  >
                    <Icon className="nav-icon" />
                    <span>{item.label}</span>
                  </li>
                )
              })}
            </ul>
          </nav>
        </div>

        <main className="main-content">{renderContent()}</main>
      </div>
    </RealTimeDataProvider>
  )
}

export default App
