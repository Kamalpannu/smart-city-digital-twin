import React, { useState, useEffect, useRef, Suspense } from 'react';
import * as THREE from 'three';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, BarChart, Bar } from 'recharts';
import { 
  Cloud, 
  Car, 
  AlertTriangle, 
  Settings, 
  Play, 
  Plus, 
  Edit, 
  Trash2, 
  Save,
  X,
  MapPin,
  Activity,
  Wind,
  Thermometer,
  Droplets
} from 'lucide-react';

// Mock API functions (replace with your backend URLs)
const API_BASE = 'http://localhost:3001'; // Replace with your backend URL

const api = {
  getWeatherLatest: () => fetch(`${API_BASE}/weather/latest`).then(r => r.json()).catch(() => mockWeatherData),
  getTrafficLatest: () => fetch(`${API_BASE}/traffic/latest`).then(r => r.json()).catch(() => mockTrafficData),
  postScenarioBulk: (data) => fetch(`${API_BASE}/scenario-bulk`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(data)
  }).then(r => r.json()).catch(() => mockScenarioResponse),
  getAutomationRules: () => fetch(`${API_BASE}/automation-rules`).then(r => r.json()).catch(() => mockRules),
  createAutomationRule: (rule) => fetch(`${API_BASE}/automation-rules`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(rule)
  }).then(r => r.json()),
  updateAutomationRule: (id, rule) => fetch(`${API_BASE}/automation-rules/${id}`, {
    method: 'PUT',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(rule)
  }).then(r => r.json()),
  deleteAutomationRule: (id) => fetch(`${API_BASE}/automation-rules/${id}`, {
    method: 'DELETE'
  }).then(r => r.json())
};

// Mock data for development
const mockWeatherData = {
  temperature: 22,
  humidity: 65,
  windSpeed: 12,
  pollution: 45,
  timestamp: new Date().toISOString()
};

const mockTrafficData = {
  zones: [
    { id: 'A', traffic: 75, pollution: 40, reroute: 'consider' },
    { id: 'B', traffic: 45, pollution: 25, reroute: 'none' },
    { id: 'C', traffic: 90, pollution: 60, reroute: 'urgent' }
  ],
  timestamp: new Date().toISOString()
};

const mockScenarioResponse = {
  predicted_traffic: 85,
  reroute_suggested: 'urgent',
  analysis: 'High congestion expected due to road closure. Recommend alternative routes.'
};

const mockRules = [
  { id: 1, zone: 'A', condition: 'traffic > 80', action: 'reroute_traffic' },
  { id: 2, zone: 'B', condition: 'pollution > 50', action: 'reduce_speed_limit' }
];

