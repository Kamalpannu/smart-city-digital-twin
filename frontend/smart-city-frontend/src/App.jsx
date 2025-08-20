import { useState, useEffect } from 'react';
import Dashboard from './views/Dashboard';
import AutomationView from './views/AutomationView';
import ScenarioView from './views/ScenarioView';
import { BarChart3, Zap, Play } from 'lucide-react';

const API_BASE = 'http://localhost:4000'; // Update port if needed

const App = () => {
  const [currentView, setCurrentView] = useState('dashboard');

  const [weatherData, setWeatherData] = useState({ 
    temperature: 0, 
    humidity: 0, 
    windSpeed: 0, 
    pollution: 0, 
    condition: 'N/A' 
  });
  const [trafficData, setTrafficData] = useState({ zones: [] });
  const [automationRules, setAutomationRules] = useState([]);
  const [selectedZone, setSelectedZone] = useState(null);
  const [chartData, setChartData] = useState([{ time: '00:00', zoneA: 0, zoneB: 0, zoneC: 0 }]);
  const [pollutionData, setPollutionData] = useState([{ time: '00:00', zoneA: 0, zoneB: 0, zoneC: 0 }]);

  // Fetch data periodically
  useEffect(() => {
    const fetchData = async () => {
      try {
        // Weather
        const weatherRes = await fetch(`${API_BASE}/weather-widget`);
        const weather = await weatherRes.json();
        setWeatherData({
          temperature: weather.temperature || 0,
          humidity: weather.humidity || 0,
          windSpeed: weather.windSpeed || 0,
          pollution: weather.pollution || 0,
          condition: weather.condition || 'N/A'
        });

        // Latest traffic & pollution
        const trafficRes = await fetch(`${API_BASE}/latest`);
        const latest = await trafficRes.json();
        const zones = ['A', 'B', 'C'].map(z => ({
          id: z,
          traffic: latest[z]?.traffic ?? 0,
          pollution: latest[z]?.pollution ?? 0
        }));
        setTrafficData({ zones });

        // Automation rules
        const rulesRes = await fetch(`${API_BASE}/automation-rules`);
        const rules = await rulesRes.json();
        setAutomationRules(rules);

        // Update chart & pollution data
        if (zones.length) {
          const timestamp = new Date().toLocaleTimeString();
          setChartData(prev => [
            ...prev.slice(-9),
            {
              time: timestamp,
              zoneA: zones[0]?.traffic ?? 0,
              zoneB: zones[1]?.traffic ?? 0,
              zoneC: zones[2]?.traffic ?? 0
            }
          ]);
          setPollutionData(prev => [
            ...prev.slice(-9),
            {
              time: timestamp,
              zoneA: zones[0]?.pollution ?? 0,
              zoneB: zones[1]?.pollution ?? 0,
              zoneC: zones[2]?.pollution ?? 0
            }
          ]);
        }

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
      const res = await fetch(`${API_BASE}/automation-rules`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(ruleData)
      });
      const newRule = await res.json();
      setAutomationRules(prev => [...prev, newRule]);
    } catch (error) {
      console.error('Failed to create rule:', error);
    }
  };

  const handleUpdateRule = async (id, ruleData) => {
    try {
      const res = await fetch(`${API_BASE}/automation-rules/${id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(ruleData)
      });
      const updatedRule = await res.json();
      setAutomationRules(prev => prev.map(rule => rule.id === id ? updatedRule : rule));
    } catch (error) {
      console.error('Failed to update rule:', error);
    }
  };

  const handleDeleteRule = async (id) => {
    try {
      await fetch(`${API_BASE}/automation-rules/${id}`, { method: 'DELETE' });
      setAutomationRules(prev => prev.filter(rule => rule.id !== id));
    } catch (error) {
      console.error('Failed to delete rule:', error);
    }
  };

  // Scenario test handler
  const handleScenarioTest = async (scenarioData) => {
    try {
      const res = await fetch(`${API_BASE}/ingest`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(scenarioData)
      });
      const result = await res.json();
      return result;
    } catch (error) {
      console.error('Scenario test failed:', error);
      throw error;
    }
  };

  // Render current view
  const renderCurrentView = () => {
    switch (currentView) {
      case 'dashboard':
        return (
          <Dashboard
            weatherData={weatherData}
            trafficData={trafficData}
            automationRules={automationRules}
            chartData={chartData}
            pollutionData={pollutionData}
            selectedZone={selectedZone}
            setSelectedZone={setSelectedZone}
          />
        );
      case 'automation':
        return (
          <AutomationView
            rules={automationRules}
            onCreateRule={handleCreateRule}
            onUpdateRule={handleUpdateRule}
            onDeleteRule={handleDeleteRule}
          />
        );
      case 'scenario':
        return <ScenarioView onTestScenario={handleScenarioTest} />;
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
              ].map(tab => (
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

export default App;
