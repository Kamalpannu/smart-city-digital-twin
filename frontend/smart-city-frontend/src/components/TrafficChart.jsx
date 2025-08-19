import React from 'react';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';
import { Car } from 'lucide-react';

const TrafficChart = ({ data }) => {
  const validData = React.useMemo(() => {
    if (!Array.isArray(data) || data.length === 0) return [{ time: '00:00', zoneA: 0, zoneB: 0, zoneC: 0 }];
    console.log('TrafficChart data:', data);
    return data.map(item => ({
      time: item.time || 'N/A',
      zoneA: typeof item.zoneA === 'number' ? item.zoneA : 0,
      zoneB: typeof item.zoneB === 'number' ? item.zoneB : 0,
      zoneC: typeof item.zoneC === 'number' ? item.zoneC : 0
    }));
  }, [data]);

  return (
    <div className="bg-white rounded-lg p-6 shadow-lg">
      <h3 className="text-lg font-semibold mb-4 flex items-center">
        <Car className="w-5 h-5 mr-2" />
        Traffic Trends
      </h3>
      <ResponsiveContainer width="100%" height={200}>
        <LineChart data={validData} margin={{ top: 10, right: 10, left: 10, bottom: 10 }}>
          <CartesianGrid strokeDasharray="3 3" />
          <XAxis dataKey="time" />
          <YAxis domain={[0, 100]} />
          <Tooltip formatter={value => [`${Math.round(value)}%`, 'Traffic']} />
          <Line type="monotone" dataKey="zoneA" stroke="#3182ce" strokeWidth={2} dot={{ r: 3 }} />
          <Line type="monotone" dataKey="zoneB" stroke="#38a169" strokeWidth={2} dot={{ r: 3 }} />
          <Line type="monotone" dataKey="zoneC" stroke="#d69e2e" strokeWidth={2} dot={{ r: 3 }} />
        </LineChart>
      </ResponsiveContainer>
    </div>
  );
};

export default TrafficChart;
