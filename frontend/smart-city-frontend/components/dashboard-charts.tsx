"use client"

import { useState, useEffect } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { useRealTimeData } from "@/contexts/real-time-data-context"
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  BarChart,
  Bar,
  PieChart,
  Pie,
  Cell,
} from "recharts"

// Mock data generators for real-time simulation
const generateTrafficData = () => {
  const now = new Date()
  return Array.from({ length: 12 }, (_, i) => ({
    time: new Date(now.getTime() - (11 - i) * 5 * 60 * 1000).toLocaleTimeString("en-US", {
      hour12: false,
      hour: "2-digit",
      minute: "2-digit",
    }),
    zoneA: Math.floor(Math.random() * 40) + 60,
    zoneB: Math.floor(Math.random() * 30) + 30,
    zoneC: Math.floor(Math.random() * 20) + 20,
  }))
}

const generatePollutionData = () => {
  const now = new Date()
  return Array.from({ length: 12 }, (_, i) => ({
    time: new Date(now.getTime() - (11 - i) * 5 * 60 * 1000).toLocaleTimeString("en-US", {
      hour12: false,
      hour: "2-digit",
      minute: "2-digit",
    }),
    zoneA: Math.floor(Math.random() * 30) + 40,
    zoneB: Math.floor(Math.random() * 40) + 70,
    zoneC: Math.floor(Math.random() * 20) + 15,
  }))
}

const generateWeatherData = () => ({
  temperature: Math.floor(Math.random() * 15) + 20,
  humidity: Math.floor(Math.random() * 30) + 45,
  windSpeed: Math.floor(Math.random() * 10) + 5,
  pollution: Math.floor(Math.random() * 50) + 25,
  pressure: Math.floor(Math.random() * 20) + 1010,
})

