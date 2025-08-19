import React, { useRef, useEffect } from 'react';
import * as THREE from 'three';

const CityMap3D = ({ trafficData, selectedZone, onZoneClick }) => {
  const mountRef = useRef(null);
  const sceneRef = useRef(null);
  const rendererRef = useRef(null);
  const zonesRef = useRef({});
  const vehiclesRef = useRef([]);
  const fogRef = useRef({});

  useEffect(() => {
    if (!mountRef.current) return;

    const scene = new THREE.Scene();
    scene.background = new THREE.Color(0x1a1a2e);
    sceneRef.current = scene;

    const camera = new THREE.PerspectiveCamera(75, 800 / 600, 0.1, 1000);
    camera.position.set(0, 30, 30);
    camera.lookAt(0, 0, 0);

    const renderer = new THREE.WebGLRenderer({ antialias: true });
    renderer.setSize(800, 600);
    renderer.shadowMap.enabled = true;
    renderer.shadowMap.type = THREE.PCFSoftShadowMap;
    rendererRef.current = renderer;

    mountRef.current.appendChild(renderer.domElement);

    // Lighting
    const ambientLight = new THREE.AmbientLight(0x404040, 0.6);
    scene.add(ambientLight);
    const directionalLight = new THREE.DirectionalLight(0xffffff, 0.8);
    directionalLight.position.set(20, 20, 20);
    directionalLight.castShadow = true;
    scene.add(directionalLight);

    // Ground
    const ground = new THREE.Mesh(
      new THREE.PlaneGeometry(50, 50),
      new THREE.MeshLambertMaterial({ color: 0x2d3748 })
    );
    ground.rotation.x = -Math.PI / 2;
    ground.receiveShadow = true;
    scene.add(ground);

    // Roads
    const roadMaterial = new THREE.MeshLambertMaterial({ color: 0x4a5568 });
    const roadGeometry = new THREE.PlaneGeometry(2, 40);
    [-10, 0, 10].forEach(x => {
      const road = new THREE.Mesh(roadGeometry, roadMaterial);
      road.rotation.x = -Math.PI / 2;
      road.position.set(x, 0.01, 0);
      scene.add(road);
    });
    [-15, 0, 15].forEach(z => {
      const road = new THREE.Mesh(roadGeometry.clone().rotateZ(Math.PI/2), roadMaterial);
      road.rotation.x = -Math.PI / 2;
      road.position.set(0, 0.01, z);
      scene.add(road);
    });

    // Zones
    const zones = [
      { id: 'A', position: [-15, 0, -15], color: 0x3182ce },
      { id: 'B', position: [0, 0, -15], color: 0x38a169 },
      { id: 'C', position: [15, 0, -15], color: 0xd69e2e }
    ];

    zones.forEach(zone => {
      // Buildings
      for (let i = 0; i < 8; i++) {
        const height = 2 + Math.random() * 8;
        const building = new THREE.Mesh(
          new THREE.BoxGeometry(2, height, 2),
          new THREE.MeshLambertMaterial({ color: zone.color })
        );
        building.position.set(
          zone.position[0] + (Math.random() - 0.5) * 12,
          height / 2,
          zone.position[2] + (Math.random() - 0.5) * 12
        );
        building.castShadow = true;
        scene.add(building);
      }

      // Marker
      const marker = new THREE.Mesh(
        new THREE.CylinderGeometry(3, 3, 0.2),
        new THREE.MeshLambertMaterial({ color: zone.color, transparent: true, opacity: 0.5 })
      );
      marker.position.set(zone.position[0], 0.1, zone.position[2]);
      marker.userData = { zoneId: zone.id };
      scene.add(marker);
      zonesRef.current[zone.id] = marker;

      // Fog
      const fog = new THREE.Mesh(
        new THREE.SphereGeometry(8, 16, 16),
        new THREE.MeshBasicMaterial({ color: 0x8b4513, transparent: true, opacity: 0 })
      );
      fog.position.set(zone.position[0], 4, zone.position[2]);
      scene.add(fog);
      fogRef.current[zone.id] = fog;
    });

    // Vehicles
    const vehicleMaterials = [
      new THREE.MeshLambertMaterial({ color: 0xff6b6b }),
      new THREE.MeshLambertMaterial({ color: 0x4ecdc4 }),
      new THREE.MeshLambertMaterial({ color: 0x45b7d1 }),
      new THREE.MeshLambertMaterial({ color: 0xffa726 })
    ];

    for (let i = 0; i < 20; i++) {
      const vehicle = new THREE.Mesh(
        new THREE.BoxGeometry(0.8, 0.4, 0.4),
        vehicleMaterials[i % vehicleMaterials.length]
      );
      vehicle.position.set((Math.random() - 0.5) * 40, 0.3, (Math.random() - 0.5) * 40);
      vehicle.userData = { speed: 0.1 + Math.random() * 0.2, direction: Math.random() * Math.PI * 2 };
      scene.add(vehicle);
      vehiclesRef.current.push(vehicle);
    }

    // Click interaction
    const raycaster = new THREE.Raycaster();
    const mouse = new THREE.Vector2();
    const handleClick = (event) => {
      const rect = renderer.domElement.getBoundingClientRect();
      mouse.x = ((event.clientX - rect.left) / rect.width) * 2 - 1;
      mouse.y = -((event.clientY - rect.top) / rect.height) * 2 + 1;
      raycaster.setFromCamera(mouse, camera);
      const intersects = raycaster.intersectObjects(Object.values(zonesRef.current));
      if (intersects.length) onZoneClick(intersects[0].object.userData.zoneId);
    };

    renderer.domElement.addEventListener('click', handleClick);

    const animate = () => {
      requestAnimationFrame(animate);
      vehiclesRef.current.forEach(v => {
        v.position.x += Math.cos(v.userData.direction) * v.userData.speed;
        v.position.z += Math.sin(v.userData.direction) * v.userData.speed;
        if (Math.abs(v.position.x) > 25) v.position.x *= -0.8;
        if (Math.abs(v.position.z) > 25) v.position.z *= -0.8;
      });
      renderer.render(scene, camera);
    };

    animate();

    return () => {
      renderer.domElement.removeEventListener('click', handleClick);
      if (mountRef.current) mountRef.current.removeChild(renderer.domElement);
      renderer.dispose();
    };
  }, []);

  useEffect(() => {
    if (!trafficData?.zones) return;

    trafficData.zones.forEach(zone => {
      const marker = zonesRef.current[zone.id];
      const fog = fogRef.current[zone.id];
      if (marker) {
        const intensity = zone.traffic / 100;
        marker.material.color.setHSL(0.3 - intensity * 0.3, 0.8, 0.5);
        marker.material.opacity = selectedZone === zone.id ? 0.8 : 0.5;
        marker.scale.set(selectedZone === zone.id ? 1.2 : 1, 1, 1);
      }
      if (fog) fog.material.opacity = Math.min(zone.pollution / 100 * 0.7, 0.7);
    });

    const avgTraffic = trafficData.zones.reduce((sum, z) => sum + z.traffic, 0) / trafficData.zones.length;
    vehiclesRef.current.forEach(v => v.userData.speed = 0.3 - avgTraffic / 100 * 0.2);
  }, [trafficData, selectedZone]);

  return <div ref={mountRef} className="w-full h-full rounded-lg overflow-hidden shadow-2xl" />;
};

export default CityMap3D;