// 3D City Map Component
function CityMap3D({ trafficData, selectedZone, onZoneClick, scenarioData }) {
  const mountRef = useRef(null);
  const sceneRef = useRef(null);
  const rendererRef = useRef(null);
  const zonesRef = useRef({});

  useEffect(() => {
    if (!mountRef.current) return;

    // Scene setup
    const scene = new THREE.Scene();
    scene.background = new THREE.Color(0x87CEEB);
    sceneRef.current = scene;

    // Camera
    const camera = new THREE.PerspectiveCamera(75, 800 / 600, 0.1, 1000);
    camera.position.set(0, 15, 20);
    camera.lookAt(0, 0, 0);

    // Renderer
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
    directionalLight.position.set(10, 10, 5);
    directionalLight.castShadow = true;
    scene.add(directionalLight);

    // Ground
    const groundGeometry = new THREE.PlaneGeometry(30, 30);
    const groundMaterial = new THREE.MeshLambertMaterial({ color: 0x90EE90 });
    const ground = new THREE.Mesh(groundGeometry, groundMaterial);
    ground.rotation.x = -Math.PI / 2;
    ground.receiveShadow = true;
    scene.add(ground);

    // Roads
    const roadGeometry = new THREE.PlaneGeometry(25, 2);
    const roadMaterial = new THREE.MeshLambertMaterial({ color: 0x333333 });
    
    // Main road (horizontal)
    const mainRoad = new THREE.Mesh(roadGeometry, roadMaterial);
    mainRoad.rotation.x = -Math.PI / 2;
    mainRoad.position.y = 0.01;
    scene.add(mainRoad);

    // Cross road (vertical)
    const crossRoad = new THREE.Mesh(roadGeometry, roadMaterial);
    crossRoad.rotation.x = -Math.PI / 2;
    crossRoad.rotation.z = Math.PI / 2;
    crossRoad.position.y = 0.01;
    scene.add(crossRoad);

    // Buildings and zones
    const buildingGeometry = new THREE.BoxGeometry(2, 3, 2);
    const zonePositions = { A: [-8, 0, -8], B: [8, 0, -8], C: [0, 0, 8] };
    const zoneColors = { A: 0x4CAF50, B: 0x2196F3, C: 0xFF9800 };

    Object.keys(zonePositions).forEach(zoneId => {
      const [x, y, z] = zonePositions[zoneId];
      
      // Buildings
      for (let i = 0; i < 4; i++) {
        const buildingMaterial = new THREE.MeshLambertMaterial({ color: zoneColors[zoneId] });
        const building = new THREE.Mesh(buildingGeometry, buildingMaterial);
        const offsetX = (i % 2) * 3 - 1.5;
        const offsetZ = Math.floor(i / 2) * 3 - 1.5;
        building.position.set(x + offsetX, 1.5, z + offsetZ);
        building.castShadow = true;
        building.userData = { zone: zoneId };
        scene.add(building);
        
        if (!zonesRef.current[zoneId]) zonesRef.current[zoneId] = [];
        zonesRef.current[zoneId].push(building);
      }

      // Zone label
      const labelGeometry = new THREE.PlaneGeometry(2, 1);
      const canvas = document.createElement('canvas');
      const context = canvas.getContext('2d');
      canvas.width = 128;
      canvas.height = 64;
      context.fillStyle = '#ffffff';
      context.fillRect(0, 0, 128, 64);
      context.fillStyle = '#000000';
      context.font = '24px Arial';
      context.textAlign = 'center';
      context.fillText(`Zone ${zoneId}`, 64, 40);
      
      const labelTexture = new THREE.CanvasTexture(canvas);
      const labelMaterial = new THREE.MeshBasicMaterial({ map: labelTexture, transparent: true });
      const label = new THREE.Mesh(labelGeometry, labelMaterial);
      label.position.set(x, 4, z);
      scene.add(label);
    });

    // Mouse interaction
    const raycaster = new THREE.Raycaster();
    const mouse = new THREE.Vector2();

    const onMouseClick = (event) => {
      const rect = renderer.domElement.getBoundingClientRect();
      mouse.x = ((event.clientX - rect.left) / rect.width) * 2 - 1;
      mouse.y = -((event.clientY - rect.top) / rect.height) * 2 + 1;

      raycaster.setFromCamera(mouse, camera);
      const intersects = raycaster.intersectObjects(scene.children);
      
      if (intersects.length > 0) {
        const object = intersects[0].object;
        if (object.userData && object.userData.zone) {
          onZoneClick(object.userData.zone);
        }
      }
    };

    renderer.domElement.addEventListener('click', onMouseClick);

    // Animation loop
    const animate = () => {
      requestAnimationFrame(animate);
      renderer.render(scene, camera);
    };
    animate();

    return () => {
      renderer.domElement.removeEventListener('click', onMouseClick);
      if (mountRef.current && renderer.domElement) {
        mountRef.current.removeChild(renderer.domElement);
      }
      renderer.dispose();
    };
  }, [onZoneClick]);

  // Update zone colors based on traffic data
  useEffect(() => {
    if (!trafficData || !zonesRef.current) return;

    trafficData.zones.forEach(zone => {
      const zoneObjects = zonesRef.current[zone.id];
      if (zoneObjects) {
        let color = 0x4CAF50; // Green (low traffic)
        if (zone.traffic > 70) color = 0xFF5722; // Red (high traffic)
        else if (zone.traffic > 50) color = 0xFF9800; // Orange (medium traffic)

        zoneObjects.forEach(obj => {
          obj.material.color.setHex(color);
        });
      }
    });
  }, [trafficData]);

  return <div ref={mountRef} className="w-full h-96 border rounded-lg overflow-hidden" />;
}

