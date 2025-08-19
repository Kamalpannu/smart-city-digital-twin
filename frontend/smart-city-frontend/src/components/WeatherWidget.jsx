import React from 'react';
import { Cloud, Thermometer, Droplets, Wind, Activity } from 'lucide-react';

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

export default WeatherWidget;
