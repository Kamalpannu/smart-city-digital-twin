import React, { useMemo } from "react";
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
  CartesianGrid,
} from "recharts";
import dayjs from "dayjs";
import { useSensorsStore } from "../../store/useSensorsStore";

export default function EnergyChart() {
  const history = useSensorsStore((s) => s.history);

  const data = useMemo(() => {
    return history.map((h) => {
      const avgTraffic =
        Array.isArray(h.zones) && h.zones.length
          ? h.zones.reduce((sum, z) => sum + (Number(z.traffic) || 0), 0) /
            h.zones.length
          : 0;
      const energy = Math.max(0, 100 - avgTraffic); // simplistic proxy

      return {
        ts: h.timestamp ? dayjs(h.timestamp).format("HH:mm:ss") : "",
        energy: Number(energy.toFixed(1)),
      };
    });
  }, [history]);

  return (
    <div>
      <h3 style={{ margin: "0 0 8px" }}>Energy Load (proxy)</h3>
      <ResponsiveContainer width="100%" height={220}>
        <BarChart data={data}>
          <CartesianGrid strokeDasharray="4 4" />
          <XAxis dataKey="ts" />
          <YAxis domain={[0, 100]} />
          <Tooltip />
          <Bar dataKey="energy" fill="#F59E0B" />
        </BarChart>
      </ResponsiveContainer>
    </div>
  );
}