// Weather Panel Component
function WeatherPanel({ weather }) {
  if (!weather) return <div className="p-4">Loading weather...</div>;

  return (
    <div className="bg-white p-4 rounded-lg shadow">
      <h3 className="text-lg font-semibold mb-3 flex items-center gap-2">
        <Cloud className="h-5 w-5" />
        Weather Conditions
      </h3>
      <div className="grid grid-cols-2 gap-4">
        <div className="flex items-center gap-2">
          <Thermometer className="h-4 w-4 text-red-500" />
          <span className="text-sm text-red-500">Temperature: {weather.temperature}°C</span>
        </div>
        <div className="flex items-center gap-2">
          <Droplets className="h-4 w-4 text-blue-500" />
          <span className="text-sm">Humidity: {weather.humidity}%</span>
        </div>
        <div className="flex items-center gap-2">
          <Wind className="h-4 w-4 text-gray-500" />
          <span className="text-sm">Wind: {weather.windSpeed} km/h</span>
        </div>
        <div className="flex items-center gap-2">
          <AlertTriangle className="h-4 w-4 text-yellow-500" />
          <span className="text-sm">Pollution: {weather.pollution} AQI</span>
        </div>
      </div>
    </div>
  );
}

// Traffic Charts Component
function TrafficCharts({ trafficHistory }) {
  const chartData = trafficHistory.map((data, index) => ({
    time: `${String(index * 5).padStart(2, '0')}:00`,
    zoneA: data.zones.find(z => z.id === 'A')?.traffic || 0,
    zoneB: data.zones.find(z => z.id === 'B')?.traffic || 0,
    zoneC: data.zones.find(z => z.id === 'C')?.traffic || 0,
  }));

  return (
    <div className="bg-white p-4 rounded-lg shadow">
      <h3 className="text-lg font-semibold mb-3 flex items-center gap-2">
        <Car className="h-5 w-5" />
        Traffic Trends
      </h3>
      <ResponsiveContainer width="100%" height={200}>
        <LineChart data={chartData}>
          <CartesianGrid strokeDasharray="3 3" />
          <XAxis dataKey="time" />
          <YAxis />
          <Tooltip />
          <Line type="monotone" dataKey="zoneA" stroke="#4CAF50" name="Zone A" />
          <Line type="monotone" dataKey="zoneB" stroke="#2196F3" name="Zone B" />
          <Line type="monotone" dataKey="zoneC" stroke="#FF9800" name="Zone C" />
        </LineChart>
      </ResponsiveContainer>
    </div>
  );
}

// Zone Info Panel
function ZoneInfoPanel({ zone, trafficData }) {
  if (!zone || !trafficData) return null;

  const zoneData = trafficData.zones.find(z => z.id === zone);
  if (!zoneData) return null;

  const getRerouteColor = (reroute) => {
    switch (reroute) {
      case 'urgent': return 'text-red-600 bg-red-50';
      case 'consider': return 'text-yellow-600 bg-yellow-50';
      default: return 'text-green-600 bg-green-50';
    }
  };

  return (
    <div className="bg-white p-4 rounded-lg shadow">
      <h3 className="text-lg font-semibold mb-3 flex items-center gap-2">
        <MapPin className="h-5 w-5" />
        Zone {zone} Details
      </h3>
      <div className="space-y-2">
        <div className="flex justify-between">
          <span>Traffic Level:</span>
          <span className="font-medium">{zoneData.traffic}%</span>
        </div>
        <div className="flex justify-between">
          <span>Pollution:</span>
          <span className="font-medium">{zoneData.pollution} AQI</span>
        </div>
        <div className="flex justify-between items-center">
          <span>Reroute Status:</span>
          <span className={`px-2 py-1 rounded text-sm ${getRerouteColor(zoneData.reroute)}`}>
            {zoneData.reroute}
          </span>
        </div>
      </div>
    </div>
  );
}

