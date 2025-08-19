import React from 'react';
import WeatherWidget from '../components/WeatherWidget';
import ZoneInfoPanel from '../components/ZoneInfoPanel';
import TrafficChart from '../components/TrafficChart';
import PollutionChart from '../components/PollutionChart';
import CityMap3D from '../components/CityMap3D';
import { Car, Activity, AlertTriangle, Map } from 'lucide-react';

// Error boundary for charts
class ChartErrorBoundary extends React.Component {
  constructor(props) {
    super(props);
    this.state = { hasError: false };
  }
  static getDerivedStateFromError(error) {
    return { hasError: true };
  }
  render() {
    if (this.state.hasError) {
      return <div className="text-red-600">Chart failed to render</div>;
    }
    return this.props.children;
  }
}

const Dashboard = ({
  weatherData,
  trafficData,
  automationRules,
  chartData,
  pollutionData,
  selectedZone,
  setSelectedZone
}) => {
  // Safe averages
  const avgTraffic = trafficData?.zones?.length
    ? Math.round(trafficData.zones.reduce((sum, z) => sum + (z.traffic || 0), 0) / trafficData.zones.length)
    : 0;
  
  const avgPollution = trafficData?.zones?.length
    ? Math.round(trafficData.zones.reduce((sum, z) => sum + (z.pollution || 0), 0) / trafficData.zones.length)
    : 0;

  const activeRules = Array.isArray(automationRules)
    ? automationRules.filter(r => r.enabled).length
    : 0;

  return (
    <div className="space-y-6">
      {/* Top widgets */}
      <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
        <WeatherWidget weather={weatherData || { temperature: 0, humidity: 0, windSpeed: 0, pollution: 0, condition: 'N/A' }} />

        <div className="bg-white rounded-lg p-6 shadow-lg">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-2">
              <Car className="w-6 h-6 text-blue-600" />
              <span className="font-semibold">Avg Traffic</span>
            </div>
            <span className="text-2xl font-bold text-blue-600">{avgTraffic}%</span>
          </div>
        </div>

        <div className="bg-white rounded-lg p-6 shadow-lg">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-2">
              <Activity className="w-6 h-6 text-red-600" />
              <span className="font-semibold">Avg Pollution</span>
            </div>
            <span className="text-2xl font-bold text-red-600">{avgPollution}</span>
          </div>
        </div>

        <div className="bg-white rounded-lg p-6 shadow-lg">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-2">
              <AlertTriangle className="w-6 h-6 text-yellow-600" />
              <span className="font-semibold">Active Rules</span>
            </div>
            <span className="text-2xl font-bold text-yellow-600">{activeRules}</span>
          </div>
        </div>
      </div>

      {/* Map + Zone Info */}
      <div className="grid grid-cols-1 xl:grid-cols-3 gap-6">
        <div className="xl:col-span-2">
          <div className="bg-white rounded-lg p-6 shadow-lg">
            <h2 className="text-xl font-bold mb-4 flex items-center">
              <Map className="w-5 h-5 mr-2" />
              3D City Map
            </h2>
            <div className="h-96">
              <CityMap3D
                trafficData={trafficData || { zones: [] }}
                selectedZone={selectedZone}
                onZoneClick={setSelectedZone}
              />
            </div>
          </div>
        </div>

        <div>
          <ZoneInfoPanel zone={selectedZone} data={trafficData || { zones: [] }} />
        </div>
      </div>

      {/* Charts */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <ChartErrorBoundary>
          <TrafficChart data={chartData || [{ time: '00:00', zoneA: 0, zoneB: 0, zoneC: 0 }]} />
        </ChartErrorBoundary>
        <ChartErrorBoundary>
          <PollutionChart data={pollutionData || [{ time: '00:00', zoneA: 0, zoneB: 0, zoneC: 0 }]} />
        </ChartErrorBoundary>
      </div>
    </div>
  );
};

export default Dashboard;
