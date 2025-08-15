"use client"

import { useRef, useEffect, useState } from "react"
import * as THREE from "three"
import { useRealTimeData } from "../contexts/RealTimeDataContext"

const CityMap3D = () => {
  const mountRef = useRef(null)
  const sceneRef = useRef(null)
  const rendererRef = useRef(null)
  const [selectedZone, setSelectedZone] = useState(null)
  const [webglSupported, setWebglSupported] = useState(true)
  const { trafficData, weatherData } = useRealTimeData()

  useEffect(() => {
    if (!mountRef.current) return

    // Check WebGL support
    const canvas = document.createElement("canvas")
    const gl = canvas.getContext("webgl") || canvas.getContext("experimental-webgl")

    if (!gl) {
      setWebglSupported(false)
      return
    }

    // Scene setup
    const scene = new THREE.Scene()
    scene.background = new THREE.Color(0x0f172a)
    sceneRef.current = scene

    // Camera setup
    const camera = new THREE.PerspectiveCamera(
      75,
      mountRef.current.clientWidth / mountRef.current.clientHeight,
      0.1,
      1000,
    )
    camera.position.set(0, 10, 15)

    // Renderer setup
    let renderer
    try {
      renderer = new THREE.WebGLRenderer({ antialias: true })
      renderer.setSize(mountRef.current.clientWidth, mountRef.current.clientHeight)
      renderer.shadowMap.enabled = true
      renderer.shadowMap.type = THREE.PCFSoftShadowMap
      mountRef.current.appendChild(renderer.domElement)
      rendererRef.current = renderer
    } catch (error) {
      console.error("[Smart City] WebGL initialization failed:", error)
      setWebglSupported(false)
      return
    }

    // Lighting
    const ambientLight = new THREE.AmbientLight(0x404040, 0.6)
    scene.add(ambientLight)

    const directionalLight = new THREE.DirectionalLight(0xffffff, 0.8)
    directionalLight.position.set(10, 10, 5)
    directionalLight.castShadow = true
    scene.add(directionalLight)

    // Ground
    const groundGeometry = new THREE.PlaneGeometry(20, 20)
    const groundMaterial = new THREE.MeshLambertMaterial({ color: 0x1e293b })
    const ground = new THREE.Mesh(groundGeometry, groundMaterial)
    ground.rotation.x = -Math.PI / 2
    ground.receiveShadow = true
    scene.add(ground)

    // Create city zones
    const zones = [
      { name: "Zone A", position: [-6, 0, -6], color: 0x22c55e },
      { name: "Zone B", position: [0, 0, -6], color: 0x3b82f6 },
      { name: "Zone C", position: [6, 0, -6], color: 0xf59e0b },
    ]

    const zoneObjects = []

    zones.forEach((zone, index) => {
      // Buildings
      for (let i = 0; i < 5; i++) {
        const height = Math.random() * 3 + 1
        const buildingGeometry = new THREE.BoxGeometry(0.8, height, 0.8)
        const buildingMaterial = new THREE.MeshLambertMaterial({ color: zone.color })
        const building = new THREE.Mesh(buildingGeometry, buildingMaterial)

        building.position.set(
          zone.position[0] + (Math.random() - 0.5) * 4,
          height / 2,
          zone.position[2] + (Math.random() - 0.5) * 4,
        )
        building.castShadow = true
        building.userData = { zone: zone.name }
        scene.add(building)
        zoneObjects.push(building)
      }

      // Zone marker
      const markerGeometry = new THREE.CylinderGeometry(0.5, 0.5, 0.1)
      const markerMaterial = new THREE.MeshLambertMaterial({ color: zone.color })
      const marker = new THREE.Mesh(markerGeometry, markerMaterial)
      marker.position.set(zone.position[0], 0.05, zone.position[2])
      marker.userData = { zone: zone.name, isMarker: true }
      scene.add(marker)
      zoneObjects.push(marker)
    })

    // Mouse interaction
    const raycaster = new THREE.Raycaster()
    const mouse = new THREE.Vector2()

    const onMouseClick = (event) => {
      const rect = renderer.domElement.getBoundingClientRect()
      mouse.x = ((event.clientX - rect.left) / rect.width) * 2 - 1
      mouse.y = -((event.clientY - rect.top) / rect.height) * 2 + 1

      raycaster.setFromCamera(mouse, camera)
      const intersects = raycaster.intersectObjects(zoneObjects)

      if (intersects.length > 0) {
        const zoneName = intersects[0].object.userData.zone
        setSelectedZone(zoneName)
      }
    }

    renderer.domElement.addEventListener("click", onMouseClick)

    // Animation loop
    const animate = () => {
      requestAnimationFrame(animate)

      // Rotate camera around the scene
      const time = Date.now() * 0.0005
      camera.position.x = Math.cos(time) * 15
      camera.position.z = Math.sin(time) * 15
      camera.lookAt(0, 0, 0)

      renderer.render(scene, camera)
    }
    animate()

    // Handle resize
    const handleResize = () => {
      if (mountRef.current && renderer) {
        camera.aspect = mountRef.current.clientWidth / mountRef.current.clientHeight
        camera.updateProjectionMatrix()
        renderer.setSize(mountRef.current.clientWidth, mountRef.current.clientHeight)
      }
    }

    window.addEventListener("resize", handleResize)

    // Cleanup
    return () => {
      window.removeEventListener("resize", handleResize)
      if (renderer) {
        renderer.domElement.removeEventListener("click", onMouseClick)
        mountRef.current?.removeChild(renderer.domElement)
        renderer.dispose()
      }
    }
  }, [])

  if (!webglSupported) {
    return (
      <div className="card">
        <div className="card-header">
          <h2 className="card-title">3D City Map</h2>
        </div>
        <div style={{ padding: "40px", textAlign: "center" }}>
          <p style={{ color: "#94a3b8", marginBottom: "16px" }}>
            WebGL is not supported in your browser. Showing 2D fallback view.
          </p>
          <div className="grid grid-3" style={{ marginTop: "24px" }}>
            {trafficData?.zones &&
              Object.entries(trafficData.zones).map(([zone, data]) => (
                <div key={zone} className="card" style={{ margin: "8px" }}>
                  <h3 style={{ color: "#f8fafc", marginBottom: "12px" }}>{zone}</h3>
                  <p>Traffic: {data.traffic}%</p>
                  <p>Pollution: {data.pollution}</p>
                  <p>
                    Reroute:{" "}
                    <span
                      className={`status-badge status-${data.reroute === "now" ? "danger" : data.reroute === "consider" ? "warning" : "active"}`}
                    >
                      {data.reroute}
                    </span>
                  </p>
                </div>
              ))}
          </div>
        </div>
      </div>
    )
  }

  return (
    <div>
      <div className="page-header">
        <h1 className="page-title">3D City Map</h1>
        <p className="page-subtitle">Interactive 3D visualization of city zones with real-time data</p>
      </div>

      <div className="card">
        <div ref={mountRef} style={{ width: "100%", height: "500px" }} />

        {selectedZone && trafficData?.zones?.[selectedZone] && (
          <div
            style={{
              position: "absolute",
              top: "20px",
              right: "20px",
              background: "rgba(30, 41, 59, 0.95)",
              border: "1px solid rgba(34, 197, 94, 0.3)",
              borderRadius: "8px",
              padding: "16px",
              minWidth: "200px",
            }}
          >
            <h3 style={{ color: "#f8fafc", marginBottom: "12px" }}>{selectedZone}</h3>
            <p>Traffic Level: {trafficData.zones[selectedZone].traffic}%</p>
            <p>Pollution: {trafficData.zones[selectedZone].pollution}</p>
            <p>
              Reroute Status:
              <span
                className={`status-badge status-${
                  trafficData.zones[selectedZone].reroute === "now"
                    ? "danger"
                    : trafficData.zones[selectedZone].reroute === "consider"
                      ? "warning"
                      : "active"
                }`}
                style={{ marginLeft: "8px" }}
              >
                {trafficData.zones[selectedZone].reroute}
              </span>
            </p>
            <button className="btn btn-secondary" style={{ marginTop: "12px" }} onClick={() => setSelectedZone(null)}>
              Close
            </button>
          </div>
        )}
      </div>
    </div>
  )
}

export default CityMap3D
