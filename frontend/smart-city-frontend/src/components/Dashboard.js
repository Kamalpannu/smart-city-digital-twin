import {
  LineChart,
  Line,
  BarChart,
  Bar,
  PieChart,
  Pie,
  Cell,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
} from "recharts"
import { Thermometer, Droplets, Wind, Gauge, AlertTriangle } from "lucide-react"
import { useRealTimeData } from "../contexts/RealTimeDataContext"

const Dashboard = () => {
  const { weatherData, trafficData } = useRealTimeData()

  // Generate historical data for charts
  const generateHistoricalData = () => {
    const data = []
    for (let i = 23; i >= 0; i--) {
      const time = new Date()
      time.setHours(time.getHours() - i)
      data.push({
        time: time.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }),
        "Zone A": Math.floor(Math.random() * 40) + 30,
        "Zone B": Math.floor(Math.random() * 50) + 25,
        "Zone C": Math.floor(Math.random() * 30) + 20,
      })
    }
    return data
  }

  const trafficHistoryData = generateHistoricalData()
  const pollutionHistoryData = generateHistoricalData()

  const zoneData = trafficData?.zones
    ? Object.entries(trafficData.zones).map(([zone, data]) => ({
        zone,
        traffic: data.traffic,
        pollution: data.pollution,
      }))
    : []

  const pollutionDistribution = trafficData?.zones
    ? Object.entries(trafficData.zones).map(([zone, data]) => ({
        name: zone,
        value: data.pollution,
      }))
    : []

  const COLORS = ["#22c55e", "#3b82f6", "#f59e0b"]

  const getRerouteColor = (status) => {
    switch (status) {
      case "now":
        return "#ef4444"
      case "consider":
        return "#f59e0b"
      default:
        return "#22c55e"
    }
  }

  const getRerouteLabel = (status) => {
    switch (status) {
      case "now":
        return "Reroute Now"
      case "consider":
        return "Consider Reroute"
      default:
        return "No Action Needed"
    }
  }

  return (
    <div>
      <div className="page-header">
        <h1 className="page-title">Live Dashboard</h1>
        <p className="page-subtitle">Real-time monitoring and analytics</p>
      </div>

      {/* Weather Panel */}
      <div className="card">
        <div className="card-header">
          <h2 className="card-title">Weather Conditions</h2>
        </div>
        <div className="grid grid-4">
          <div style={{ display: "flex", alignItems: "center", gap: "12px" }}>
            <Thermometer style={{ color: "#ef4444" }} />
            <div>
              <p style={{ color: "#94a3b8", fontSize: "14px" }}>Temperature</p>
              <p style={{ color: "#f8fafc", fontSize: "20px", fontWeight: "600" }}>{weatherData?.temperature || 0}°C</p>
            </div>
          </div>
          <div style={{ display: "flex", alignItems: "center", gap: "12px" }}>
            <Droplets style={{ color: "#3b82f6" }} />
            <div>
              <p style={{ color: "#94a3b8", fontSize: "14px" }}>Humidity</p>
              <p style={{ color: "#f8fafc", fontSize: "20px", fontWeight: "600" }}>{weatherData?.humidity || 0}%</p>
            </div>
          </div>
          <div style={{ display: "flex", alignItems: "center", gap: "12px" }}>
            <Wind style={{ color: "#22c55e" }} />
            <div>
              <p style={{ color: "#94a3b8", fontSize: "14px" }}>Wind Speed</p>
              <p style={{ color: "#f8fafc", fontSize: "20px", fontWeight: "600" }}>
                {weatherData?.windSpeed || 0} km/h
              </p>
            </div>
          </div>
          <div style={{ display: "flex", alignItems: "center", gap: "12px" }}>
            <Gauge style={{ color: "#f59e0b" }} />
            <div>
              <p style={{ color: "#94a3b8", fontSize: "14px" }}>Pressure</p>
              <p style={{ color: "#f8fafc", fontSize: "20px", fontWeight: "600" }}>{weatherData?.pressure || 0} hPa</p>
            </div>
          </div>
        </div>
      </div>

      {/* Charts Grid */}
      <div className="grid grid-2">
        {/* Traffic Trends */}
        <div className="card">
          <div className="card-header">
            <h2 className="card-title">Traffic Trends (24h)</h2>
          </div>
          <ResponsiveContainer width="100%" height={300}>
            <LineChart data={trafficHistoryData}>
              <CartesianGrid strokeDasharray="3 3" stroke="rgba(34, 197, 94, 0.2)" />
              <XAxis dataKey="time" stroke="#94a3b8" />
              <YAxis stroke="#94a3b8" />
              <Tooltip
                contentStyle={{
                  backgroundColor: "rgba(30, 41, 59, 0.95)",
                  border: "1px solid rgba(34, 197, 94, 0.3)",
                  borderRadius: "6px",
                }}
              />
              <Line type="monotone" dataKey="Zone A" stroke="#22c55e" strokeWidth={2} />
              <Line type="monotone" dataKey="Zone B" stroke="#3b82f6" strokeWidth={2} />
              <Line type="monotone" dataKey="Zone C" stroke="#f59e0b" strokeWidth={2} />
            </LineChart>
          </ResponsiveContainer>
        </div>

        {/* Pollution Levels */}
        <div className="card">
          <div className="card-header">
            <h2 className="card-title">Pollution Levels (24h)</h2>
          </div>
          <ResponsiveContainer width="100%" height={300}>
            <LineChart data={pollutionHistoryData}>
              <CartesianGrid strokeDasharray="3 3" stroke="rgba(34, 197, 94, 0.2)" />
              <XAxis dataKey="time" stroke="#94a3b8" />
              <YAxis stroke="#94a3b8" />
              <Tooltip
                contentStyle={{
                  backgroundColor: "rgba(30, 41, 59, 0.95)",
                  border: "1px solid rgba(34, 197, 94, 0.3)",
                  borderRadius: "6px",
                }}
              />
              <Line type="monotone" dataKey="Zone A" stroke="#22c55e" strokeWidth={2} />
              <Line type="monotone" dataKey="Zone B" stroke="#3b82f6" strokeWidth={2} />
              <Line type="monotone" dataKey="Zone C" stroke="#f59e0b" strokeWidth={2} />
            </LineChart>
          </ResponsiveContainer>
        </div>

        {/* Current Zone Status */}
        <div className="card">
          <div className="card-header">
            <h2 className="card-title">Current Zone Status</h2>
          </div>
          <ResponsiveContainer width="100%" height={300}>
            <BarChart data={zoneData}>
              <CartesianGrid strokeDasharray="3 3" stroke="rgba(34, 197, 94, 0.2)" />
              <XAxis dataKey="zone" stroke="#94a3b8" />
              <YAxis stroke="#94a3b8" />
              <Tooltip
                contentStyle={{
                  backgroundColor: "rgba(30, 41, 59, 0.95)",
                  border: "1px solid rgba(34, 197, 94, 0.3)",
                  borderRadius: "6px",
                }}
              />
              <Bar dataKey="traffic" fill="#22c55e" />
              <Bar dataKey="pollution" fill="#ef4444" />
            </BarChart>
          </ResponsiveContainer>
        </div>

        {/* Pollution Distribution */}
        <div className="card">
          <div className="card-header">
            <h2 className="card-title">Pollution Distribution</h2>
          </div>
          <ResponsiveContainer width="100%" height={300}>
            <PieChart>
              <Pie
                data={pollutionDistribution}
                cx="50%"
                cy="50%"
                labelLine={false}
                label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}
                outerRadius={80}
                fill="#8884d8"
                dataKey="value"
              >
                {pollutionDistribution.map((entry, index) => (
                  <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                ))}
              </Pie>
              <Tooltip
                contentStyle={{
                  backgroundColor: "rgba(30, 41, 59, 0.95)",
                  border: "1px solid rgba(34, 197, 94, 0.3)",
                  borderRadius: "6px",
                }}
              />
            </PieChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* Reroute Alerts */}
      <div className="card">
        <div className="card-header">
          <h2 className="card-title">Reroute Recommendations</h2>
        </div>
        <div className="grid grid-3">
          {trafficData?.zones &&
            Object.entries(trafficData.zones).map(([zone, data]) => (
              <div
                key={zone}
                style={{
                  padding: "16px",
                  border: `1px solid ${getRerouteColor(data.reroute)}40`,
                  borderRadius: "8px",
                  background: `${getRerouteColor(data.reroute)}10`,
                }}
              >
                <div style={{ display: "flex", alignItems: "center", gap: "8px", marginBottom: "8px" }}>
                  <AlertTriangle style={{ color: getRerouteColor(data.reroute) }} size={20} />
                  <h3 style={{ color: "#f8fafc" }}>{zone}</h3>
                </div>
                <p style={{ color: "#94a3b8", fontSize: "14px", marginBottom: "4px" }}>
                  Traffic: {data.traffic}% | Pollution: {data.pollution}
                </p>
                <span
                  className="status-badge"
                  style={{
                    background: `${getRerouteColor(data.reroute)}20`,
                    color: getRerouteColor(data.reroute),
                  }}
                >
                  {getRerouteLabel(data.reroute)}
                </span>
              </div>
            ))}
        </div>
      </div>
    </div>
  )
}

export default Dashboard
