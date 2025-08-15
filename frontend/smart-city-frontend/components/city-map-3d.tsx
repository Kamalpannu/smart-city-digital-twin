"use client"

import { useEffect, useRef, useState } from "react"
import * as THREE from "three"
import { Card } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { useRealTimeData } from "@/contexts/real-time-data-context"

interface ZoneData {
  id: string
  name: string
  traffic: number
  pollution: number
  reroute: "none" | "consider" | "now"
  position: [number, number, number]
}

interface CityMap3DProps {
  trafficData?: any
  onZoneClick?: (zone: ZoneData) => void
}

// WebGL support detection
function isWebGLSupported(): boolean {
  try {
    const canvas = document.createElement("canvas")
    const gl = canvas.getContext("webgl2") || canvas.getContext("webgl") || canvas.getContext("experimental-webgl")
    return !!gl
  } catch (e) {
    return false
  }
}

export function CityMap3D({ trafficData: propTrafficData, onZoneClick }: CityMap3DProps) {
  const { trafficData: realTimeTrafficData } = useRealTimeData()
  const mountRef = useRef<HTMLDivElement>(null)
  const sceneRef = useRef<THREE.Scene>()
  const rendererRef = useRef<THREE.WebGLRenderer>()
  const cameraRef = useRef<THREE.PerspectiveCamera>()
  const [selectedZone, setSelectedZone] = useState<ZoneData | null>(null)
  const [webglError, setWebglError] = useState<string | null>(null)
  const [isLoading, setIsLoading] = useState(true)

  const currentTrafficData = propTrafficData || realTimeTrafficData

  const zones: ZoneData[] = currentTrafficData
    ? Object.entries(currentTrafficData.zones).map(([zoneName, data], index) => ({
        id: zoneName.split(" ")[1] || zoneName,
        name: zoneName,
        traffic: data.traffic,
        pollution: data.pollution,
        reroute: data.reroute,
        position: index === 0 ? [-2, 0, 0] : index === 1 ? [2, 0, 0] : ([0, 0, 2] as [number, number, number]),
      }))
    : [
        { id: "A", name: "Zone A", traffic: 85, pollution: 60, reroute: "consider", position: [-2, 0, 0] },
        { id: "B", name: "Zone B", traffic: 45, pollution: 90, reroute: "now", position: [2, 0, 0] },
        { id: "C", name: "Zone C", traffic: 30, pollution: 25, reroute: "none", position: [0, 0, 2] },
      ]

  useEffect(() => {
    if (!mountRef.current) return

    console.log("[v0] Initializing 3D city map...")

    // Check WebGL support first
    if (!isWebGLSupported()) {
      console.log("[v0] WebGL not supported")
      setWebglError("WebGL is not supported in your browser. Please use a modern browser with WebGL support.")
      setIsLoading(false)
      return
    }

    try {
      console.log("[v0] WebGL supported, creating scene...")

      // Scene setup
      const scene = new THREE.Scene()
      scene.background = new THREE.Color(0xf0f9ff)
      sceneRef.current = scene

      // Camera setup
      const camera = new THREE.PerspectiveCamera(75, 800 / 600, 0.1, 1000)
      camera.position.set(5, 5, 5)
      camera.lookAt(0, 0, 0)
      cameraRef.current = camera

      // Renderer setup with fallback options
      let renderer: THREE.WebGLRenderer
      try {
        console.log("[v0] Attempting to create WebGL2 renderer...")
        renderer = new THREE.WebGLRenderer({
          antialias: true,
          alpha: true,
          powerPreference: "default",
          failIfMajorPerformanceCaveat: false,
        })
      } catch (webgl2Error) {
        console.log("[v0] WebGL2 failed, trying WebGL1...")
        try {
          const canvas = document.createElement("canvas")
          const context = canvas.getContext("webgl", {
            antialias: true,
            alpha: true,
            powerPreference: "default",
            failIfMajorPerformanceCaveat: false,
          })
          if (!context) throw new Error("WebGL1 context creation failed")

          renderer = new THREE.WebGLRenderer({
            canvas,
            context,
            antialias: true,
            alpha: true,
            powerPreference: "default",
            failIfMajorPerformanceCaveat: false,
          })
        } catch (webgl1Error) {
          console.log("[v0] Both WebGL2 and WebGL1 failed:", webgl1Error)
          throw new Error("Failed to create WebGL context")
        }
      }

      console.log("[v0] WebGL renderer created successfully")

      renderer.setSize(800, 600)
      renderer.shadowMap.enabled = true
      renderer.shadowMap.type = THREE.PCFSoftShadowMap
      rendererRef.current = renderer

      mountRef.current.appendChild(renderer.domElement)

      // Lighting
      const ambientLight = new THREE.AmbientLight(0x404040, 0.6)
      scene.add(ambientLight)

      const directionalLight = new THREE.DirectionalLight(0xffffff, 0.8)
      directionalLight.position.set(10, 10, 5)
      directionalLight.castShadow = true
      scene.add(directionalLight)

      // Ground plane
      const groundGeometry = new THREE.PlaneGeometry(10, 10)
      const groundMaterial = new THREE.MeshLambertMaterial({ color: 0x90ee90 })
      const ground = new THREE.Mesh(groundGeometry, groundMaterial)
      ground.rotation.x = -Math.PI / 2
      ground.receiveShadow = true
      scene.add(ground)

      // Roads
      const roadGeometry = new THREE.PlaneGeometry(0.5, 8)
      const roadMaterial = new THREE.MeshLambertMaterial({ color: 0x333333 })

      // Main road (horizontal)
      const mainRoad = new THREE.Mesh(roadGeometry, roadMaterial)
      mainRoad.rotation.x = -Math.PI / 2
      mainRoad.rotation.z = Math.PI / 2
      mainRoad.position.y = 0.01
      scene.add(mainRoad)

      // Cross road (vertical)
      const crossRoad = new THREE.Mesh(roadGeometry, roadMaterial)
      crossRoad.rotation.x = -Math.PI / 2
      crossRoad.position.y = 0.01
      scene.add(crossRoad)

      // Create zones with buildings and pollution overlays
      zones.forEach((zone, index) => {
        // Building
        const buildingGeometry = new THREE.BoxGeometry(1, 1 + Math.random(), 1)
        const buildingMaterial = new THREE.MeshLambertMaterial({
          color: zone.id === "A" ? 0x4a90e2 : zone.id === "B" ? 0xe74c3c : 0x2ecc71,
        })
        const building = new THREE.Mesh(buildingGeometry, buildingMaterial)
        building.position.set(...zone.position)
        building.position.y = building.geometry.parameters.height / 2
        building.castShadow = true
        building.userData = { zone }
        scene.add(building)

        // Pollution overlay (semi-transparent fog)
        const pollutionGeometry = new THREE.SphereGeometry(1.5, 16, 16)
        const pollutionMaterial = new THREE.MeshBasicMaterial({
          color: zone.pollution > 70 ? 0xff4444 : zone.pollution > 40 ? 0xffaa44 : 0x44ff44,
          transparent: true,
          opacity: zone.pollution / 200,
        })
        const pollutionSphere = new THREE.Mesh(pollutionGeometry, pollutionMaterial)
        pollutionSphere.position.set(...zone.position)
        pollutionSphere.position.y = 1
        scene.add(pollutionSphere)

        // Traffic vehicles (animated cubes)
        const vehicleCount = Math.floor(zone.traffic / 20)
        for (let i = 0; i < vehicleCount; i++) {
          const vehicleGeometry = new THREE.BoxGeometry(0.1, 0.05, 0.2)
          const vehicleMaterial = new THREE.MeshLambertMaterial({ color: 0xffffff })
          const vehicle = new THREE.Mesh(vehicleGeometry, vehicleMaterial)
          vehicle.position.set(
            zone.position[0] + (Math.random() - 0.5) * 2,
            0.05,
            zone.position[2] + (Math.random() - 0.5) * 2,
          )
          scene.add(vehicle)
        }
      })

      // Mouse interaction
      const raycaster = new THREE.Raycaster()
      const mouse = new THREE.Vector2()

      const onMouseClick = (event: MouseEvent) => {
        const rect = renderer.domElement.getBoundingClientRect()
        mouse.x = ((event.clientX - rect.left) / rect.width) * 2 - 1
        mouse.y = -((event.clientY - rect.top) / rect.height) * 2 + 1

        raycaster.setFromCamera(mouse, camera)
        const intersects = raycaster.intersectObjects(scene.children)

        for (const intersect of intersects) {
          if (intersect.object.userData.zone) {
            const zone = intersect.object.userData.zone
            setSelectedZone(zone)
            onZoneClick?.(zone)
            break
          }
        }
      }

      renderer.domElement.addEventListener("click", onMouseClick)

      // Animation loop
      const animate = () => {
        requestAnimationFrame(animate)
        renderer.render(scene, camera)
      }
      animate()

      console.log("[v0] 3D city map initialized successfully")
      setIsLoading(false)
    } catch (error) {
      console.log("[v0] Error initializing 3D map:", error)
      setWebglError(
        `Failed to initialize 3D visualization: ${error instanceof Error ? error.message : "Unknown error"}`,
      )
      setIsLoading(false)
    }

    return () => {
      if (mountRef.current && rendererRef.current?.domElement) {
        mountRef.current.removeChild(rendererRef.current.domElement)
      }
      rendererRef.current?.dispose()
    }
  }, [zones, onZoneClick])

  const getRerouteColor = (reroute: string) => {
    switch (reroute) {
      case "now":
        return "bg-destructive text-destructive-foreground"
      case "consider":
        return "bg-secondary text-secondary-foreground"
      default:
        return "bg-primary text-primary-foreground"
    }
  }

  if (webglError) {
    return (
      <div className="relative">
        <Alert className="mb-4">
          <AlertDescription>{webglError}</AlertDescription>
        </Alert>

        {/* Fallback 2D visualization */}
        <Card className="p-6 bg-card border border-border rounded-lg">
          <h3 className="font-serif font-semibold mb-4 text-card-foreground">City Zones Overview</h3>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {zones.map((zone) => (
              <Card
                key={zone.id}
                className="p-4 cursor-pointer hover:bg-accent transition-colors"
                onClick={() => {
                  setSelectedZone(zone)
                  onZoneClick?.(zone)
                }}
              >
                <div className="flex items-center justify-between mb-2">
                  <h4 className="font-medium text-card-foreground">Zone {zone.id}</h4>
                  <Badge className={getRerouteColor(zone.reroute)}>
                    {zone.reroute === "now" ? "Reroute Now" : zone.reroute === "consider" ? "Consider" : "Normal"}
                  </Badge>
                </div>
                <div className="space-y-1 text-sm">
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Traffic:</span>
                    <span className="font-medium text-card-foreground">{zone.traffic}%</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Pollution:</span>
                    <span className="font-medium text-card-foreground">{zone.pollution}%</span>
                  </div>
                </div>
              </Card>
            ))}
          </div>
        </Card>
      </div>
    )
  }

  if (isLoading) {
    return (
      <div className="relative">
        <Card className="p-6 bg-card border border-border rounded-lg flex items-center justify-center h-[600px]">
          <div className="text-center">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto mb-4"></div>
            <p className="text-muted-foreground">Loading 3D City Map...</p>
          </div>
        </Card>
      </div>
    )
  }

  return (
    <div className="relative">
      <div ref={mountRef} className="rounded-lg overflow-hidden border border-border" />

      {selectedZone && (
        <Card className="absolute top-4 right-4 p-4 w-64 bg-card/95 backdrop-blur-sm">
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <h3 className="font-serif font-semibold text-card-foreground">Zone {selectedZone.id}</h3>
              <Badge className={getRerouteColor(selectedZone.reroute)}>
                {selectedZone.reroute === "now"
                  ? "Reroute Now"
                  : selectedZone.reroute === "consider"
                    ? "Consider Reroute"
                    : "No Reroute"}
              </Badge>
            </div>
            <div className="text-sm text-muted-foreground">
              <p className="font-medium text-card-foreground">{selectedZone.name}</p>
            </div>
            <div className="grid grid-cols-2 gap-2 text-sm">
              <div>
                <span className="text-muted-foreground">Traffic:</span>
                <div className="font-medium text-card-foreground">{selectedZone.traffic}%</div>
              </div>
              <div>
                <span className="text-muted-foreground">Pollution:</span>
                <div className="font-medium text-card-foreground">{selectedZone.pollution}%</div>
              </div>
            </div>
          </div>
        </Card>
      )}
    </div>
  )
}
