import { useEffect, useState } from "react";

function App() {
  const [data, setData] = useState({});

  function fetchLatest() {
    fetch("http://localhost:4000/latest")
      .then(function (res) {
        return res.json();
      })
      .then(function (json) {
        setData(json);
      })
      .catch(function (err) {
        console.error("Failed to fetch:", err);
      });
  }

  useEffect(function () {
    fetchLatest();
    const interval = setInterval(fetchLatest, 1000);
    return function () {
      clearInterval(interval);
    };
  }, []);

  return (
    <div style={{ padding: "2rem", fontFamily: "sans-serif" }}>
      <h1>Smart City Twin (MVP)</h1>
      <div>
        <h2>Zone A</h2>
        <p>
          Traffic:{" "}
          {data.A ? Math.round(data.A.traffic * 100) + "%" : "loading..."}
        </p>
        <p>
          Pollution:{" "}
          {data.A ? Math.round(data.A.pollution * 100) + "%" : "loading..."}
        </p>
        <p>
          Last update:{" "}
          {data.A
            ? new Date(data.A.timestamp).toLocaleTimeString("en-CA")
            : "—"}
        </p>
      </div>
    </div>
  );
}

export default App;
