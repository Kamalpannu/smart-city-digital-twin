#!/bin/bash

# Complete Smart City Simulation Frontend Setup Script
# Run this script to get the full frontend application ready to use

set -e

PROJECT_NAME="smart-city-frontend"

echo "🏗️  Setting up Smart City Simulation Frontend..."

# Check dependencies
if ! command -v node &> /dev/null; then
    echo "❌ Node.js is not installed. Please install Node.js 16+ first."
    exit 1
fi

if ! command -v npm &> /dev/null; then
    echo "❌ npm is not installed. Please install npm first."
    exit 1
fi

# Create and setup project
echo "📁 Creating project directory: $PROJECT_NAME"
rm -rf $PROJECT_NAME
mkdir -p $PROJECT_NAME
cd $PROJECT_NAME

# Initialize Vite React project
echo "⚡ Initializing Vite React project..."
npm create vite@latest . -- --template react --yes
npm install

# Install dependencies
echo "📦 Installing dependencies..."
npm install three recharts lucide-react axios

# Install dev dependencies
#echo "🛠️  Installing dev dependencies..."
#npm install -D tailwindcss postcss autoprefixer

# Initialize Tailwind
#echo "🎨 Setting up Tailwind CSS..."
#npx tailwindcss init -p

# Create all project files
echo "📂 Creating project structure and files..."

# Tailwind config
cat > tailwind.config.js << 'EOF'
/** @type {import('tailwindcss').Config} */
export default {
  content: ["./index.html", "./src/**/*.{js,ts,jsx,tsx}"],
  theme: {
    extend: {
      fontFamily: { sans: ['Inter', 'system-ui', 'sans-serif'] },
      colors: {
        primary: {
          50: '#eff6ff', 100: '#dbeafe', 200: '#bfdbfe', 300: '#93c5fd',
          400: '#60a5fa', 500: '#3b82f6', 600: '#2563eb', 700: '#1d4ed8',
          800: '#1e40af', 900: '#1e3a8a'
        }
      },
      animation: {
        'spin-slow': 'spin 3s linear infinite',
        'pulse-fast': 'pulse 1s cubic-bezier(0.4, 0, 0.6, 1) infinite'
      }
    }
  },
  plugins: []
}
EOF

# CSS file
cat > src/index.css << 'EOF'
@tailwind base;
@tailwind components;
@tailwind utilities;
@import url('https://fonts.googleapis.com/css2?family=Inter:wght@300;400;500;600;700;800&display=swap');

body {
  font-family: 'Inter', sans-serif;
  -webkit-font-smoothing: antialiased;
  -moz-osx-font-smoothing: grayscale;
}

canvas { display: block; outline: none; }

