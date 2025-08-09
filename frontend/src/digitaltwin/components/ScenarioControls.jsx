import React, { useState } from "react";
import dayjs from "dayjs";
import { ingestData } from "../services/api";
import { useSensorsStore } from "../store/useSensorsStore";

export default function ScenarioControls() {
  const [zone, setZone] = useState("A1");
  const [traffic, setTraffic] = useState(90);
  const [pollution, setPollution] = useState(70);
  const refreshLatest = useSensorsStore((s) => s.refreshLatest);

  const simulate = async () => {
    try {
      await ingestData({
        zone,
        traffic: Number(traffic),
        pollution: Number(pollution),
        timestamp: dayjs().toISOString(),
      });
      await refreshLatest();
      alert("Scenario ingested.");
    } catch (e) {
      console.error(e);
      alert("Failed to ingest scenario");
    }
  };

  const normalize = async () => {
    try {
      await ingestData({
        zone,
        traffic: 20,
        pollution: 20,
        timestamp: dayjs().toISOString(),
      });
      await refreshLatest();
      alert("Normalization ingested.");
    } catch (e) {
      console.error(e);
      alert("Failed to normalize scenario");
    }
  };

  return (
    <div>
      <h3 style={{ margin: "0 0 8px" }}>Scenario Testing</h3>
      <div style={{ display: "grid", gap: 8, gridTemplateColumns: "repeat(4, 1fr)" }}>
        <input placeholder="Zone (e.g., A1)" value={zone} onChange={(e) => setZone(e.target.value)} />
        <input type="number" min="0" max="100" placeholder="Traffic" value={traffic} onChange={(e) => setTraffic(e.target.value)} />
        <input type="number" min="0" max="100" placeholder="Pollution" value={pollution} onChange={(e) => setPollution(e.target.value)} />
        <button onClick={simulate}>Simulate Spike</button>
        <button onClick={normalize} style={{ gridColumn: "span 3" }}>Normalize</button>
      </div>
    </div>
  );
}
