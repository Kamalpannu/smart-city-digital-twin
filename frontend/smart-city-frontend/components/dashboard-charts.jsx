import React, { useState, useEffect } from "react";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { CityMap3D } from "./city-map-3d";
import { Clock, CheckCircle, AlertTriangle } from "lucide-react";

export default function Dashboard() {
  const [weatherData, setWeatherData] = useState({
    temperature: "--",
    humidity: "--",
    wind: "--",
    pollution: "--",
  });

  const [trafficData, setTrafficData] = useState({
    zoneA: 0,
    zoneB: 0,
    zoneC: 0,
  });

  const [activeScenarios, setActiveScenarios] = useState([]);

  // Simulate fetching data from backend
  useEffect(() => {
    const interval = setInterval(() => {
      // Mock weather update
      setWeatherData({
        temperature: (20 + Math.random() * 10).toFixed(1),
        humidity: (40 + Math.random() * 20).toFixed(0),
        wind: (5 + Math.random() * 10).toFixed(1),
        pollution: (30 + Math.random() * 40).toFixed(0),
      });

      // Mock traffic update
      setTrafficData({
        zoneA: Math.floor(40 + Math.random() * 20),
        zoneB: Math.floor(25 + Math.random() * 20),
        zoneC: Math.floor(20 + Math.random() * 15),
      });
    }, 3000);

    return () => clearInterval(interval);
  }, []);

  const getStatusIcon = (status) => {
    switch (status) {
      case "running":
        return <Clock className="w-4 h-4 text-yellow-500" />;
      case "completed":
        return <CheckCircle className="w-4 h-4 text-green-500" />;
      default:
        return <AlertTriangle className="w-4 h-4 text-gray-400" />;
    }
  };

  return (
    <div className="space-y-6 p-4">
      <div>
        <h2 className="text-2xl font-bold">City Dashboard</h2>
        <p className="text-gray-500">Overview of city conditions and ongoing scenarios</p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Weather Card */}
        <Card>
          <CardHeader>
            <CardTitle>Weather</CardTitle>
          </CardHeader>
          <CardContent className="space-y-2">
            <div className="flex justify-between">
              <span>Temperature:</span>
              <span>{weatherData.temperature}°C</span>
            </div>
            <div className="flex justify-between">
              <span>Humidity:</span>
              <span>{weatherData.humidity}%</span>
            </div>
            <div className="flex justify-between">
              <span>Wind:</span>
              <span>{weatherData.wind} km/h</span>
            </div>
            <div className="flex justify-between">
              <span>Pollution:</span>
              <span>{weatherData.pollution}</span>
            </div>
          </CardContent>
        </Card>

        {/* Traffic Card */}
        <Card>
          <CardHeader>
            <CardTitle>Traffic Overview</CardTitle>
          </CardHeader>
          <CardContent className="space-y-2">
            {Object.entries(trafficData).map(([zone, value]) => (
              <div key={zone} className="space-y-1">
                <div className="flex justify-between text-sm">
                  <span>{zone.toUpperCase()}</span>
                  <span>{value}%</span>
                </div>
                <Progress value={value} className="h-2" />
              </div>
            ))}
          </CardContent>
        </Card>

        {/* Active Scenarios Card */}
        <Card>
          <CardHeader>
            <CardTitle>Active Scenarios</CardTitle>
          </CardHeader>
          <CardContent>
            {activeScenarios.length === 0 ? (
              <p className="text-center text-gray-500 py-4">No active scenarios</p>
            ) : (
              activeScenarios.map((scenario) => (
                <div key={scenario.id} className="p-2 border rounded mb-2">
                  <div className="flex justify-between items-center">
                    <div className="flex items-center gap-2">
                      {getStatusIcon(scenario.status)}
                      <span>{scenario.zone} - {scenario.eventType.replace("_", " ")}</span>
                    </div>
                    <Badge variant={scenario.status === "completed" ? "default" : "secondary"}>
                      {scenario.status}
                    </Badge>
                  </div>
                  {scenario.status === "running" && <Progress value={scenario.progress} className="h-2 mt-1" />}
                </div>
              ))
            )}
          </CardContent>
        </Card>
      </div>

      {/* City Map Visualization */}
      <Card>
        <CardHeader>
          <CardTitle>City Map</CardTitle>
          <p className="text-sm text-gray-500">3D view of city traffic</p>
        </CardHeader>
        <CardContent>
          <CityMap3D trafficData={trafficData} />
        </CardContent>
      </Card>
    </div>
  );
}
