import { useState, useEffect } from 'react';
import Dashboard from './views/Dashboard';
import AutomationView from './views/AutomationView';
import ScenarioView from './views/ScenarioView';
import { BarChart3, Zap, Play } from 'lucide-react';

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

const App = () => {
  const [currentView, setCurrentView] = useState('dashboard');
  
  // Safe default values
  const [weatherData, setWeatherData] = useState({ temperature: 0, humidity: 0, windSpeed: 0, pollution: 0, condition: 'N/A' });
  const [trafficData, setTrafficData] = useState({ zones: [] });
  const [automationRules, setAutomationRules] = useState([]);
  const [selectedZone, setSelectedZone] = useState(null);
  const [chartData, setChartData] = useState([{ time: '00:00', zoneA: 0, zoneB: 0, zoneC: 0 }]);
  const [pollutionData, setPollutionData] = useState([{ time: '00:00', zoneA: 0, zoneB: 0, zoneC: 0 }]);

  // Fetch data periodically
  useEffect(() => {
    const fetchData = async () => {
      try {
        const [weather, traffic, rules] = await Promise.all([
          api.getWeather(),
          api.getTraffic(),
          api.getAutomationRules()
        ]);

        setWeatherData(weather || { temperature: 0, humidity: 0, windSpeed: 0, pollution: 0, condition: 'N/A' });
        setTrafficData(traffic || { zones: [] });
        setAutomationRules(rules || []);

        if (traffic?.zones && traffic.zones.length) {
          const timestamp = new Date().toLocaleTimeString();

          setChartData(prev => [
            ...prev.slice(-9),
            {
              time: timestamp,
              zoneA: traffic.zones[0]?.traffic ?? 0,
              zoneB: traffic.zones[1]?.traffic ?? 0,
              zoneC: traffic.zones[2]?.traffic ?? 0,
            }
          ]);

          setPollutionData(prev => [
            ...prev.slice(-9),
            {
              time: timestamp,
              zoneA: traffic.zones[0]?.pollution ?? 0,
              zoneB: traffic.zones[1]?.pollution ?? 0,
              zoneC: traffic.zones[2]?.pollution ?? 0,
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

  // Automation rules handlers
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

  // Scenario test handler
  const handleScenarioTest = async (scenarioData) => {
    try {
      return await api.testScenario(scenarioData);
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
