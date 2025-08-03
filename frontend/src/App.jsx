import { useEffect, useState } from "react";

function App() {
  const [data, setData] = useState({});

  function fetchLatest() {
    fetch("http://localhost:4000/latest")
      .then((res) => res.json())
      .then((json) => {
        setData(json);
      })
      .catch((err) => {
        console.error("Failed to fetch:", err);
      });
  }

  useEffect(() => {
    fetchLatest();
    const interval = setInterval(fetchLatest, 1000);
    return () => {
      clearInterval(interval);
    };
  }, []);

  const zoneA = data.A || {};

  const trafficPct =
    zoneA.traffic !== undefined
      ? Math.round(zoneA.traffic * 100) + "%"
      : "loading...";

  const pollutionPct =
    zoneA.pollution !== undefined
      ? Math.round(zoneA.pollution * 100) + "%"
      : "loading...";

  const predictedPct =
    zoneA.predictedTraffic !== null && zoneA.predictedTraffic !== undefined
      ? Math.round(zoneA.predictedTraffic * 100) + "%"
      : "—";

  return (
    <div style={{ padding: "2rem", fontFamily: "sans-serif" }}>
      <h1>Smart City Twin (MVP)</h1>
      <div
        style={{
          border: "1px solid #ccc",
          padding: "1rem",
          borderRadius: "8px",
          maxWidth: "400px",
        }}
      >
        <h2>Zone A</h2>
        <p>Traffic: {trafficPct}</p>
        <p>Pollution: {pollutionPct}</p>
        <p>Predicted Traffic: {predictedPct}</p>
        <p>
          Last update:{" "}
          {zoneA.timestamp
            ? new Date(zoneA.timestamp).toLocaleTimeString("en-CA")
            : "—"}
        </p>
        {zoneA.rerouteSuggested && (
          <div
            style={{
              marginTop: "10px",
              padding: "8px",
              background: "#ffe3b8",
              border: "1px solid #ffa500",
              borderRadius: "4px",
            }}
          >
            ⚠️ <strong>Reroute Suggested:</strong> Predicted congestion is
            high.
          </div>
        )}
      </div>
    </div>
  );
}

export default App;