export function DashboardCharts() {
  const { weatherData, trafficData, isConnected, lastUpdate } = useRealTimeData()
  const [trafficHistory, setTrafficHistory] = useState<any[]>([])
  const [pollutionHistory, setPollutionHistory] = useState<any[]>([])

  useEffect(() => {
    if (trafficData) {
      const now = new Date()
      const timeString = now.toLocaleTimeString("en-US", {
        hour12: false,
        hour: "2-digit",
        minute: "2-digit",
      })

      const newTrafficPoint = {
        time: timeString,
        zoneA: trafficData.zones["Zone A"]?.traffic || 0,
        zoneB: trafficData.zones["Zone B"]?.traffic || 0,
        zoneC: trafficData.zones["Zone C"]?.traffic || 0,
      }

      const newPollutionPoint = {
        time: timeString,
        zoneA: trafficData.zones["Zone A"]?.pollution || 0,
        zoneB: trafficData.zones["Zone B"]?.pollution || 0,
        zoneC: trafficData.zones["Zone C"]?.pollution || 0,
      }

      setTrafficHistory((prev) => [...prev.slice(-11), newTrafficPoint])
      setPollutionHistory((prev) => [...prev.slice(-11), newPollutionPoint])
    }
  }, [trafficData])

  const rerouteAlerts = trafficData
    ? Object.entries(trafficData.zones).map(([zone, data]) => ({
        zone,
        status: data.reroute,
        message:
          data.reroute === "now"
            ? `Critical congestion - immediate reroute required`
            : data.reroute === "consider"
              ? `Heavy traffic detected - consider alternative routes`
              : `Normal traffic conditions`,
        priority: data.reroute === "now" ? "high" : data.reroute === "consider" ? "medium" : "low",
      }))
    : []

  const getAlertColor = (status: string) => {
    switch (status) {
      case "now":
        return "bg-destructive text-destructive-foreground"
      case "consider":
        return "bg-secondary text-secondary-foreground"
      default:
        return "bg-primary text-primary-foreground"
    }
  }

  const zoneDistribution = trafficData
    ? Object.entries(trafficData.zones).map(([zone, data], index) => ({
        name: zone,
        value: data.traffic,
        color: index === 0 ? "hsl(var(--chart-3))" : index === 1 ? "hsl(var(--chart-1))" : "hsl(var(--chart-4))",
      }))
    : []

  return (
    <div className="grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-3 gap-6">
      {/* Connection Status */}
      <div className="xl:col-span-3 mb-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div
              className={`w-2 h-2 rounded-full ${isConnected ? "bg-primary animate-pulse" : "bg-destructive"}`}
            ></div>
            <span className="text-sm font-serif text-muted-foreground">
              {isConnected ? "Connected" : "Disconnected"} • Last update: {lastUpdate?.toLocaleTimeString() || "Never"}
            </span>
          </div>
        </div>
      </div>

      {/* Traffic Trends */}
      <Card className="xl:col-span-2">
        <CardHeader>
          <CardTitle className="font-sans text-card-foreground">Traffic Trends</CardTitle>
          <p className="text-sm text-muted-foreground font-serif">Real-time traffic flow by zone</p>
        </CardHeader>
        <CardContent>
          <ResponsiveContainer width="100%" height={300}>
            <LineChart data={trafficHistory}>
              <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
              <XAxis dataKey="time" stroke="hsl(var(--muted-foreground))" fontSize={12} />
              <YAxis stroke="hsl(var(--muted-foreground))" fontSize={12} />
              <Tooltip
                contentStyle={{
                  backgroundColor: "hsl(var(--card))",
                  border: "1px solid hsl(var(--border))",
                  borderRadius: "8px",
                }}
              />
              <Line type="monotone" dataKey="zoneA" stroke="hsl(var(--chart-3))" strokeWidth={2} name="Zone A" />
              <Line type="monotone" dataKey="zoneB" stroke="hsl(var(--chart-1))" strokeWidth={2} name="Zone B" />
              <Line type="monotone" dataKey="zoneC" stroke="hsl(var(--chart-4))" strokeWidth={2} name="Zone C" />
            </LineChart>
          </ResponsiveContainer>
        </CardContent>
      </Card>

      {/* Weather Panel */}
      <Card>
        <CardHeader>
          <CardTitle className="font-sans text-card-foreground">Weather Conditions</CardTitle>
          <p className="text-sm text-muted-foreground font-serif">Current environmental data</p>
        </CardHeader>
        <CardContent className="space-y-4">
          {weatherData ? (
            <>
              <div className="grid grid-cols-2 gap-4">
                <div className="text-center p-3 bg-muted/50 rounded-lg">
                  <div className="text-2xl font-bold text-primary">{weatherData.temperature}°C</div>
                  <div className="text-xs text-muted-foreground font-serif">Temperature</div>
                </div>
                <div className="text-center p-3 bg-muted/50 rounded-lg">
                  <div className="text-2xl font-bold text-primary">{weatherData.humidity}%</div>
                  <div className="text-xs text-muted-foreground font-serif">Humidity</div>
                </div>
                <div className="text-center p-3 bg-muted/50 rounded-lg">
                  <div className="text-2xl font-bold text-primary">{weatherData.windSpeed} km/h</div>
                  <div className="text-xs text-muted-foreground font-serif">Wind Speed</div>
                </div>
                <div className="text-center p-3 bg-muted/50 rounded-lg">
                  <div className="text-2xl font-bold text-primary">{weatherData.pressure} hPa</div>
                  <div className="text-xs text-muted-foreground font-serif">Pressure</div>
                </div>
              </div>
              <div className="p-3 bg-accent/10 rounded-lg border border-accent/20">
                <div className="flex items-center justify-between">
                  <span className="text-sm font-serif text-card-foreground">Air Quality Index</span>
                  <Badge
                    className={
                      weatherData.pollution > 50
                        ? "bg-destructive text-destructive-foreground"
                        : "bg-primary text-primary-foreground"
                    }
                  >
                    {weatherData.pollution > 50 ? "Poor" : "Good"}
                  </Badge>
                </div>
                <div className="text-lg font-bold text-accent mt-1">{weatherData.pollution} AQI</div>
              </div>
            </>
          ) : (
            <div className="text-center py-8 text-muted-foreground font-serif">Loading weather data...</div>
          )}
        </CardContent>
      </Card>

      {/* Pollution Trends */}
      <Card className="xl:col-span-2">
        <CardHeader>
          <CardTitle className="font-sans text-card-foreground">Pollution Levels</CardTitle>
          <p className="text-sm text-muted-foreground font-serif">Environmental monitoring by zone</p>
        </CardHeader>
        <CardContent>
          <ResponsiveContainer width="100%" height={300}>
            <BarChart data={pollutionHistory}>
              <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
              <XAxis dataKey="time" stroke="hsl(var(--muted-foreground))" fontSize={12} />
              <YAxis stroke="hsl(var(--muted-foreground))" fontSize={12} />
              <Tooltip
                contentStyle={{
                  backgroundColor: "hsl(var(--card))",
                  border: "1px solid hsl(var(--border))",
                  borderRadius: "8px",
                }}
              />
              <Bar dataKey="zoneA" fill="hsl(var(--chart-3))" name="Zone A" />
              <Bar dataKey="zoneB" fill="hsl(var(--chart-1))" name="Zone B" />
              <Bar dataKey="zoneC" fill="hsl(var(--chart-4))" name="Zone C" />
            </BarChart>
          </ResponsiveContainer>
        </CardContent>
      </Card>

      {/* Zone Distribution */}
      <Card>
        <CardHeader>
          <CardTitle className="font-sans text-card-foreground">Zone Activity</CardTitle>
          <p className="text-sm text-muted-foreground font-serif">Current activity distribution</p>
        </CardHeader>
        <CardContent>
          {zoneDistribution.length > 0 ? (
            <>
              <ResponsiveContainer width="100%" height={200}>
                <PieChart>
                  <Pie
                    data={zoneDistribution}
                    cx="50%"
                    cy="50%"
                    innerRadius={40}
                    outerRadius={80}
                    paddingAngle={5}
                    dataKey="value"
                  >
                    {zoneDistribution.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={entry.color} />
                    ))}
                  </Pie>
                  <Tooltip
                    contentStyle={{
                      backgroundColor: "hsl(var(--card))",
                      border: "1px solid hsl(var(--border))",
                      borderRadius: "8px",
                    }}
                  />
                </PieChart>
              </ResponsiveContainer>
              <div className="mt-4 space-y-2">
                {zoneDistribution.map((zone, index) => (
                  <div key={index} className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <div className="w-3 h-3 rounded-full" style={{ backgroundColor: zone.color }}></div>
                      <span className="text-sm font-serif text-card-foreground">{zone.name}</span>
                    </div>
                    <span className="text-sm font-medium text-card-foreground">{zone.value}%</span>
                  </div>
                ))}
              </div>
            </>
          ) : (
            <div className="text-center py-8 text-muted-foreground font-serif">Loading zone data...</div>
          )}
        </CardContent>
      </Card>

      {/* Reroute Alerts */}
      <Card className="xl:col-span-3">
        <CardHeader>
          <CardTitle className="font-sans text-card-foreground">Reroute Alerts</CardTitle>
          <p className="text-sm text-muted-foreground font-serif">Color-coded traffic management recommendations</p>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {rerouteAlerts.map((alert, index) => (
              <div key={index} className="p-4 border border-border rounded-lg bg-card/50">
                <div className="flex items-center justify-between mb-2">
                  <h4 className="font-medium font-sans text-card-foreground">{alert.zone}</h4>
                  <Badge className={getAlertColor(alert.status)}>
                    {alert.status === "now" ? "Reroute Now" : alert.status === "consider" ? "Consider" : "Normal"}
                  </Badge>
                </div>
                <p className="text-sm text-muted-foreground font-serif">{alert.message}</p>
                <div className="mt-2">
                  <span
                    className={`text-xs px-2 py-1 rounded-full ${
                      alert.priority === "high"
                        ? "bg-destructive/20 text-destructive"
                        : alert.priority === "medium"
                          ? "bg-secondary/20 text-secondary-foreground"
                          : "bg-primary/20 text-primary"
                    }`}
                  >
                    {alert.priority.toUpperCase()} PRIORITY
                  </span>
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
