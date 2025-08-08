require("dotenv").config();
const express = require("express");
const cors = require("cors");
const { PrismaClient } = require("@prisma/client");
const { Pool } = require("pg");
//import fetch from 'node-fetch';

const app = express();
app.use(cors());
app.use(express.json());

const prisma = new PrismaClient();
const pgPool = new Pool({ connectionString: process.env.DATABASE_URL });

const DEFAULT_REROUTE_THRESHOLD = 0.8;

// Ask AI Service for prediction
async function computePrediction(zone, pollution) {
  const response = await fetch("http://localhost:5000/predict", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ zone, pollution }),
  });

  if (!response.ok) {
    console.error("AI service error", await response.text());
    return null;
  }

  const data = await response.json();
  return data.predicted_traffic;
}

app.post("/ingest", async (req, res) => {
  const data = req.body;
  if (
    typeof data.traffic !== "number" ||
    typeof data.pollution !== "number" ||
    !data.zone
  ) {
    res.status(400).send({ error: "Invalid payload" });
    return;
  }

  try {
    // Store raw sensor data
    await pgPool.query(
      `INSERT INTO sensor_readings (zone, traffic, pollution, timestamp)
       VALUES ($1, $2, $3, $4)`,
      [data.zone, data.traffic, data.pollution, data.timestamp]
    );

    // Get AI prediction
    const predicted = await computePrediction(data.zone, data.pollution);
    const rerouteSuggested =
      predicted !== null && predicted > DEFAULT_REROUTE_THRESHOLD;

    // Update latest state
    await prisma.latestState.upsert({
      where: { zone: data.zone },
      update: {
        traffic: data.traffic,
        pollution: data.pollution,
        timestamp: data.timestamp,
        predictedTraffic: predicted,
        rerouteSuggested,
        updatedAt: new Date(),
      },
      create: {
        zone: data.zone,
        traffic: data.traffic,
        pollution: data.pollution,
        timestamp: data.timestamp,
        predictedTraffic: predicted,
        rerouteSuggested,
      },
    });

    res.status(200).send({ status: "ok" });
  } catch (err) {
    console.error("Ingest error:", err);
    res.status(500).send({ error: "Server error" });
  }
});

app.get("/latest", async (req, res) => {
  try {
    const states = await prisma.latestState.findMany();
    const result = {};
    states.forEach(s => {
      result[s.zone] = {
        traffic: s.traffic,
        pollution: s.pollution,
        timestamp: s.timestamp ? Number(s.timestamp) : null,
        predictedTraffic: s.predictedTraffic,
        rerouteSuggested: s.rerouteSuggested,
      };
    });
    res.send(result);
  } catch (err) {
    console.error("Fetch latest error:", err);
    res.status(500).send({ error: "Server error" });
  }
});

const PORT = 4000;
app.listen(PORT, () => {
  console.log("Backend listening on port", PORT);
});
