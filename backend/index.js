require("dotenv").config();
const express = require("express");
const cors = require("cors");
const { PrismaClient } = require("@prisma/client");
const { Pool } = require("pg");
const fetch = require("node-fetch");

const app = express();
app.use(cors());
app.use(express.json());

const prisma = new PrismaClient();
const pgPool = new Pool({
  connectionString: process.env.DATABASE_URL,
});

// Constants
const HISTORY_WINDOW = 5;
const DEFAULT_REROUTE_THRESHOLD = 0.8;

// Prediction based on moving average of last N traffic readings (using time dimension)
async function computePrediction(zone) {
  // Get recent traffic from DB (same as before)
  const res = await pgPool.query(
    `
    SELECT traffic FROM sensor_readings
    WHERE zone = $1
    ORDER BY time DESC
    LIMIT $2
    `,
    [zone, HISTORY_WINDOW]
  );

  const recentTraffic = res.rows.map(r => r.traffic);

  const response = await fetch("http://localhost:5000/predict", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      zone,
      recent_traffic: recentTraffic,
    }),
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
    await pgPool.query(
      `
      INSERT INTO sensor_readings (zone, traffic, pollution, timestamp)
      VALUES ($1, $2, $3, $4)
      `,
      [data.zone, data.traffic, data.pollution, data.timestamp]
    );
    const predicted = await computePrediction(data.zone);
    const rerouteSuggested =
      predicted !== null && predicted > DEFAULT_REROUTE_THRESHOLD;

    await prisma.latestState.upsert({
      where: { zone: data.zone },
      update: {
        traffic: data.traffic,
        pollution: data.pollution,
        timestamp: data.timestamp,
        predictedTraffic: predicted,
        rerouteSuggested: rerouteSuggested,
        updatedAt: new Date(),
      },
      create: {
        zone: data.zone,
        traffic: data.traffic,
        pollution: data.pollution,
        timestamp: data.timestamp,
        predictedTraffic: predicted,
        rerouteSuggested: rerouteSuggested,
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
    states.forEach((s) => {
      result[s.zone] = {
        traffic: s.traffic,
        pollution: s.pollution,
        // convert BigInt to number for JSON
        timestamp:
          s.timestamp !== null && s.timestamp !== undefined
            ? Number(s.timestamp)
            : null,
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

// Get all automation rules
app.get("/automation-rules", async (req, res) => {
  try {
    const rules = await prisma.automationRule.findMany();
    res.json(rules);
  } catch (err) {
    console.error("Fetch automation rules error:", err);
    res.status(500).send({ error: "Server error" });
  }
});

// Create a new automation rule
app.post("/automation-rules", async (req, res) => {
  const { name, zone, trafficThreshold, enabled } = req.body;

  if (!name) {
    res.status(400).send({ error: "Name is required" });
    return;
  }

  try {
    const newRule = await prisma.automationRule.create({
      data: {
        name,
        zone,
        trafficThreshold,
        enabled: enabled === undefined ? true : enabled,
      },
    });
    res.status(201).json(newRule);
  } catch (err) {
    console.error("Create automation rule error:", err);
    res.status(500).send({ error: "Server error" });
  }
});

// Update an existing automation rule
app.put("/automation-rules/:id", async (req, res) => {
  const id = Number(req.params.id);
  const { name, zone, trafficThreshold, enabled } = req.body;

  try {
    const updatedRule = await prisma.automationRule.update({
      where: { id },
      data: { name, zone, trafficThreshold, enabled },
    });
    res.json(updatedRule);
  } catch (err) {
    console.error("Update automation rule error:", err);
    res.status(500).send({ error: "Server error" });
  }
});

// Delete an automation rule
app.delete("/automation-rules/:id", async (req, res) => {
  const id = Number(req.params.id);

  try {
    await prisma.automationRule.delete({ where: { id } });
    res.status(204).send();
  } catch (err) {
    console.error("Delete automation rule error:", err);
    res.status(500).send({ error: "Server error" });
  }
});


const PORT = 4000;
app.listen(PORT, () => {
  console.log("Backend listening on port", PORT);
});
