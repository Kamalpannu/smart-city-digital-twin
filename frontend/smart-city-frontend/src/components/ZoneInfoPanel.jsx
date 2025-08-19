import React from 'react';

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

export default ZoneInfoPanel;