// Rule Form Component
function RuleForm({ rule, onSave, onCancel }) {
  const [formData, setFormData] = useState(rule || { zone: 'A', condition: '', action: '' });

  const handleSubmit = (e) => {
    e.preventDefault();
    onSave(formData);
  };

  return (
    <form onSubmit={handleSubmit} className="bg-gray-50 p-4 rounded-lg space-y-4">
      <div className="grid grid-cols-3 gap-4">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Zone</label>
          <select
            value={formData.zone}
            onChange={(e) => setFormData({ ...formData, zone: e.target.value })}
            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
          >
            <option value="A">Zone A</option>
            <option value="B">Zone B</option>
            <option value="C">Zone C</option>
          </select>
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Condition</label>
          <input
            type="text"
            value={formData.condition}
            onChange={(e) => setFormData({ ...formData, condition: e.target.value })}
            placeholder="e.g., traffic > 80"
            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            required
          />
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Action</label>
          <select
            value={formData.action}
            onChange={(e) => setFormData({ ...formData, action: e.target.value })}
            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            required
          >
            <option value="">Select action</option>
            <option value="reroute_traffic">Reroute Traffic</option>
            <option value="reduce_speed_limit">Reduce Speed Limit</option>
            <option value="alert_authorities">Alert Authorities</option>
          </select>
        </div>
      </div>
      <div className="flex gap-2">
        <button
          type="submit"
          className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 flex items-center gap-2"
        >
          <Save className="h-4 w-4" />
          Save
        </button>
        <button
          type="button"
          onClick={onCancel}
          className="px-4 py-2 bg-gray-500 text-white rounded-md hover:bg-gray-600 flex items-center gap-2"
        >
          <X className="h-4 w-4" />
          Cancel
        </button>
      </div>
    </form>
  );
}

