const express = require("express");
const cors = require("cors");

const app = express();
app.use(cors());
app.use(express.json());

// keep latest in memory
let latest = {};

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

  latest[data.zone] = {
    traffic: data.traffic,
    pollution: data.pollution,
    timestamp: data.timestamp
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