::-webkit-scrollbar { width: 6px; }
::-webkit-scrollbar-track { background: #f1f5f9; }
::-webkit-scrollbar-thumb { background: #cbd5e1; border-radius: 3px; }
::-webkit-scrollbar-thumb:hover { background: #94a3b8; }

@keyframes shimmer {
  0% { background-position: -468px 0; }
  100% { background-position: 468px 0; }
}

.animate-shimmer {
  animation: shimmer 2s infinite linear;
  background: linear-gradient(to right, #eff6ff 4%, #dbeafe 25%, #eff6ff 36%);
  background-size: 1000px 100%;
}

.recharts-tooltip-wrapper { border-radius: 8px !important; box-shadow: 0 10px 15px -3px rgba(0, 0, 0, 0.1) !important; }
.recharts-default-tooltip { background-color: rgba(255, 255, 255, 0.95) !important; border: none !important; border-radius: 8px !important; box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.1) !important; }
EOF

# Create directories
mkdir -p src/services src/utils src/hooks src/components

# API Service
cat > src/services/api.js << 'EOF'
const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:3001';

class ApiService {
  constructor() { this.baseURL = API_BASE_URL; }

  async request(endpoint, options = {}) {
    const url = `${this.baseURL}${endpoint}`;
    const config = { headers: { 'Content-Type': 'application/json', ...options.headers }, ...options };
    
    try {
      const response = await fetch(url, config);
      if (!response.ok) throw new Error(`HTTP error! status: ${response.status}`);
      return await response.json();
    } catch (error) {
      console.error(`API request failed for ${endpoint}:`, error);
      throw error;
    }
  }

  async getWeatherLatest() { return this.request('/weather/latest'); }
  async getTrafficLatest() { return this.request('/traffic/latest'); }
  async testScenario(data) { return this.request('/scenario-bulk', { method: 'POST', body: JSON.stringify(data) }); }
  async getAutomationRules() { return this.request('/automation-rules'); }
  async createAutomationRule(rule) { return this.request('/automation-rules', { method: 'POST', body: JSON.stringify(rule) }); }
  async updateAutomationRule(id, rule) { return this.request(`/automation-rules/${id}`, { method: 'PUT', body: JSON.stringify(rule) }); }
  async deleteAutomationRule(id) { return this.request(`/automation-rules/${id}`, { method: 'DELETE' }); }
}

export const api = new ApiService();
export default api;
EOF

# Constants
cat > src/utils/constants.js << 'EOF'
export const ZONES = ['A', 'B', 'C'];
export const EVENT_TYPES = { ROAD_CLOSURE: 'road_closure', POLLUTION_SPIKE: 'pollution_spike', TRAFFIC_ACCIDENT: 'traffic_accident', CONSTRUCTION: 'construction' };
export const TRAFFIC_THRESHOLDS = { LOW: 30, MODERATE: 60, HIGH: 80 };
export const POLLUTION_THRESHOLDS = { LOW: 30, MODERATE: 60, HIGH: 80 };
export const POLLING_INTERVAL = parseInt(import.meta.env.VITE_POLLING_INTERVAL) || 5000;
export const CHART_COLORS = { ZONE_A: '#3182ce', ZONE_B: '#38a169', ZONE_C: '#d69e2e', TRAFFIC: '#2563eb', POLLUTION: '#dc2626' };
EOF

# Custom hook
cat > src/hooks/useRealTimeData.js << 'EOF'
import { useState, useEffect, useCallback } from 'react';
import { api } from '../services/api';
import { POLLING_INTERVAL } from '../utils/constants';

export const useRealTimeData = () => {
  const [weatherData, setWeatherData] = useState(null);
  const [trafficData, setTrafficData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const fetchData = useCallback(async () => {
    try {
      setError(null);
      const [weather, traffic] = await Promise.all([
        api.getWeatherLatest().catch(() => null),
        api.getTrafficLatest().catch(() => null)
      ]);
      if (weather) setWeatherData(weather);
      if (traffic) setTrafficData(traffic);
      setLoading(false);
    } catch (err) {
      console.error('Failed to fetch real-time data:', err);
      setError(err.message);
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchData();
    const interval = setInterval(fetchData, POLLING_INTERVAL);
    return () => clearInterval(interval);
  }, [fetchData]);

  return { weatherData, trafficData, loading, error, refetch: fetchData };
};
EOF

# Main App component (the complete React app from the previous artifact)
cat > src/App.jsx << 'EOF'
import React, { useState, useEffect, useRef, useCallback } from 'react';
import * as THREE from 'three';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, AreaChart, Area } from 'recharts';
import { 
  Activity, Cloud, Wind, Thermometer, Droplets, Car, AlertTriangle, Plus, Edit2, Trash2, 
  Play, Settings, Map, BarChart3, Zap
} from 'lucide-react';

// Mock API functions (replace with actual backend calls)
const API_BASE = 'http://localhost:3001';

const api = {
  getWeather: async () => ({
    temperature: 22 + Math.random() * 10,
    humidity: 60 + Math.random() * 30,
    windSpeed: 5 + Math.random() * 15,
    pollution: Math.random() * 100,
    condition: 'Clear'
  }),
  
  getTraffic: async () => ({
    zones: [
      { id: 'A', traffic: 30 + Math.random() * 70, pollution: 20 + Math.random() * 60 },
      { id: 'B', traffic: 40 + Math.random() * 60, pollution: 30 + Math.random() * 50 },
      { id: 'C', traffic: 25 + Math.random() * 75, pollution: 15 + Math.random() * 70 }
    ]
  }),
  
  getAutomationRules: async () => [
    { id: 1, zone: 'A', condition: 'traffic > 80', action: 'reroute_traffic', enabled: true },
    { id: 2, zone: 'B', condition: 'pollution > 70', action: 'alert_authorities', enabled: true },
    { id: 3, zone: 'C', condition: 'traffic > 60', action: 'increase_signal_time', enabled: false }
  ],
  
  createRule: async (rule) => ({ id: Date.now(), ...rule }),
  updateRule: async (id, rule) => ({ id, ...rule }),
  deleteRule: async (id) => ({ success: true }),
  
  testScenario: async (scenario) => ({
    predicted_traffic: scenario.zones.map(z => ({ 
      ...z, 
      predicted_traffic: z.traffic * (1 + Math.random() * 0.5) 
    })),
    reroute_suggested: Math.random() > 0.5,
    analysis: `Scenario "${scenario.event}" in zone ${scenario.zones[0]?.id} may increase traffic by ${Math.round(Math.random() * 50)}%`
  })
};

// Three.js 3D City Component
const CityMap3D = ({ trafficData, selectedZone, onZoneClick, scenarioData }) => {
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
    const groundGeometry = new THREE.PlaneGeometry(50, 50);
    const groundMaterial = new THREE.MeshLambertMaterial({ color: 0x2d3748 });
    const ground = new THREE.Mesh(groundGeometry, groundMaterial);
    ground.rotation.x = -Math.PI / 2;
    ground.receiveShadow = true;
    scene.add(ground);

    // Roads
    const roadGeometry = new THREE.PlaneGeometry(2, 40);
    const roadMaterial = new THREE.MeshLambertMaterial({ color: 0x4a5568 });
    
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
        const buildingGeometry = new THREE.BoxGeometry(2, height, 2);
        const buildingMaterial = new THREE.MeshLambertMaterial({ color: zone.color });
        const building = new THREE.Mesh(buildingGeometry, buildingMaterial);
        
        building.position.set(
          zone.position[0] + (Math.random() - 0.5) * 12,
          height / 2,
          zone.position[2] + (Math.random() - 0.5) * 12
        );
        building.castShadow = true;
        scene.add(building);
      }

      // Zone marker
      const markerGeometry = new THREE.CylinderGeometry(3, 3, 0.2);
      const markerMaterial = new THREE.MeshLambertMaterial({ 
        color: zone.color, 
        transparent: true, 
        opacity: 0.5 
      });
      const marker = new THREE.Mesh(markerGeometry, markerMaterial);
      marker.position.set(zone.position[0], 0.1, zone.position[2]);
      marker.userData = { zoneId: zone.id };
      scene.add(marker);
      zonesRef.current[zone.id] = marker;

      // Fog for pollution
      const fogGeometry = new THREE.SphereGeometry(8, 16, 16);
      const fogMaterial = new THREE.MeshBasicMaterial({ 
        color: 0x8b4513, 
        transparent: true, 
        opacity: 0 
      });
      const fog = new THREE.Mesh(fogGeometry, fogMaterial);
      fog.position.set(zone.position[0], 4, zone.position[2]);
      scene.add(fog);
      fogRef.current[zone.id] = fog;
    });

    // Vehicles
    const vehicleGeometry = new THREE.BoxGeometry(0.8, 0.4, 0.4);
    const vehicleMaterials = [
      new THREE.MeshLambertMaterial({ color: 0xff6b6b }),
      new THREE.MeshLambertMaterial({ color: 0x4ecdc4 }),
      new THREE.MeshLambertMaterial({ color: 0x45b7d1 }),
      new THREE.MeshLambertMaterial({ color: 0xffa726 })
    ];

    for (let i = 0; i < 20; i++) {
      const vehicle = new THREE.Mesh(vehicleGeometry, vehicleMaterials[i % vehicleMaterials.length]);
      vehicle.position.set(
        (Math.random() - 0.5) * 40,
        0.3,
        (Math.random() - 0.5) * 40
      );
      vehicle.userData = { 
        speed: 0.1 + Math.random() * 0.2,
        direction: Math.random() * Math.PI * 2 
      };
      scene.add(vehicle);
      vehiclesRef.current.push(vehicle);
    }

    // Mouse interaction
    const raycaster = new THREE.Raycaster();
    const mouse = new THREE.Vector2();

    const handleClick = (event) => {
      const rect = renderer.domElement.getBoundingClientRect();
      mouse.x = ((event.clientX - rect.left) / rect.width) * 2 - 1;
      mouse.y = -((event.clientY - rect.top) / rect.height) * 2 + 1;

      raycaster.setFromCamera(mouse, camera);
      const intersects = raycaster.intersectObjects(Object.values(zonesRef.current));

      if (intersects.length > 0) {
        const zoneId = intersects[0].object.userData.zoneId;
        onZoneClick(zoneId);
      }
    };

    renderer.domElement.addEventListener('click', handleClick);

    // Animation loop
    const animate = () => {
      requestAnimationFrame(animate);

      vehiclesRef.current.forEach(vehicle => {
        vehicle.position.x += Math.cos(vehicle.userData.direction) * vehicle.userData.speed;
        vehicle.position.z += Math.sin(vehicle.userData.direction) * vehicle.userData.speed;

        if (Math.abs(vehicle.position.x) > 25) vehicle.position.x *= -0.8;
        if (Math.abs(vehicle.position.z) > 25) vehicle.position.z *= -0.8;
      });

      renderer.render(scene, camera);
    };

    animate();

    return () => {
      renderer.domElement.removeEventListener('click', handleClick);
      if (mountRef.current && renderer.domElement) {
        mountRef.current.removeChild(renderer.domElement);
      }
      renderer.dispose();
    };
  }, []);

  useEffect(() => {
    if (!trafficData?.zones || !sceneRef.current) return;

    trafficData.zones.forEach(zone => {
      const marker = zonesRef.current[zone.id];
      const fog = fogRef.current[zone.id];
      
      if (marker) {
        const intensity = zone.traffic / 100;
        marker.material.color.setHSL(0.3 - intensity * 0.3, 0.8, 0.5);
        
        if (selectedZone === zone.id) {
          marker.material.opacity = 0.8;
          marker.scale.set(1.2, 1.2, 1.2);
        } else {
          marker.material.opacity = 0.5;
          marker.scale.set(1, 1, 1);
        }
      }
      
      if (fog) {
        fog.material.opacity = Math.min(zone.pollution / 100 * 0.7, 0.7);
      }
    });

    const avgTraffic = trafficData.zones.reduce((sum, z) => sum + z.traffic, 0) / trafficData.zones.length;
    vehiclesRef.current.forEach(vehicle => {
      vehicle.userData.speed = (0.3 - avgTraffic / 100 * 0.2);
    });
  }, [trafficData, selectedZone]);

  return <div ref={mountRef} className="w-full h-full rounded-lg overflow-hidden shadow-2xl" />;
};

