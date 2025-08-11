require("dotenv").config();
const express = require("express");
const cors = require("cors");
const { PrismaClient } = require("@prisma/client");
const { Pool } = require("pg");
//const fetch = require("node-fetch"); // make sure node-fetch is installed

const app = express();
app.use(cors());
app.use(express.json());

const prisma = new PrismaClient();
const pgPool = new Pool({ connectionString: process.env.DATABASE_URL });

const DEFAULT_REROUTE_THRESHOLD = 0.8;

// AI Service prediction call
async function computePrediction(zone, pollution) {
  try {
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
  } catch (error) {
    console.error("Failed to fetch prediction:", error);
    return null;
  }
}

// Ingest sensor data
app.post("/ingest", async (req, res) => {
  const data = req.body;

  if (
    typeof data.traffic !== "number" ||
    typeof data.pollution !== "number" ||
    !data.zone ||
    !data.timestamp
  ) {
    return res.status(400).send({ error: "Invalid payload" });
  }

  const timestampMillis = Number(data.timestamp);
  const timestampDate = isNaN(timestampMillis) ? new Date() : new Date(timestampMillis);

  try {
    await pgPool.query(
      `INSERT INTO sensor_readings (zone, traffic, pollution, timestamp)
       VALUES ($1, $2, $3, $4)`,
      [data.zone, data.traffic, data.pollution, timestampDate.toISOString()]
    );

    const predicted = await computePrediction(data.zone, data.pollution);
    const rerouteSuggested = predicted !== null && predicted > DEFAULT_REROUTE_THRESHOLD;

    await prisma.latestState.upsert({
      where: { zone: data.zone },
      update: {
        traffic: data.traffic,
        pollution: data.pollution,
        timestamp: timestampDate,
        predictedTraffic: predicted,
        rerouteSuggested,
        updatedAt: new Date(),
      },
      create: {
        zone: data.zone,
        traffic: data.traffic,
        pollution: data.pollution,
        timestamp: timestampDate,
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

// Fetch latest states
app.get("/latest", async (req, res) => {
  try {
    const states = await prisma.latestState.findMany();
    const result = {};
    states.forEach((s) => {
      result[s.zone] = {
        traffic: s.traffic,
        pollution: s.pollution,
        timestamp: s.timestamp ? s.timestamp.getTime() : null,
        predictedTraffic: s.predictedTraffic,
        rerouteSuggested: s.rerouteSuggested,
      };
    });
    res.json(result);
  } catch (err) {
    console.error("Fetch latest error:", err);
    res.status(500).send({ error: "Server error" });
  }
});

// === Automation Rules CRUD routes ===

// Get all automation rules
app.get("/automation-rules", async (req, res) => {
  try {
    const rules = await prisma.automationRule.findMany();
    res.json(rules);
  } catch (error) {
    console.error("Failed to fetch automation rules:", error);
    res.status(500).json({ error: "Failed to fetch automation rules" });
  }
});

// Create a new automation rule
app.post("/automation-rules", async (req, res) => {
  const { name, zone, trafficThreshold, enabled } = req.body;
  try {
    const newRule = await prisma.automationRule.create({
      data: { name, zone, trafficThreshold, enabled },
    });
    res.status(201).json(newRule);
  } catch (error) {
    console.error("Failed to create automation rule:", error);
    res.status(500).json({ error: "Failed to create automation rule" });
  }
});

// Update an existing automation rule
app.put("/automation-rules/:id", async (req, res) => {
  const id = parseInt(req.params.id);
  const { name, zone, trafficThreshold, enabled } = req.body;
  try {
    const updatedRule = await prisma.automationRule.update({
      where: { id },
      data: { name, zone, trafficThreshold, enabled },
    });
    res.json(updatedRule);
  } catch (error) {
    console.error("Failed to update automation rule:", error);
    res.status(500).json({ error: "Failed to update automation rule" });
  }
});

// Delete an automation rule
app.delete("/automation-rules/:id", async (req, res) => {
  const id = parseInt(req.params.id);
  try {
    await prisma.automationRule.delete({ where: { id } });
    res.status(204).send();
  } catch (error) {
    console.error("Failed to delete automation rule:", error);
    res.status(500).json({ error: "Failed to delete automation rule" });
  }
});

// Start server
const PORT = 4000;
app.listen(PORT, () => {
  console.log(`Backend listening on port ${PORT}`);
});
