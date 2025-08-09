import React, { useMemo } from "react";
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
  CartesianGrid,
} from "recharts";
import dayjs from "dayjs";
import { useSensorsStore } from "../../store/useSensorsStore";

export default function TrafficChart() {
  const history = useSensorsStore((s) => s.history);

  const data = useMemo(() => {
    return history.map((h) => {
      // If h.zones exists and is an array, calculate avgTraffic
      if (Array.isArray(h.zones) && h.zones.length > 0) {
        const avgTraffic =
          h.zones.reduce((sum, z) => sum + (Number(z.traffic) || 0), 0) /
          h.zones.length;
        return {
          ts: h.timestamp ? dayjs(h.timestamp).format("HH:mm:ss") : "",
          traffic: Number(avgTraffic.toFixed(1)),
        };
      }

      // Otherwise, try to use traffic directly if available
      if (typeof h.traffic === "number") {
        return {
          ts: h.timestamp ? dayjs(h.timestamp).format("HH:mm:ss") : "",
          traffic: Number(h.traffic.toFixed(1)),
        };
      }

      // If nothing matches, fallback to zero
      return {
        ts: h.timestamp ? dayjs(h.timestamp).format("HH:mm:ss") : "",
        traffic: 0,
      };
    });
  }, [history]);

  return (
    <div>
      <h3 style={{ margin: "0 0 8px" }}>Traffic (avg)</h3>
      <ResponsiveContainer width="100%" height={220}>
        <LineChart data={data}>
          <CartesianGrid strokeDasharray="4 4" />
          <XAxis dataKey="ts" />
          <YAxis domain={[0, 100]} />
          <Tooltip />
          <Line type="monotone" dataKey="traffic" stroke="#3B82F6" dot={false} />
        </LineChart>
      </ResponsiveContainer>
    </div>
  );
}