// Weather Widget
const WeatherWidget = ({ weather }) => {
  if (!weather) return <div className="animate-pulse bg-gray-200 rounded-lg h-32"></div>;

  return (
    <div className="bg-gradient-to-br from-blue-500 to-purple-600 rounded-lg p-6 text-white">
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center space-x-2">
          <Cloud className="w-6 h-6" />
          <span className="font-semibold">Weather</span>
        </div>
        <span className="text-sm opacity-90">{weather.condition}</span>
      </div>
      
      <div className="grid grid-cols-2 gap-4">
        <div className="flex items-center space-x-2">
          <Thermometer className="w-4 h-4" />
          <span className="text-sm">{Math.round(weather.temperature)}°C</span>
        </div>
        <div className="flex items-center space-x-2">
          <Droplets className="w-4 h-4" />
          <span className="text-sm">{Math.round(weather.humidity)}%</span>
        </div>
        <div className="flex items-center space-x-2">
          <Wind className="w-4 h-4" />
          <span className="text-sm">{Math.round(weather.windSpeed)} km/h</span>
        </div>
        <div className="flex items-center space-x-2">
          <Activity className="w-4 h-4" />
          <span className="text-sm">AQI {Math.round(weather.pollution)}</span>
        </div>
      </div>
    </div>
  );
};

