import React, { useMemo } from "react";
import { Canvas, useFrame } from "@react-three/fiber";
import { OrbitControls, Environment } from "@react-three/drei";
import { useSensorsStore } from "../store/useSensorsStore";

function Building({ x, z, height = 1, color = "#4CAF50" }) {
  const ref = React.useRef();
  useFrame(({ clock }) => {
    if (ref.current) {
      ref.current.rotation.y = Math.sin(clock.getElapsedTime() * 0.2 + x + z) * 0.02;
    }
  });
  return (
    <mesh ref={ref} position={[x, height / 2, z]} castShadow receiveShadow>
      <boxGeometry args={[0.9, height, 0.9]} />
      <meshStandardMaterial color={color} />
    </mesh>
  );
}

function City() {
  const latest = useSensorsStore((s) => s.latest);

  const buildings = useMemo(() => {
    // Convert latest object to array to avoid map error
    const zonesArray = latest && typeof latest === "object" ? Object.values(latest) : [];

    const cols = Math.ceil(Math.sqrt(Math.max(1, zonesArray.length)));

    return zonesArray.map((zone, idx) => {
      const row = Math.floor(idx / cols);
      const col = idx % cols;
      const x = col * 1.2 - (cols * 1.2) / 2;
      const z = row * 1.2 - (cols * 1.2) / 2;
      const traffic = Number(zone.traffic) || 0;     // expected 0..100
      const pollution = Number(zone.pollution) || 0; // expected 0..100
      const height = Math.max(0.5, (traffic / 100) * 6 + 0.5);
      const color =
        pollution > 70 ? "#EF4444" : pollution > 40 ? "#F59E0B" : "#10B981";
      return { x, z, height, color, key: zone.zone ?? idx };
    });
  }, [latest]);

  return (
    <>
      {/* Ground */}
      <mesh rotation={[-Math.PI / 2, 0, 0]} receiveShadow>
        <planeGeometry args={[50, 50]} />
        <meshStandardMaterial color="#2b2f39" />
      </mesh>

      {/* Buildings */}
      {buildings.map((b) => (
        <Building key={b.key} x={b.x} z={b.z} height={b.height} color={b.color} />
      ))}

      {/* Lights */}
      <ambientLight intensity={0.5} />
      <directionalLight position={[5, 10, 5]} intensity={1.1} castShadow />
      <Environment preset="city" />
    </>
  );
}

export default function ThreeCity() {
  return (
    <div style={{ width: "100%", height: "100%", minHeight: 360 }}>
      <Canvas shadows camera={{ position: [6, 6, 6], fov: 55 }}>
        <OrbitControls makeDefault />
        <City />
      </Canvas>
    </div>
  );
}
