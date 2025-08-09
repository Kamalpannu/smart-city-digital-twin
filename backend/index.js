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

// Ask AI Service for prediction
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

app.post("/ingest", async (req, res) => {
  const data = req.body;

  // Basic validation
  if (
    typeof data.traffic !== "number" ||
    typeof data.pollution !== "number" ||
    !data.zone ||
    !data.timestamp
  ) {
    res.status(400).send({ error: "Invalid payload" });
    return;
  }

  // Convert timestamp to Date object (handle if timestamp is string or number)
  const timestampMillis = Number(data.timestamp);
  const timestampDate = isNaN(timestampMillis) ? new Date() : new Date(timestampMillis);

  try {
    // Insert raw sensor reading into Postgres
    await pgPool.query(
      `INSERT INTO sensor_readings (zone, traffic, pollution, timestamp)
       VALUES ($1, $2, $3, $4)`,
      [data.zone, data.traffic, data.pollution, timestampDate.toISOString()]
    );

    // Get prediction from AI service
    const predicted = await computePrediction(data.zone, data.pollution);
    const rerouteSuggested =
      predicted !== null && predicted > DEFAULT_REROUTE_THRESHOLD;

    // Upsert latest state using Prisma
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
