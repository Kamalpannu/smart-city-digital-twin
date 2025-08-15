"use client"

import { useState } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { Progress } from "@/components/ui/progress"
import { Play, RotateCcw, AlertTriangle, CheckCircle, Clock } from "lucide-react"
import { CityMap3D } from "./city-map-3d"

interface ScenarioData {
  zone: string
  eventType: string
  duration: number
  intensity: number
  description: string
}

interface PredictionResult {
  predicted_traffic: {
    zoneA: number
    zoneB: number
    zoneC: number
  }
  reroute_suggested: {
    zoneA: boolean
    zoneB: boolean
    zoneC: boolean
  }
  analysis: string
  impact_score: number
  recommendations: string[]
  estimated_duration: number
}

interface ActiveScenario extends ScenarioData {
  id: string
  startTime: Date
  prediction: PredictionResult
  status: "running" | "completed" | "cancelled"
  progress: number
}

export function ScenarioTesting() {
  const [formData, setFormData] = useState<ScenarioData>({
    zone: "",
    eventType: "",
    duration: 30,
    intensity: 50,
    description: "",
  })
  const [activeScenarios, setActiveScenarios] = useState<ActiveScenario[]>([])
  const [isRunning, setIsRunning] = useState(false)
  const [lastPrediction, setLastPrediction] = useState<PredictionResult | null>(null)

  // Mock AI prediction function (in real app, this would call /scenario-bulk)
  const generatePrediction = async (scenario: ScenarioData): Promise<PredictionResult> => {
    // Simulate API delay
    await new Promise((resolve) => setTimeout(resolve, 2000))

    const baseTraffic = { zoneA: 45, zoneB: 30, zoneC: 25 }
    const impactMultiplier = scenario.intensity / 100

    let prediction: PredictionResult

    if (scenario.eventType === "road_closure") {
      const targetZone = scenario.zone.toLowerCase().replace("zone ", "") as keyof typeof baseTraffic
      prediction = {
        predicted_traffic: {
          ...baseTraffic,
          [targetZone]: Math.min(95, baseTraffic[targetZone] + 40 * impactMultiplier),
          // Increase traffic in other zones due to rerouting
          zoneA: targetZone !== "zoneA" ? baseTraffic.zoneA + 15 * impactMultiplier : baseTraffic.zoneA,
          zoneB: targetZone !== "zoneB" ? baseTraffic.zoneB + 15 * impactMultiplier : baseTraffic.zoneB,
          zoneC: targetZone !== "zoneC" ? baseTraffic.zoneC + 15 * impactMultiplier : baseTraffic.zoneC,
        },
        reroute_suggested: {
          zoneA: targetZone === "zoneA" || impactMultiplier > 0.7,
          zoneB: targetZone === "zoneB" || impactMultiplier > 0.7,
          zoneC: targetZone === "zoneC" || impactMultiplier > 0.7,
        },
        analysis: `Road closure in ${scenario.zone} will significantly impact traffic flow. Expected ${Math.round(
          40 * impactMultiplier,
        )}% increase in congestion. Rerouting through alternative zones recommended.`,
        impact_score: Math.round(70 + 25 * impactMultiplier),
        recommendations: [
          "Activate dynamic traffic signals",
          "Deploy traffic management personnel",
          "Send real-time alerts to commuters",
          "Consider public transport alternatives",
        ],
        estimated_duration: scenario.duration + Math.round(15 * impactMultiplier),
      }
    } else {
      // pollution_spike
      const targetZone = scenario.zone.toLowerCase().replace("zone ", "") as keyof typeof baseTraffic
      prediction = {
        predicted_traffic: {
          ...baseTraffic,
          [targetZone]: Math.max(10, baseTraffic[targetZone] - 20 * impactMultiplier),
        },
        reroute_suggested: {
          zoneA: targetZone === "zoneA",
          zoneB: targetZone === "zoneB",
          zoneC: targetZone === "zoneC",
        },
        analysis: `Pollution spike in ${scenario.zone} detected. Air quality degradation will likely reduce traffic by ${Math.round(
          20 * impactMultiplier,
        )}% as people avoid the area. Health advisories recommended.`,
        impact_score: Math.round(60 + 30 * impactMultiplier),
        recommendations: [
          "Issue health advisory alerts",
          "Increase air quality monitoring",
          "Restrict heavy vehicle access",
          "Activate pollution control measures",
        ],
        estimated_duration: scenario.duration + Math.round(30 * impactMultiplier),
      }
    }

    return prediction
  }

  const handleRunScenario = async () => {
    if (!formData.zone || !formData.eventType) return

    setIsRunning(true)

    try {
      const prediction = await generatePrediction(formData)
      setLastPrediction(prediction)

      const newScenario: ActiveScenario = {
        ...formData,
        id: Date.now().toString(),
        startTime: new Date(),
        prediction,
        status: "running",
        progress: 0,
      }

      setActiveScenarios((prev) => [newScenario, ...prev])

      // Simulate scenario progress
      const progressInterval = setInterval(() => {
        setActiveScenarios((prev) =>
          prev.map((scenario) => {
            if (scenario.id === newScenario.id && scenario.status === "running") {
              const newProgress = Math.min(100, scenario.progress + 2)
              return {
                ...scenario,
                progress: newProgress,
                status: newProgress === 100 ? "completed" : "running",
              }
            }
            return scenario
          }),
        )
      }, 100)

      setTimeout(() => {
        clearInterval(progressInterval)
      }, formData.duration * 1000)
    } catch (error) {
      console.error("Failed to run scenario:", error)
    } finally {
      setIsRunning(false)
    }
  }

  const handleReset = () => {
    setFormData({
      zone: "",
      eventType: "",
      duration: 30,
      intensity: 50,
      description: "",
    })
    setLastPrediction(null)
  }

  const getImpactColor = (score: number) => {
    if (score >= 80) return "text-destructive"
    if (score >= 60) return "text-secondary"
    return "text-primary"
  }

  const getStatusIcon = (status: string) => {
    switch (status) {
      case "running":
        return <Clock className="w-4 h-4 text-secondary" />
      case "completed":
        return <CheckCircle className="w-4 h-4 text-primary" />
      default:
        return <AlertTriangle className="w-4 h-4 text-muted-foreground" />
    }
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h2 className="text-2xl font-sans font-bold text-foreground">Scenario Testing</h2>
        <p className="text-muted-foreground font-serif">Test various urban scenarios and analyze their impacts</p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Scenario Configuration */}
        <div className="lg:col-span-1 space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="font-sans text-card-foreground">Configure Scenario</CardTitle>
              <p className="text-sm text-muted-foreground font-serif">Set up your simulation parameters</p>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="zone" className="font-serif">
                  Target Zone
                </Label>
                <Select value={formData.zone} onValueChange={(value) => setFormData({ ...formData, zone: value })}>
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

              <div className="space-y-2">
                <Label htmlFor="eventType" className="font-serif">
                  Event Type
                </Label>
                <Select
                  value={formData.eventType}
                  onValueChange={(value) => setFormData({ ...formData, eventType: value })}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select event type" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="road_closure">Road Closure</SelectItem>
                    <SelectItem value="pollution_spike">Pollution Spike</SelectItem>
                    <SelectItem value="emergency_event">Emergency Event</SelectItem>
                    <SelectItem value="weather_incident">Weather Incident</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="grid grid-cols-2 gap-2">
                <div className="space-y-2">
                  <Label htmlFor="duration" className="font-serif">
                    Duration (min)
                  </Label>
                  <Input
                    id="duration"
                    type="number"
                    value={formData.duration}
                    onChange={(e) => setFormData({ ...formData, duration: Number(e.target.value) })}
                    min="5"
                    max="480"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="intensity" className="font-serif">
                    Intensity (%)
                  </Label>
                  <Input
                    id="intensity"
                    type="number"
                    value={formData.intensity}
                    onChange={(e) => setFormData({ ...formData, intensity: Number(e.target.value) })}
                    min="10"
                    max="100"
                  />
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="description" className="font-serif">
                  Description (Optional)
                </Label>
                <Textarea
                  id="description"
                  value={formData.description}
                  onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                  placeholder="Describe the scenario details..."
                  rows={3}
                />
              </div>

              <div className="flex gap-2">
                <Button
                  onClick={handleRunScenario}
                  disabled={isRunning || !formData.zone || !formData.eventType}
                  className="flex-1 font-serif"
                >
                  <Play className="w-4 h-4 mr-2" />
                  {isRunning ? "Running..." : "Run Scenario"}
                </Button>
                <Button variant="outline" onClick={handleReset} className="font-serif bg-transparent">
                  <RotateCcw className="w-4 h-4" />
                </Button>
              </div>
            </CardContent>
          </Card>

          {/* Active Scenarios */}
          <Card>
            <CardHeader>
              <CardTitle className="font-sans text-card-foreground">Active Scenarios</CardTitle>
            </CardHeader>
            <CardContent>
              {activeScenarios.length === 0 ? (
                <p className="text-sm text-muted-foreground font-serif text-center py-4">No active scenarios</p>
              ) : (
                <div className="space-y-3">
                  {activeScenarios.slice(0, 3).map((scenario) => (
                    <div key={scenario.id} className="p-3 border border-border rounded-lg bg-muted/20">
                      <div className="flex items-center justify-between mb-2">
                        <div className="flex items-center gap-2">
                          {getStatusIcon(scenario.status)}
                          <span className="text-sm font-medium font-sans text-card-foreground">
                            {scenario.zone} - {scenario.eventType.replace("_", " ")}
                          </span>
                        </div>
                        <Badge variant={scenario.status === "completed" ? "default" : "secondary"}>
                          {scenario.status}
                        </Badge>
                      </div>
                      {scenario.status === "running" && <Progress value={scenario.progress} className="h-2" />}
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </div>

        {/* Visualization and Results */}
        <div className="lg:col-span-2 space-y-4">
          {/* 3D Map with Scenario Effects */}
          <Card>
            <CardHeader>
              <CardTitle className="font-sans text-card-foreground">Scenario Visualization</CardTitle>
              <p className="text-sm text-muted-foreground font-serif">3D map showing predicted scenario impacts</p>
            </CardHeader>
            <CardContent>
              <CityMap3D trafficData={lastPrediction?.predicted_traffic} />
            </CardContent>
          </Card>

          {/* AI Prediction Results */}
          {lastPrediction && (
            <Card>
              <CardHeader>
                <CardTitle className="font-sans text-card-foreground">AI Prediction Results</CardTitle>
                <p className="text-sm text-muted-foreground font-serif">
                  Analysis and recommendations based on scenario simulation
                </p>
              </CardHeader>
              <CardContent className="space-y-4">
                <Alert>
                  <AlertTriangle className="h-4 w-4" />
                  <AlertDescription className="font-serif">
                    <strong>Impact Score: </strong>
                    <span className={getImpactColor(lastPrediction.impact_score)}>
                      {lastPrediction.impact_score}/100
                    </span>
                  </AlertDescription>
                </Alert>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <h4 className="font-medium font-sans text-card-foreground mb-2">Predicted Traffic Changes</h4>
                    <div className="space-y-2">
                      <div className="flex justify-between">
                        <span className="text-sm font-serif text-muted-foreground">Zone A:</span>
                        <span className="text-sm font-medium text-card-foreground">
                          {lastPrediction.predicted_traffic.zoneA}%
                        </span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-sm font-serif text-muted-foreground">Zone B:</span>
                        <span className="text-sm font-medium text-card-foreground">
                          {lastPrediction.predicted_traffic.zoneB}%
                        </span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-sm font-serif text-muted-foreground">Zone C:</span>
                        <span className="text-sm font-medium text-card-foreground">
                          {lastPrediction.predicted_traffic.zoneC}%
                        </span>
                      </div>
                    </div>
                  </div>

                  <div>
                    <h4 className="font-medium font-sans text-card-foreground mb-2">Reroute Suggestions</h4>
                    <div className="space-y-2">
                      {Object.entries(lastPrediction.reroute_suggested).map(([zone, suggested]) => (
                        <div key={zone} className="flex justify-between">
                          <span className="text-sm font-serif text-muted-foreground">
                            {zone.replace("zone", "Zone ").toUpperCase()}:
                          </span>
                          <Badge variant={suggested ? "destructive" : "default"}>
                            {suggested ? "Reroute" : "Normal"}
                          </Badge>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>

                <div>
                  <h4 className="font-medium font-sans text-card-foreground mb-2">Analysis</h4>
                  <p className="text-sm text-muted-foreground font-serif">{lastPrediction.analysis}</p>
                </div>

                <div>
                  <h4 className="font-medium font-sans text-card-foreground mb-2">Recommendations</h4>
                  <ul className="space-y-1">
                    {lastPrediction.recommendations.map((rec, index) => (
                      <li key={index} className="text-sm text-muted-foreground font-serif flex items-center gap-2">
                        <div className="w-1.5 h-1.5 bg-primary rounded-full"></div>
                        {rec}
                      </li>
                    ))}
                  </ul>
                </div>

                <div className="flex items-center gap-4 pt-2 border-t border-border">
                  <div className="text-sm font-serif text-muted-foreground">
                    <strong>Estimated Duration:</strong> {lastPrediction.estimated_duration} minutes
                  </div>
                </div>
              </CardContent>
            </Card>
          )}
        </div>
      </div>
    </div>
  )
}