// Traffic Chart
const TrafficChart = ({ data }) => (
  <div className="bg-white rounded-lg p-6 shadow-lg">
    <h3 className="text-lg font-semibold mb-4 flex items-center">
      <Car className="w-5 h-5 mr-2" />
      Traffic Trends
    </h3>
    <ResponsiveContainer width="100%" height={200}>
      <LineChart data={data}>
        <CartesianGrid strokeDasharray="3 3" />
        <XAxis dataKey="time" />
        <YAxis />
        <Tooltip />
        <Line type="monotone" dataKey="zoneA" stroke="#3182ce" strokeWidth={2} />
        <Line type="monotone" dataKey="zoneB" stroke="#38a169" strokeWidth={2} />
        <Line type="monotone" dataKey="zoneC" stroke="#d69e2e" strokeWidth={2} />
      </LineChart>
    </ResponsiveContainer>
  </div>
);

// Pollution Chart
const PollutionChart = ({ data }) => (
  <div className="bg-white rounded-lg p-6 shadow-lg">
    <h3 className="text-lg font-semibold mb-4 flex items-center">
      <Activity className="w-5 h-5 mr-2" />
      Pollution Levels
    </h3>
    <ResponsiveContainer width="100%" height={200}>
      <AreaChart data={data}>
        <CartesianGrid strokeDasharray="3 3" />
        <XAxis dataKey="time" />
        <YAxis />
        <Tooltip />
        <Area type="monotone" dataKey="zoneA" stackId="1" stroke="#ef4444" fill="#ef4444" fillOpacity={0.3} />
        <Area type="monotone" dataKey="zoneB" stackId="1" stroke="#f59e0b" fill="#f59e0b" fillOpacity={0.3} />
        <Area type="monotone" dataKey="zoneC" stackId="1" stroke="#10b981" fill="#10b981" fillOpacity={0.3} />
      </AreaChart>
    </ResponsiveContainer>
  </div>
);

