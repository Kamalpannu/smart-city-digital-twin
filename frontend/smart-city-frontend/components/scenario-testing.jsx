import React, { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Progress } from "@/components/ui/progress";
import { Play, RotateCcw, AlertTriangle, CheckCircle, Clock } from "lucide-react";
import { CityMap3D } from "./city-map-3d";

export default function ScenarioTesting() {
  const [formData, setFormData] = useState({
    zone: "",
    eventType: "",
    duration: 30,
    intensity: 50,
    description: "",
  });
  const [activeScenarios, setActiveScenarios] = useState([]);
  const [isRunning, setIsRunning] = useState(false);
  const [lastPrediction, setLastPrediction] = useState(null);

  const generatePrediction = async (scenario) => {
    await new Promise((resolve) => setTimeout(resolve, 2000));

    const baseTraffic = { zoneA: 45, zoneB: 30, zoneC: 25 };
    const impactMultiplier = scenario.intensity / 100;
    let prediction;

    if (scenario.eventType === "road_closure") {
      const targetZone = scenario.zone.toLowerCase().replace("zone ", "");
      prediction = {
        predicted_traffic: {
          ...baseTraffic,
          [targetZone]: Math.min(95, baseTraffic[targetZone] + 40 * impactMultiplier),
          zoneA: targetZone !== "zonea" ? baseTraffic.zoneA + 15 * impactMultiplier : baseTraffic.zoneA,
          zoneB: targetZone !== "zoneb" ? baseTraffic.zoneB + 15 * impactMultiplier : baseTraffic.zoneB,
          zoneC: targetZone !== "zonec" ? baseTraffic.zoneC + 15 * impactMultiplier : baseTraffic.zoneC,
        },
        reroute_suggested: {
          zoneA: targetZone === "zonea" || impactMultiplier > 0.7,
          zoneB: targetZone === "zoneb" || impactMultiplier > 0.7,
          zoneC: targetZone === "zonec" || impactMultiplier > 0.7,
        },
        analysis: `Road closure in ${scenario.zone} will significantly impact traffic flow. Expected ${Math.round(
          40 * impactMultiplier
        )}% increase in congestion. Rerouting recommended.`,
        impact_score: Math.round(70 + 25 * impactMultiplier),
        recommendations: [
          "Activate dynamic traffic signals",
          "Deploy traffic personnel",
          "Send real-time alerts to commuters",
          "Consider public transport alternatives",
        ],
        estimated_duration: scenario.duration + Math.round(15 * impactMultiplier),
      };
    } else {
      const targetZone = scenario.zone.toLowerCase().replace("zone ", "");
      prediction = {
        predicted_traffic: {
          ...baseTraffic,
          [targetZone]: Math.max(10, baseTraffic[targetZone] - 20 * impactMultiplier),
        },
        reroute_suggested: {
          zoneA: targetZone === "zonea",
          zoneB: targetZone === "zoneb",
          zoneC: targetZone === "zonec",
        },
        analysis: `Pollution spike in ${scenario.zone}. Traffic likely reduced by ${Math.round(
          20 * impactMultiplier
        )}%. Health advisories recommended.`,
        impact_score: Math.round(60 + 30 * impactMultiplier),
        recommendations: [
          "Issue health advisory alerts",
          "Increase air quality monitoring",
          "Restrict heavy vehicle access",
          "Activate pollution control measures",
        ],
        estimated_duration: scenario.duration + Math.round(30 * impactMultiplier),
      };
    }

    return prediction;
  };

  const handleRunScenario = async () => {
    if (!formData.zone || !formData.eventType) return;

    setIsRunning(true);

    try {
      const prediction = await generatePrediction(formData);
      setLastPrediction(prediction);

      const newScenario = {
        ...formData,
        id: Date.now().toString(),
        startTime: new Date(),
        prediction,
        status: "running",
        progress: 0,
      };

      setActiveScenarios((prev) => [newScenario, ...prev]);

      const progressInterval = setInterval(() => {
        setActiveScenarios((prev) =>
          prev.map((scenario) => {
            if (scenario.id === newScenario.id && scenario.status === "running") {
              const newProgress = Math.min(100, scenario.progress + 2);
              return {
                ...scenario,
                progress: newProgress,
                status: newProgress === 100 ? "completed" : "running",
              };
            }
            return scenario;
          })
        );
      }, 100);

      setTimeout(() => clearInterval(progressInterval), formData.duration * 1000);
    } catch (error) {
      console.error(error);
    } finally {
      setIsRunning(false);
    }
  };

  const handleReset = () => {
    setFormData({ zone: "", eventType: "", duration: 30, intensity: 50, description: "" });
    setLastPrediction(null);
  };

  const getImpactColor = (score) => (score >= 80 ? "text-red-600" : score >= 60 ? "text-yellow-600" : "text-green-600");

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
        <h2 className="text-2xl font-bold">Scenario Testing</h2>
        <p className="text-gray-500">Test various urban scenarios and analyze their impacts</p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Scenario Configuration */}
        <div className="lg:col-span-1 space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Configure Scenario</CardTitle>
              <p className="text-sm text-gray-500">Set up your simulation parameters</p>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <Label>Target Zone</Label>
                <Select value={formData.zone} onValueChange={(val) => setFormData({ ...formData, zone: val })}>
                  <SelectTrigger>
                    <SelectValue placeholder="Select zone" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="Zone A">Zone A - Downtown</SelectItem>
                    <SelectItem value="Zone B">Zone B - Industrial</SelectItem>
                    <SelectItem value="Zone C">Zone C - Residential</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div>
                <Label>Event Type</Label>
                <Select value={formData.eventType} onValueChange={(val) => setFormData({ ...formData, eventType: val })}>
                  <SelectTrigger>
                    <SelectValue placeholder="Select event type" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="road_closure">Road Closure</SelectItem>
                    <SelectItem value="pollution_spike">Pollution Spike</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="grid grid-cols-2 gap-2">
                <div>
                  <Label>Duration (min)</Label>
                  <Input
                    type="number"
                    value={formData.duration}
                    onChange={(e) => setFormData({ ...formData, duration: Number(e.target.value) })}
                  />
                </div>
                <div>
                  <Label>Intensity (%)</Label>
                  <Input
                    type="number"
                    value={formData.intensity}
                    onChange={(e) => setFormData({ ...formData, intensity: Number(e.target.value) })}
                  />
                </div>
              </div>

              <div>
                <Label>Description</Label>
                <Textarea
                  value={formData.description}
                  onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                  rows={3}
                  placeholder="Optional description"
                />
              </div>

              <div className="flex gap-2">
                <Button onClick={handleRunScenario} disabled={isRunning || !formData.zone || !formData.eventType}>
                  <Play className="w-4 h-4 mr-2" />
                  {isRunning ? "Running..." : "Run Scenario"}
                </Button>
                <Button variant="outline" onClick={handleReset}>
                  <RotateCcw className="w-4 h-4" />
                </Button>
              </div>
            </CardContent>
          </Card>

          {/* Active Scenarios */}
          <Card>
            <CardHeader>
              <CardTitle>Active Scenarios</CardTitle>
            </CardHeader>
            <CardContent>
              {activeScenarios.length === 0 ? (
                <p className="text-center text-gray-500 py-4">No active scenarios</p>
              ) : (
                activeScenarios.slice(0, 3).map((scenario) => (
                  <div key={scenario.id} className="p-3 border rounded bg-gray-100 mb-2">
                    <div className="flex justify-between items-center mb-2">
                      <div className="flex items-center gap-2">
                        {getStatusIcon(scenario.status)}
                        <span>
                          {scenario.zone} - {scenario.eventType.replace("_", " ")}
                        </span>
                      </div>
                      <Badge variant={scenario.status === "completed" ? "default" : "secondary"}>
                        {scenario.status}
                      </Badge>
                    </div>
                    {scenario.status === "running" && <Progress value={scenario.progress} className="h-2" />}
                  </div>
                ))
              )}
            </CardContent>
          </Card>
        </div>

        {/* Visualization & Results */}
        <div className="lg:col-span-2 space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Scenario Visualization</CardTitle>
              <p className="text-sm text-gray-500">3D map showing predicted scenario impacts</p>
            </CardHeader>
            <CardContent>
              <CityMap3D trafficData={lastPrediction?.predicted_traffic} />
            </CardContent>
          </Card>

          {lastPrediction && (
            <Card>
              <CardHeader>
                <CardTitle>AI Prediction Results</CardTitle>
                <p className="text-sm text-gray-500">Analysis and recommendations</p>
              </CardHeader>
              <CardContent>
                <Alert>
                  <AlertTriangle className="h-4 w-4" />
                  <AlertDescription>
                    <strong>Impact Score: </strong>
                    <span className={getImpactColor(lastPrediction.impact_score)}>
                      {lastPrediction.impact_score}/100
                    </span>
                  </AlertDescription>
                </Alert>

                <div className="grid md:grid-cols-2 gap-4">
                  <div>
                    <h4>Predicted Traffic</h4>
                    {Object.entries(lastPrediction.predicted_traffic).map(([zone, value]) => (
                      <div key={zone} className="flex justify-between">
                        <span>{zone.toUpperCase()}</span>
                        <span>{value}%</span>
                      </div>
                    ))}
                  </div>

                  <div>
                    <h4>Reroute Suggestions</h4>
                    {Object.entries(lastPrediction.reroute_suggested).map(([zone, suggested]) => (
                      <div key={zone} className="flex justify-between">
                        <span>{zone.toUpperCase()}</span>
                        <Badge variant={suggested ? "destructive" : "default"}>
                          {suggested ? "Reroute" : "Normal"}
                        </Badge>
                      </div>
                    ))}
                  </div>
                </div>

                <div>
                  <h4>Analysis</h4>
                  <p>{lastPrediction.analysis}</p>
                </div>

                <div>
                  <h4>Recommendations</h4>
                  <ul>
                    {lastPrediction.recommendations.map((rec, idx) => (
                      <li key={idx} className="flex items-center gap-2">
                        <div className="w-1.5 h-1.5 bg-blue-500 rounded-full"></div>
                        {rec}
                      </li>
                    ))}
                  </ul>
                </div>

                <div className="pt-2 border-t mt-2">
                  <strong>Estimated Duration: </strong>
                  {lastPrediction.estimated_duration} minutes
                </div>
              </CardContent>
            </Card>
          )}
        </div>
      </div>
    </div>
  );
}
