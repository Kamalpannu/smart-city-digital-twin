"use client"

import { useState } from "react"
import { Play, RotateCcw, CheckCircle } from "lucide-react"

const ScenarioTesting = () => {
  const [scenario, setScenario] = useState({
    zone: "Zone A",
    event: "road_closure",
    duration: 60,
    intensity: "medium",
  })
  const [isRunning, setIsRunning] = useState(false)
  const [results, setResults] = useState(null)
  const [activeScenarios, setActiveScenarios] = useState([])

  const runScenario = async () => {
    setIsRunning(true)

    // Simulate API call delay
    await new Promise((resolve) => setTimeout(resolve, 2000))

    // Mock AI prediction results
    const mockResults = {
      prediction: `Running ${scenario.event} scenario in ${scenario.zone} for ${scenario.duration} minutes with ${scenario.intensity} intensity.`,
      impacts: {
        trafficIncrease: Math.floor(Math.random() * 40) + 20,
        pollutionChange: Math.floor(Math.random() * 30) + 10,
        estimatedDelay: Math.floor(Math.random() * 15) + 5,
      },
      recommendations: [
        "Activate alternative route suggestions",
        "Increase traffic signal timing on adjacent roads",
        "Deploy additional traffic management personnel",
        "Send real-time alerts to affected commuters",
      ],
      confidence: Math.floor(Math.random() * 20) + 80,
    }

    setResults(mockResults)

    // Add to active scenarios
    const newScenario = {
      id: Date.now(),
      ...scenario,
      startTime: new Date(),
      status: "running",
      results: mockResults,
    }
    setActiveScenarios([...activeScenarios, newScenario])

    setIsRunning(false)
  }

  const stopScenario = (id) => {
    setActiveScenarios(activeScenarios.map((s) => (s.id === id ? { ...s, status: "completed" } : s)))
  }

  const clearResults = () => {
    setResults(null)
    setActiveScenarios([])
  }

  return (
    <div>
      <div className="page-header">
        <h1 className="page-title">Scenario Testing</h1>
        <p className="page-subtitle">Test and predict city responses to various events</p>
      </div>

      <div className="grid grid-2">
        {/* Scenario Configuration */}
        <div className="card">
          <div className="card-header">
            <h2 className="card-title">Configure Scenario</h2>
          </div>

          <div className="form-group">
            <label className="form-label">Target Zone</label>
            <select
              className="form-select"
              value={scenario.zone}
              onChange={(e) => setScenario({ ...scenario, zone: e.target.value })}
            >
              <option value="Zone A">Zone A</option>
              <option value="Zone B">Zone B</option>
              <option value="Zone C">Zone C</option>
              <option value="All Zones">All Zones</option>
            </select>
          </div>

          <div className="form-group">
            <label className="form-label">Event Type</label>
            <select
              className="form-select"
              value={scenario.event}
              onChange={(e) => setScenario({ ...scenario, event: e.target.value })}
            >
              <option value="road_closure">Road Closure</option>
              <option value="pollution_spike">Pollution Spike</option>
              <option value="emergency_incident">Emergency Incident</option>
              <option value="weather_event">Severe Weather</option>
              <option value="mass_event">Mass Event</option>
            </select>
          </div>

          <div className="form-group">
            <label className="form-label">Duration (minutes)</label>
            <input
              type="number"
              className="form-input"
              value={scenario.duration}
              onChange={(e) => setScenario({ ...scenario, duration: Number.parseInt(e.target.value) })}
              min="15"
              max="480"
            />
          </div>

          <div className="form-group">
            <label className="form-label">Intensity</label>
            <select
              className="form-select"
              value={scenario.intensity}
              onChange={(e) => setScenario({ ...scenario, intensity: e.target.value })}
            >
              <option value="low">Low Impact</option>
              <option value="medium">Medium Impact</option>
              <option value="high">High Impact</option>
              <option value="critical">Critical Impact</option>
            </select>
          </div>

          <div style={{ display: "flex", gap: "12px", marginTop: "24px" }}>
            <button className="btn btn-primary" onClick={runScenario} disabled={isRunning}>
              <Play size={16} />
              {isRunning ? "Running..." : "Run Scenario"}
            </button>
            <button className="btn btn-secondary" onClick={clearResults}>
              <RotateCcw size={16} />
              Clear Results
            </button>
          </div>
        </div>

        {/* AI Prediction Results */}
        <div className="card">
          <div className="card-header">
            <h2 className="card-title">AI Prediction Results</h2>
          </div>

          {isRunning && (
            <div className="loading">
              <p>AI is analyzing scenario impacts...</p>
            </div>
          )}

          {results && (
            <div>
              <div style={{ marginBottom: "16px" }}>
                <h3 style={{ color: "#f8fafc", marginBottom: "8px" }}>Scenario Analysis</h3>
                <p style={{ color: "#94a3b8", lineHeight: "1.5" }}>{results.prediction}</p>
              </div>

              <div style={{ marginBottom: "16px" }}>
                <h3 style={{ color: "#f8fafc", marginBottom: "12px" }}>Predicted Impacts</h3>
                <div className="grid grid-3">
                  <div>
                    <p style={{ color: "#94a3b8", fontSize: "14px" }}>Traffic Increase</p>
                    <p style={{ color: "#ef4444", fontSize: "20px", fontWeight: "600" }}>
                      +{results.impacts.trafficIncrease}%
                    </p>
                  </div>
                  <div>
                    <p style={{ color: "#94a3b8", fontSize: "14px" }}>Pollution Change</p>
                    <p style={{ color: "#f59e0b", fontSize: "20px", fontWeight: "600" }}>
                      +{results.impacts.pollutionChange}
                    </p>
                  </div>
                  <div>
                    <p style={{ color: "#94a3b8", fontSize: "14px" }}>Avg. Delay</p>
                    <p style={{ color: "#3b82f6", fontSize: "20px", fontWeight: "600" }}>
                      {results.impacts.estimatedDelay} min
                    </p>
                  </div>
                </div>
              </div>

              <div style={{ marginBottom: "16px" }}>
                <h3 style={{ color: "#f8fafc", marginBottom: "12px" }}>Recommendations</h3>
                <ul style={{ listStyle: "none", padding: 0 }}>
                  {results.recommendations.map((rec, index) => (
                    <li
                      key={index}
                      style={{
                        display: "flex",
                        alignItems: "center",
                        gap: "8px",
                        marginBottom: "8px",
                        color: "#e2e8f0",
                      }}
                    >
                      <CheckCircle size={16} style={{ color: "#22c55e" }} />
                      {rec}
                    </li>
                  ))}
                </ul>
              </div>

              <div>
                <p style={{ color: "#94a3b8", fontSize: "14px" }}>
                  Prediction Confidence:
                  <span
                    style={{
                      color: results.confidence > 85 ? "#22c55e" : "#f59e0b",
                      fontWeight: "600",
                      marginLeft: "8px",
                    }}
                  >
                    {results.confidence}%
                  </span>
                </p>
              </div>
            </div>
          )}

          {!results && !isRunning && (
            <div style={{ textAlign: "center", padding: "40px", color: "#94a3b8" }}>
              <p>Configure and run a scenario to see AI predictions</p>
            </div>
          )}
        </div>
      </div>

      {/* Active Scenarios */}
      {activeScenarios.length > 0 && (
        <div className="card">
          <div className="card-header">
            <h2 className="card-title">Active Scenarios</h2>
          </div>

          <div className="grid grid-2">
            {activeScenarios.map((activeScenario) => (
              <div
                key={activeScenario.id}
                style={{
                  border: "1px solid rgba(34, 197, 94, 0.3)",
                  borderRadius: "8px",
                  padding: "16px",
                  background: "rgba(30, 41, 59, 0.5)",
                }}
              >
                <div
                  style={{
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "space-between",
                    marginBottom: "12px",
                  }}
                >
                  <h3 style={{ color: "#f8fafc" }}>
                    {activeScenario.event.replace("_", " ")} - {activeScenario.zone}
                  </h3>
                  <span className={`status-badge status-${activeScenario.status === "running" ? "warning" : "active"}`}>
                    {activeScenario.status}
                  </span>
                </div>

                <p style={{ color: "#94a3b8", fontSize: "14px", marginBottom: "8px" }}>
                  Duration: {activeScenario.duration} min | Intensity: {activeScenario.intensity}
                </p>

                <p style={{ color: "#94a3b8", fontSize: "14px", marginBottom: "12px" }}>
                  Started: {activeScenario.startTime.toLocaleTimeString()}
                </p>

                {activeScenario.status === "running" && (
                  <button
                    className="btn btn-danger"
                    onClick={() => stopScenario(activeScenario.id)}
                    style={{ padding: "4px 12px", fontSize: "14px" }}
                  >
                    Stop Scenario
                  </button>
                )}
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  )
}

export default ScenarioTesting