// Zone Info Panel
const ZoneInfoPanel = ({ zone, data }) => {
  if (!zone || !data) return null;

  const zoneData = data.zones?.find(z => z.id === zone);
  if (!zoneData) return null;

  const getTrafficStatus = (traffic) => {
    if (traffic > 70) return { text: 'Heavy', color: 'text-red-600', bg: 'bg-red-100' };
    if (traffic > 40) return { text: 'Moderate', color: 'text-yellow-600', bg: 'bg-yellow-100' };
    return { text: 'Light', color: 'text-green-600', bg: 'bg-green-100' };
  };

  const getPollutionStatus = (pollution) => {
    if (pollution > 60) return { text: 'High', color: 'text-red-600', bg: 'bg-red-100' };
    if (pollution > 30) return { text: 'Moderate', color: 'text-yellow-600', bg: 'bg-yellow-100' };
    return { text: 'Low', color: 'text-green-600', bg: 'bg-green-100' };
  };

  const trafficStatus = getTrafficStatus(zoneData.traffic);
  const pollutionStatus = getPollutionStatus(zoneData.pollution);

  return (
    <div className="bg-white rounded-lg p-6 shadow-lg">
      <h3 className="text-xl font-bold mb-4">Zone {zone}</h3>
      
      <div className="space-y-4">
        <div className="flex justify-between items-center">
          <span className="text-gray-600">Traffic:</span>
          <div className={`px-3 py-1 rounded-full ${trafficStatus.bg}`}>
            <span className={`font-medium ${trafficStatus.color}`}>
              {trafficStatus.text} ({Math.round(zoneData.traffic)}%)
            </span>
          </div>
        </div>
        
        <div className="flex justify-between items-center">
          <span className="text-gray-600">Pollution:</span>
          <div className={`px-3 py-1 rounded-full ${pollutionStatus.bg}`}>
            <span className={`font-medium ${pollutionStatus.color}`}>
              {pollutionStatus.text} ({Math.round(zoneData.pollution)})
            </span>
          </div>
        </div>
        
        <div className="flex justify-between items-center">
          <span className="text-gray-600">Reroute:</span>
          <span className={`font-medium ${zoneData.traffic > 60 ? 'text-red-600' : 'text-green-600'}`}>
            {zoneData.traffic > 60 ? 'Recommended' : 'Not needed'}
          </span>
        </div>
      </div>
    </div>
  );
};

