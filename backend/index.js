const express = require("express");
const cors = require("cors");

const app = express();
app.use(cors());
app.use(express.json());

// keep latest readings and recent history per zone
const latest = {};
const history = {}; // { zone: [traffic1, traffic2, ...] }

const HISTORY_LENGTH = 5; // how many past points to average
const REROUTE_THRESHOLD = 0.8; // predicted traffic above this triggers suggestion

function computePrediction(zone) {
  const h = history[zone] || [];
  if (h.length === 0) return null;
  // simple moving average of last N traffic values
  const sum = h.reduce((acc, v) => acc + v, 0);
  return sum / h.length;
}

app.post("/ingest", function (req, res) {
  const data = req.body;
  if (
    typeof data.traffic !== "number" ||
    typeof data.pollution !== "number" ||
    !data.zone
  ) {
    res.status(400).send({ error: "Invalid payload" });
    return;
  }

  // maintain history
  if (!history[data.zone]) history[data.zone] = [];
  history[data.zone].push(data.traffic);
  if (history[data.zone].length > HISTORY_LENGTH) {
    history[data.zone].shift(); // keep latest N
  }

  // compute predicted traffic
  const predicted = computePrediction(data.zone);

  // decide reroute suggestion
  const rerouteSuggested =
    predicted !== null && predicted > REROUTE_THRESHOLD;

  latest[data.zone] = {
    traffic: data.traffic,
    pollution: data.pollution,
    timestamp: data.timestamp,
    predictedTraffic: predicted,
    rerouteSuggested: rerouteSuggested,
  };

  res.status(200).send({ status: "ok" });
});

app.get("/latest", function (req, res) {
  res.send(latest);
});

const PORT = 4000;
app.listen(PORT, function () {
  console.log("Backend listening on port", PORT);
});
