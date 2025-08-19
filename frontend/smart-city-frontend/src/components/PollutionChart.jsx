import React from 'react';
import { ResponsiveContainer, AreaChart, Area, CartesianGrid, XAxis, YAxis, Tooltip } from 'recharts';
import { Activity } from 'lucide-react';

const PollutionChart = ({ data }) => {
  const validData = React.useMemo(() => {
    if (!Array.isArray(data) || data.length === 0) {
      return [{ time: '00:00', zoneA: 0, zoneB: 0, zoneC: 0 }];
    }

    return data.map(item => ({
      time: item.time || 'N/A',
      zoneA: Number(item.zoneA) || 0,
      zoneB: Number(item.zoneB) || 0,
      zoneC: Number(item.zoneC) || 0
    }));
  }, [data]);

  if (validData.length === 0) return <div>No data available</div>;

  return (
    <div className="bg-white rounded-lg p-6 shadow-lg">
      <h3 className="text-lg font-semibold mb-4 flex items-center">
        <Activity className="w-5 h-5 mr-2" />
        Pollution Levels
      </h3>
      <ResponsiveContainer width="100%" height={200}>
        <AreaChart data={validData} margin={{ top: 10, right: 10, left: 10, bottom: 10 }}>
          <CartesianGrid strokeDasharray="3 3" />
          <XAxis dataKey="time" />
          <YAxis domain={[0, 'dataMax + 10']} />
          <Tooltip formatter={value => [Math.round(value), 'Pollution Level']} />
          <Area type="monotone" dataKey="zoneA" stackId="1" stroke="#ef4444" fill="#ef4444" fillOpacity={0.3} />
          <Area type="monotone" dataKey="zoneB" stackId="1" stroke="#f59e0b" fill="#f59e0b" fillOpacity={0.3} />
          <Area type="monotone" dataKey="zoneC" stackId="1" stroke="#10b981" fill="#10b981" fillOpacity={0.3} />
        </AreaChart>
      </ResponsiveContainer>
    </div>
  );
};

export default PollutionChart;