// Automation Rules
const AutomationRules = ({ rules, onCreateRule, onUpdateRule, onDeleteRule }) => {
  const [isCreating, setIsCreating] = useState(false);
  const [editingRule, setEditingRule] = useState(null);
  const [formData, setFormData] = useState({
    zone: 'A',
    condition: '',
    action: '',
    enabled: true
  });

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (editingRule) {
      await onUpdateRule(editingRule.id, formData);
      setEditingRule(null);
    } else {
      await onCreateRule(formData);
      setIsCreating(false);
    }
    setFormData({ zone: 'A', condition: '', action: '', enabled: true });
  };

  const handleEdit = (rule) => {
    setEditingRule(rule);
    setFormData(rule);
    setIsCreating(true);
  };

  const handleCancel = () => {
    setIsCreating(false);
    setEditingRule(null);
    setFormData({ zone: 'A', condition: '', action: '', enabled: true });
  };

  return (
    <div className="bg-white rounded-lg p-6 shadow-lg">
      <div className="flex justify-between items-center mb-6">
        <h2 className="text-2xl font-bold flex items-center">
          <Settings className="w-6 h-6 mr-2" />
          Automation Rules
        </h2>
        {!isCreating && (
          <button
            onClick={() => setIsCreating(true)}
            className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 flex items-center space-x-2"
          >
            <Plus className="w-4 h-4" />
            <span>Add Rule</span>
          </button>
        )}
      </div>

      {isCreating && (
        <form onSubmit={handleSubmit} className="mb-6 p-4 border rounded-lg bg-gray-50">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            <select
              value={formData.zone}
              onChange={(e) => setFormData({ ...formData, zone: e.target.value })}
              className="px-3 py-2 border rounded-lg"
              required
            >
              <option value="A">Zone A</option>
              <option value="B">Zone B</option>
              <option value="C">Zone C</option>
            </select>

            <input
              type="text"
              placeholder="Condition (e.g., traffic > 80)"
              value={formData.condition}
              onChange={(e) => setFormData({ ...formData, condition: e.target.value })}
              className="px-3 py-2 border rounded-lg"
              required
            />

            <input
              type="text"
              placeholder="Action (e.g., reroute_traffic)"
              value={formData.action}
              onChange={(e) => setFormData({ ...formData, action: e.target.value })}
              className="px-3 py-2 border rounded-lg"
              required
            />

            <div className="flex items-center space-x-2">
              <input
                type="checkbox"
                id="enabled"
                checked={formData.enabled}
                onChange={(e) => setFormData({ ...formData, enabled: e.target.checked })}
                className="rounded"
              />
              <label htmlFor="enabled" className="text-sm">Enabled</label>
            </div>
          </div>

          <div className="flex space-x-2 mt-4">
            <button
              type="submit"
              className="bg-green-600 text-white px-4 py-2 rounded-lg hover:bg-green-700"
            >
              {editingRule ? 'Update' : 'Create'}
            </button>
            <button
              type="button"
              onClick={handleCancel}
              className="bg-gray-600 text-white px-4 py-2 rounded-lg hover:bg-gray-700"
            >
              Cancel
            </button>
          </div>
        </form>
      )}

      <div className="overflow-x-auto">
        <table className="w-full border-collapse border border-gray-200">
          <thead>
            <tr className="bg-gray-50">
              <th className="border border-gray-200 px-4 py-2 text-left">Zone</th>
              <th className="border border-gray-200 px-4 py-2 text-left">Condition</th>
              <th className="border border-gray-200 px-4 py-2 text-left">Action</th>
              <th className="border border-gray-200 px-4 py-2 text-left">Status</th>
              <th className="border border-gray-200 px-4 py-2 text-left">Actions</th>
            </tr>
          </thead>
          <tbody>
            {rules.map((rule) => (
              <tr key={rule.id} className="hover:bg-gray-50">
                <td className="border border-gray-200 px-4 py-2 font-semibold">Zone {rule.zone}</td>
                <td className="border border-gray-200 px-4 py-2 font-mono text-sm">{rule.condition}</td>
                <td className="border border-gray-200 px-4 py-2">{rule.action}</td>
                <td className="border border-gray-200 px-4 py-2">
                  <span className={`px-2 py-1 rounded-full text-xs ${
                    rule.enabled 
                      ? 'bg-green-100 text-green-800' 
                      : 'bg-gray-100 text-gray-800'
                  }`}>
                    {rule.enabled ? 'Enabled' : 'Disabled'}
                  </span>
                </td>
                <td className="border border-gray-200 px-4 py-2">
                  <div className="flex space-x-2">
                    <button
                      onClick={() => handleEdit(rule)}
                      className="text-blue-600 hover:text-blue-800"
                    >
                      <Edit2 className="w-4 h-4" />
                    </button>
                    <button
                      onClick={() => onDeleteRule(rule.id)}
                      className="text-red-600 hover:text-red-800"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
};

// Scenario Tester
const ScenarioTester = ({ onTestScenario }) => {
  const [scenario, setScenario] = useState({
    zone: 'A',
    event: 'road_closure',
    duration: 30
  });
  const [result, setResult] = useState(null);
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    
    const testData = {
      ts: Date.now(),
      zones: [{
        id: scenario.zone,
        traffic: 50,
        pollution: 30,
        event: scenario.event
      }]
    };

    try {
      const response = await onTestScenario(testData);
      setResult(response);
    } catch (error) {
      console.error('Scenario test failed:', error);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="bg-white rounded-lg p-6 shadow-lg">
      <h2 className="text-2xl font-bold mb-6 flex items-center">
        <Play className="w-6 h-6 mr-2" />
        Scenario Testing
      </h2>

      <form onSubmit={handleSubmit} className="space-y-4">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Zone</label>
            <select
              value={scenario.zone}
              onChange={(e) => setScenario({ ...scenario, zone: e.target.value })}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg"
            >
              <option value="A">Zone A</option>
              <option value="B">Zone B</option>
              <option value="C">Zone C</option>
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Event Type</label>
            <select
              value={scenario.event}
              onChange={(e) => setScenario({ ...scenario, event: e.target.value })}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg"
            >
              <option value="road_closure">Road Closure</option>
              <option value="pollution_spike">Pollution Spike</option>
              <option value="traffic_accident">Traffic Accident</option>
              <option value="construction">Construction</option>
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Duration (minutes)</label>
            <input
              type="number"
              value={scenario.duration}
              onChange={(e) => setScenario({ ...scenario, duration: parseInt(e.target.value) })}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg"
              min="5"
              max="480"
            />
          </div>
        </div>

        <button
          type="submit"
          disabled={loading}
          className="bg-purple-600 text-white px-6 py-3 rounded-lg hover:bg-purple-700 disabled:opacity-50 flex items-center space-x-2"
        >
          {loading ? (
            <>
              <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
              <span>Testing...</span>
            </>
          ) : (
            <>
              <Play className="w-4 h-4" />
              <span>Run Scenario</span>
            </>
          )}
        </button>
      </form>

      {result && (
        <div className="mt-6 p-4 border rounded-lg bg-gradient-to-r from-blue-50 to-purple-50">
          <h3 className="font-semibold mb-3 flex items-center">
            <AlertTriangle className="w-5 h-5 mr-2" />
            AI Prediction Results
          </h3>
          
          <div className="space-y-3">
            <div className="flex justify-between items-center">
              <span className="text-gray-600">Reroute Suggested:</span>
              <span className={`font-medium ${result.reroute_suggested ? 'text-red-600' : 'text-green-600'}`}>
                {result.reroute_suggested ? 'Yes' : 'No'}
              </span>
            </div>
            
            <div>
              <span className="text-gray-600 block mb-2">Analysis:</span>
              <p className="text-sm bg-white p-3 rounded border">{result.analysis}</p>
            </div>
            
            {result.predicted_traffic && (
              <div>
                <span className="text-gray-600 block mb-2">Predicted Traffic Impact:</span>
                <div className="space-y-1">
                  {result.predicted_traffic.map((zone, idx) => (
                    <div key={idx} className="flex justify-between text-sm">
                      <span>Zone {zone.id}:</span>
                      <span className="font-medium">{Math.round(zone.predicted_traffic)}%</span>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
};

// Main App
const SmartCityApp = () => {
  const [currentView, setCurrentView] = useState('dashboard');
  const [weatherData, setWeatherData] = useState(null);
  const [trafficData, setTrafficData] = useState(null);
  const [automationRules, setAutomationRules] = useState([]);
  const [selectedZone, setSelectedZone] = useState(null);
  const [chartData, setChartData] = useState([]);
  const [pollutionData, setPollutionData] = useState([]);

  useEffect(() => {
    const fetchData = async () => {
      try {
        const [weather, traffic, rules] = await Promise.all([
          api.getWeather(),
          api.getTraffic(),
          api.getAutomationRules()
        ]);

        setWeatherData(weather);
        setTrafficData(traffic);
        setAutomationRules(rules);

        const timestamp = new Date().toLocaleTimeString();
        const newDataPoint = {
          time: timestamp,
          zoneA: traffic.zones.find(z => z.id === 'A')?.traffic || 0,
          zoneB: traffic.zones.find(z => z.id === 'B')?.traffic || 0,
          zoneC: traffic.zones.find(z => z.id === 'C')?.traffic || 0
        };

        const newPollutionPoint = {
          time: timestamp,
          zoneA: traffic.zones.find(z => z.id === 'A')?.pollution || 0,
          zoneB: traffic.zones.find(z => z.id === 'B')?.pollution || 0,
          zoneC: traffic.zones.find(z => z.id === 'C')?.pollution || 0
        };

        setChartData(prev => [...prev.slice(-9), newDataPoint]);
        setPollutionData(prev => [...prev.slice(-9), newPollutionPoint]);

      } catch (error) {
        console.error('Failed to fetch data:', error);
      }
    };

    fetchData();
    const interval = setInterval(fetchData, 5000);
    return () => clearInterval(interval);
  }, []);

  const handleCreateRule = async (ruleData) => {
    try {
      const newRule = await api.createRule(ruleData);
      setAutomationRules(prev => [...prev, newRule]);
    } catch (error) {
      console.error('Failed to create rule:', error);
    }
  };

  const handleUpdateRule = async (id, ruleData) => {
    try {
      const updatedRule = await api.updateRule(id, ruleData);
      setAutomationRules(prev => prev.map(rule => rule.id === id ? updatedRule : rule));
    } catch (error) {
      console.error('Failed to update rule:', error);
    }
  };

  const handleDeleteRule = async (id) => {
    try {
      await api.deleteRule(id);
      setAutomationRules(prev => prev.filter(rule => rule.id !== id));
    } catch (error) {
      console.error('Failed to delete rule:', error);
    }
  };

  const handleScenarioTest = async (scenarioData) => {
    try {
      return await api.testScenario(scenarioData);
    } catch (error) {
      console.error('Scenario test failed:', error);
      throw error;
    }
  };

  const renderCurrentView = () => {
    switch (currentView) {
      case 'dashboard':
        return (
          <div className="space-y-6">
            <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
              <WeatherWidget weather={weatherData} />
              
              <div className="bg-white rounded-lg p-6 shadow-lg">
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-2">
                    <Car className="w-6 h-6 text-blue-600" />
                    <span className="font-semibold">Avg Traffic</span>
                  </div>
                  <span className="text-2xl font-bold text-blue-600">
                    {trafficData ? Math.round(trafficData.zones.reduce((sum, z) => sum + z.traffic, 0) / trafficData.zones.length) : 0}%
                  </span>
                </div>
              </div>

              <div className="bg-white rounded-lg p-6 shadow-lg">
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-2">
                    <Activity className="w-6 h-6 text-red-600" />
                    <span className="font-semibold">Avg Pollution</span>
                  </div>
                  <span className="text-2xl font-bold text-red-600">
                    {trafficData ? Math.round(trafficData.zones.reduce((sum, z) => sum + z.pollution, 0) / trafficData.zones.length) : 0}
                  </span>
                </div>
              </div>

              <div className="bg-white rounded-lg p-6 shadow-lg">
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-2">
                    <AlertTriangle className="w-6 h-6 text-yellow-600" />
                    <span className="font-semibold">Active Rules</span>
                  </div>
                  <span className="text-2xl font-bold text-yellow-600">
                    {automationRules.filter(rule => rule.enabled).length}
                  </span>
                </div>
              </div>
            </div>

            <div className="grid grid-cols-1 xl:grid-cols-3 gap-6">
              <div className="xl:col-span-2">
                <div className="bg-white rounded-lg p-6 shadow-lg">
                  <h2 className="text-xl font-bold mb-4 flex items-center">
                    <Map className="w-5 h-5 mr-2" />
                    3D City Map
                  </h2>
                  <div className="h-96">
                    <CityMap3D 
                      trafficData={trafficData}
                      selectedZone={selectedZone}
                      onZoneClick={setSelectedZone}
                    />
                  </div>
                </div>
              </div>

              <div>
                <ZoneInfoPanel zone={selectedZone} data={trafficData} />
              </div>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              <TrafficChart data={chartData} />
              <PollutionChart data={pollutionData} />
            </div>
          </div>
        );

      case 'automation':
        return (
          <AutomationRules
            rules={automationRules}
            onCreateRule={handleCreateRule}
            onUpdateRule={handleUpdateRule}
            onDeleteRule={handleDeleteRule}
          />
        );

      case 'scenario':
        return <ScenarioTester onTestScenario={handleScenarioTest} />;

      default:
        return <div>View not found</div>;
    }
  };

  return (
    <div className="min-h-screen bg-gray-100">
      <header className="bg-white shadow-sm border-b">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            <div className="flex items-center space-x-4">
              <div className="flex items-center space-x-2">
                <div className="w-8 h-8 bg-gradient-to-r from-blue-600 to-purple-600 rounded-lg"></div>
                <h1 className="text-xl font-bold text-gray-900">Smart City Control</h1>
              </div>
            </div>

            <nav className="flex space-x-1">
              {[
                { id: 'dashboard', label: 'Dashboard', icon: BarChart3 },
                { id: 'automation', label: 'Automation', icon: Zap },
                { id: 'scenario', label: 'Scenarios', icon: Play }
              ].map((tab) => (
                <button
                  key={tab.id}
                  onClick={() => setCurrentView(tab.id)}
                  className={`px-4 py-2 rounded-lg flex items-center space-x-2 transition-colors ${
                    currentView === tab.id
                      ? 'bg-blue-600 text-white'
                      : 'text-gray-600 hover:bg-gray-100'
                  }`}
                >
                  <tab.icon className="w-4 h-4" />
                  <span>{tab.label}</span>
                </button>
              ))}
            </nav>
          </div>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {renderCurrentView()}
      </main>
    </div>
  );
};

export default SmartCityApp;
EOF

# Environment file
cat > .env << 'EOF'
VITE_API_BASE_URL=http://localhost:3001
VITE_DEV_MODE=true
VITE_DEBUG=false
VITE_POLLING_INTERVAL=5000
EOF

cat > .env.example << 'EOF'
VITE_API_BASE_URL=http://localhost:3001
VITE_DEV_MODE=true
VITE_DEBUG=false
VITE_POLLING_INTERVAL=5000
EOF

# Vite config
cat > vite.config.js << 'EOF'
import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

export default defineConfig({
  plugins: [react()],
  server: { port: 3000, host: true, open: true },
  build: { outDir: 'dist', sourcemap: true },
  optimizeDeps: { include: ['three', 'recharts'] }
})
EOF

# Update package.json scripts
npm pkg set scripts.start="vite"
npm pkg set scripts.build="vite build"
npm pkg set scripts.preview="vite preview"

# Create README
cat > README.md << 'EOF'
# Smart City Simulation Frontend

A modern React dashboard for smart city simulation with real-time 3D visualization.

## Features
- 🏙️ Interactive 3D city map with Three.js
- 📊 Real-time charts with Recharts
- ⚙️ Automation rules management
- 🧪 Scenario testing with AI predictions
- 📱 Responsive Tailwind CSS design

## Quick Start
```bash
npm install
npm run dev
```

## Environment Setup
Update `.env` with your backend API URL:
```
VITE_API_BASE_URL=http://your-backend-url:3001
```

## Backend Integration
Expects these endpoints:
- GET /weather/latest
- GET /traffic/latest
- GET /automation-rules
- POST /automation-rules
- PUT /automation-rules/:id
- DELETE /automation-rules/:id
- POST /scenario-bulk

Access at: http://localhost:3000
EOF

# Create .gitignore
cat > .gitignore << 'EOF'
node_modules
dist
*.local
.env
.DS_Store
EOF

echo ""
echo "✅ Smart City Frontend setup complete!"
echo ""
echo "🚀 Next steps:"
echo "   1. Update .env with your backend API URL"
echo "   2. npm run dev"
echo ""
echo "🌐 App will be available at: http://localhost:3000"
echo ""
echo "🎉 Happy coding!"