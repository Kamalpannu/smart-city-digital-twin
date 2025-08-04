require("dotenv").config();
const express = require("express");
const cors = require("cors");
const { PrismaClient } = require("@prisma/client");
const { Pool } = require("pg");

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
  const res = await pgPool.query(
    `
    SELECT traffic FROM sensor_readings
    WHERE zone = $1
    ORDER BY time DESC
    LIMIT $2
    `,
    [zone, HISTORY_WINDOW]
  );
  if (res.rows.length === 0) return null;
  const sum = res.rows.reduce((acc, row) => acc + row.traffic, 0);
  return sum / res.rows.length;
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
    // 1. Persist raw time-series reading; created_at has default, time has default
    await pgPool.query(
      `
      INSERT INTO sensor_readings (zone, traffic, pollution, timestamp)
      VALUES ($1, $2, $3, $4)
      `,
      [data.zone, data.traffic, data.pollution, data.timestamp]
    );

    // 2. Compute prediction (moving average)
    const predicted = await computePrediction(data.zone);

    // 3. Decide reroute suggestion
    const rerouteSuggested =
      predicted !== null && predicted > DEFAULT_REROUTE_THRESHOLD;

    // 4. Upsert snapshot into latest_state
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

const PORT = 4000;
app.listen(PORT, () => {
  console.log("Backend listening on port", PORT);
});
