import React, { useMemo } from "react";
import {
  AreaChart,
  Area,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
  CartesianGrid,
} from "recharts";
import dayjs from "dayjs";
import { useSensorsStore } from "../../store/useSensorsStore";

export default function PollutionChart() {
  const history = useSensorsStore((s) => s.history);

  const data = useMemo(() => {
    return history.map((h) => {
      // Check if h.zones is an array and has elements
      if (Array.isArray(h.zones) && h.zones.length > 0) {
        const avg =
          h.zones.reduce((sum, z) => sum + (Number(z.pollution) || 0), 0) /
          h.zones.length;
        return {
          ts: h.timestamp ? dayjs(h.timestamp).format("HH:mm:ss") : "",
          pollution: Number(avg.toFixed(1)),
        };
      }

      // Otherwise, fallback to direct pollution value if exists
      if (typeof h.pollution === "number") {
        return {
          ts: h.timestamp ? dayjs(h.timestamp).format("HH:mm:ss") : "",
          pollution: Number(h.pollution.toFixed(1)),
        };
      }

      // Fallback default
      return {
        ts: h.timestamp ? dayjs(h.timestamp).format("HH:mm:ss") : "",
        pollution: 0,
      };
    });
  }, [history]);

  return (
    <div>
      <h3 style={{ margin: "0 0 8px" }}>Pollution (avg)</h3>
      <ResponsiveContainer width="100%" height={220}>
        <AreaChart data={data}>
          <defs>
            <linearGradient id="polGrad" x1="0" y1="0" x2="0" y2="1">
              <stop offset="5%" stopColor="#10B981" stopOpacity={0.8} />
              <stop offset="95%" stopColor="#10B981" stopOpacity={0.1} />
            </linearGradient>
          </defs>
          <CartesianGrid strokeDasharray="4 4" />
          <XAxis dataKey="ts" />
          <YAxis domain={[0, 100]} />
          <Tooltip />
          <Area
            type="monotone"
            dataKey="pollution"
            stroke="#10B981"
            fill="url(#polGrad)"
          />
        </AreaChart>
      </ResponsiveContainer>
    </div>
  );
}