// Automation Rules Component
function AutomationRules() {
  const [rules, setRules] = useState([]);
  const [editingRule, setEditingRule] = useState(null);
  const [showForm, setShowForm] = useState(false);

  useEffect(() => {
    loadRules();
  }, []);

  const loadRules = async () => {
    try {
      const data = await api.getAutomationRules();
      setRules(Array.isArray(data) ? data : []);
    } catch (error) {
      console.error('Failed to load rules:', error);
      setRules(mockRules);
    }
  };

  const handleSaveRule = async (rule) => {
    try {
      if (editingRule) {
        await api.updateAutomationRule(editingRule.id, rule);
      } else {
        await api.createAutomationRule(rule);
      }
      loadRules();
      setEditingRule(null);
      setShowForm(false);
    } catch (error) {
      console.error('Failed to save rule:', error);
    }
  };

  const handleDeleteRule = async (id) => {
    try {
      await api.deleteAutomationRule(id);
      loadRules();
    } catch (error) {
      console.error('Failed to delete rule:', error);
    }
  };

  return (
    <div className="bg-white p-6 rounded-lg shadow">
      <div className="flex justify-between items-center mb-4">
        <h2 className="text-xl font-semibold flex items-center gap-2">
          <Settings className="h-6 w-6" />
          Automation Rules
        </h2>
        <button
          onClick={() => setShowForm(true)}
          className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 flex items-center gap-2"
        >
          <Plus className="h-4 w-4" />
          Add Rule
        </button>
      </div>

      {(showForm || editingRule) && (
        <div className="mb-6">
          <RuleForm
            rule={editingRule}
            onSave={handleSaveRule}
            onCancel={() => {
              setShowForm(false);
              setEditingRule(null);
            }}
          />
        </div>
      )}

      <div className="overflow-x-auto">
        <table className="w-full border-collapse border border-gray-300">
          <thead className="bg-gray-50">
            <tr>
              <th className="border border-gray-300 px-4 py-2 text-left">Zone</th>
              <th className="border border-gray-300 px-4 py-2 text-left">Condition</th>
              <th className="border border-gray-300 px-4 py-2 text-left">Action</th>
              <th className="border border-gray-300 px-4 py-2 text-left">Actions</th>
            </tr>
          </thead>
          <tbody>
            {rules.map((rule) => (
              <tr key={rule.id} className="hover:bg-gray-50">
                <td className="border border-gray-300 px-4 py-2">Zone {rule.zone}</td>
                <td className="border border-gray-300 px-4 py-2">{rule.condition}</td>
                <td className="border border-gray-300 px-4 py-2">{rule.action}</td>
                <td className="border border-gray-300 px-4 py-2">
                  <div className="flex gap-2">
                    <button
                      onClick={() => setEditingRule(rule)}
                      className="p-1 text-blue-600 hover:text-blue-800"
                    >
                      <Edit className="h-4 w-4" />
                    </button>
                    <button
                      onClick={() => handleDeleteRule(rule.id)}
                      className="p-1 text-red-600 hover:text-red-800"
                    >
                      <Trash2 className="h-4 w-4" />
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
}

// Scenario Tester Component
function ScenarioTester({ onScenarioResult }) {
  const [formData, setFormData] = useState({
    zone: 'A',
    event: 'road_closure',
    duration: 30
  });
  const [isLoading, setIsLoading] = useState(false);
  const [result, setResult] = useState(null);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setIsLoading(true);
    
    try {
      const scenarioData = {
        ts: new Date().toISOString(),
        zones: [{
          id: formData.zone,
          traffic: formData.event === 'road_closure' ? 90 : 70,
          pollution: formData.event === 'pollution_spike' ? 80 : 40,
          event: formData.event
        }]
      };
      
      const response = await api.postScenarioBulk(scenarioData);
      setResult(response);
      onScenarioResult(response);
    } catch (error) {
      console.error('Scenario test failed:', error);
      const mockResponse = mockScenarioResponse;
      setResult(mockResponse);
      onScenarioResult(mockResponse);
    }
    
    setIsLoading(false);
  };

  return (
    <div className="bg-white p-6 rounded-lg shadow">
      <h2 className="text-xl font-semibold mb-4 flex items-center gap-2">
        <Play className="h-6 w-6" />
        Scenario Testing
      </h2>
      
      <form onSubmit={handleSubmit} className="space-y-4 mb-6">
        <div className="grid grid-cols-3 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Zone</label>
            <select
              value={formData.zone}
              onChange={(e) => setFormData({ ...formData, zone: e.target.value })}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              <option value="A">Zone A</option>
              <option value="B">Zone B</option>
              <option value="C">Zone C</option>
            </select>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Event Type</label>
            <select
              value={formData.event}
              onChange={(e) => setFormData({ ...formData, event: e.target.value })}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              <option value="road_closure">Road Closure</option>
              <option value="pollution_spike">Pollution Spike</option>
              <option value="traffic_jam">Traffic Jam</option>
            </select>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Duration (minutes)</label>
            <input
              type="number"
              value={formData.duration}
              onChange={(e) => setFormData({ ...formData, duration: parseInt(e.target.value) })}
              min="1"
              max="240"
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>
        </div>
        
        <button
          type="submit"
          disabled={isLoading}
          className="px-6 py-2 bg-green-600 text-white rounded-md hover:bg-green-700 disabled:opacity-50 flex items-center gap-2"
        >
          <Play className="h-4 w-4" />
          {isLoading ? 'Testing...' : 'Run Scenario'}
        </button>
      </form>

      {result && (
        <div className="bg-gray-50 p-4 rounded-lg">
          <h3 className="font-semibold mb-2">AI Prediction Results:</h3>
          <div className="space-y-2 text-sm">
            <div>
              <strong>Predicted Traffic:</strong> {result.predicted_traffic}%
            </div>
            <div>
              <strong>Reroute Suggested:</strong> 
              <span className={`ml-2 px-2 py-1 rounded text-xs ${
                result.reroute_suggested === 'urgent' ? 'bg-red-100 text-red-800' :
                result.reroute_suggested === 'consider' ? 'bg-yellow-100 text-yellow-800' :
                'bg-green-100 text-green-800'
              }`}>
                {result.reroute_suggested}
              </span>
            </div>
            <div>
              <strong>Analysis:</strong>
              <p className="mt-1 text-gray-700">{result.analysis}</p>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

// Main App Component
function SmartCityApp() {
  const [currentView, setCurrentView] = useState('dashboard');
  const [weatherData, setWeatherData] = useState(null);
  const [trafficData, setTrafficData] = useState(null);
  const [trafficHistory, setTrafficHistory] = useState([]);
  const [selectedZone, setSelectedZone] = useState(null);
  const [scenarioResult, setScenarioResult] = useState(null);

  // Real-time data polling
  useEffect(() => {
    const fetchData = async () => {
      try {
        const [weather, traffic] = await Promise.all([
          api.getWeatherLatest(),
          api.getTrafficLatest()
        ]);
        
        setWeatherData(weather);
        setTrafficData(traffic);
        
        // Update traffic history (keep last 10 readings)
        setTrafficHistory(prev => {
          const newHistory = [...prev, traffic].slice(-10);
          return newHistory;
        });
      } catch (error) {
        console.error('Failed to fetch data:', error);
      }
    };

    fetchData();
    const interval = setInterval(fetchData, 10000); // Poll every 10 seconds

    return () => clearInterval(interval);
  }, []);

  const renderView = () => {
    switch (currentView) {
      case 'dashboard':
        return (
          <div className="space-y-6">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              <div className="space-y-6">
                <WeatherPanel weather={weatherData} />
                {selectedZone && (
                  <ZoneInfoPanel zone={selectedZone} trafficData={trafficData} />
                )}
                {scenarioResult && (
                  <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                    <h3 className="font-semibold text-blue-800 mb-2">Latest Scenario Result</h3>
                    <p className="text-sm text-blue-700">{scenarioResult.analysis}</p>
                  </div>
                )}
              </div>
              <div>
                <CityMap3D
                  trafficData={trafficData}
                  selectedZone={selectedZone}
                  onZoneClick={setSelectedZone}
                  scenarioData={scenarioResult}
                />
              </div>
            </div>
            {trafficHistory.length > 0 && (
              <TrafficCharts trafficHistory={trafficHistory} />
            )}
          </div>
        );
      case 'automation':
        return <AutomationRules />;
      case 'scenarios':
        return <ScenarioTester onScenarioResult={setScenarioResult} />;
      default:
        return (
          <div className="p-6 text-center">
            <h2 className="text-xl font-semibold mb-2">Welcome to Smart City Simulation</h2>
            <p className="text-gray-600">Select a view from the navigation above.</p>
          </div>
        );
    }
  };

  return (
    <div className="min-h-screen bg-gray-100">
      {/* Header */}
      <header className="bg-white shadow-sm border-b border-gray-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            <div className="flex items-center gap-3">
              <Activity className="h-8 w-8 text-blue-600" />
              <h1 className="text-xl font-bold text-gray-900">Smart City Control</h1>
            </div>
            <nav className="flex space-x-8">
              <button
                onClick={() => setCurrentView('dashboard')}
                className={`px-3 py-2 rounded-md text-sm font-medium ${
                  currentView === 'dashboard'
                    ? 'bg-blue-100 text-blue-700'
                    : 'text-gray-500 hover:text-gray-700'
                }`}
              >
                Dashboard
              </button>
              <button
                onClick={() => setCurrentView('automation')}
                className={`px-3 py-2 rounded-md text-sm font-medium ${
                  currentView === 'automation'
                    ? 'bg-blue-100 text-blue-700'
                    : 'text-gray-500 hover:text-gray-700'
                }`}
              >
                Automation
              </button>
              <button
                onClick={() => setCurrentView('scenarios')}
                className={`px-3 py-2 rounded-md text-sm font-medium ${
                  currentView === 'scenarios'
                    ? 'bg-blue-100 text-blue-700'
                    : 'text-gray-500 hover:text-gray-700'
                }`}
              >
                Scenarios
              </button>
            </nav>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {renderView()}
      </main>
    </div>
  );
}

export default SmartCityApp;
