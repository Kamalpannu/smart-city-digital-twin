require("dotenv").config();
const express = require("express");
const cors = require("cors");
const { PrismaClient } = require("@prisma/client");
const { Pool } = require("pg");
//const fetch = require("node-fetch"); // AI calls still use fetch

const app = express();
app.use(cors());
app.use(express.json());

const prisma = new PrismaClient();
const pgPool = new Pool({ connectionString: process.env.DATABASE_URL });

const AI_SERVICE_URL = process.env.AI_SERVICE_URL || "http://localhost:8000";
const PORT = parseInt(process.env.PORT || "4000", 10);

const zoneCoords = {
  A: { lat: 49.2827, lon: -123.1207 },
  B: { lat: 49.2463, lon: -123.1162 },
  C: { lat: 49.2260, lon: -123.0236 }
};

// ---- Random dummy generators ----
function nowSec() { return Math.floor(Date.now() / 1000); }
function randomFloat(min, max) { return parseFloat((Math.random() * (max - min) + min).toFixed(2)); }

async function getWeather() {
  return {
    temp_c: randomFloat(15, 25),
    wind_mps: randomFloat(0, 5),
    humidity: randomFloat(40, 90)
  };
}

async function getTrafficForZone(zoneId) {
  return {
    congestion_pct: Math.floor(randomFloat(0, 100)),
    avg_speed_kmh: randomFloat(10, 60),
    incidents: Math.random() < 0.2 ? 1 : 0
  };
}

// ---- Health ----
app.get("/health", (req, res) => res.status(200).send("OK"));

// ---- Call AI Service Bulk ----
async function runScenarioBulk(enrichedZones) {
  try {
    const response = await fetch(`${AI_SERVICE_URL}/scenario-bulk`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ zones: enrichedZones })
    });
    if (!response.ok) {
      console.error("AI /scenario-bulk error:", await response.text());
      return null;
    }
    return await response.json();
  } catch (e) {
    console.error("AI /scenario-bulk failed:", e.message);
    return null;
  }
}

// ---- Ingest route ----
app.post("/ingest", async (req, res) => {
  const body = req.body;
  if (!body || !Array.isArray(body.zones) || typeof body.ts !== "number") {
    return res.status(400).json({ error: "Invalid payload: { ts:number, zones:[] }" });
  }

  const timestamp = new Date(body.ts);

  // Save sensor data to DB
  for (const z of body.zones) {
    if (!z?.id || typeof z.traffic !== "number" || typeof z.pollution !== "number") continue;
    try {
      await pgPool.query(
        "INSERT INTO sensor_readings (zone, traffic, pollution, timestamp) VALUES ($1,$2,$3,$4)",
        [z.id, z.traffic, z.pollution, timestamp.toISOString()]
      );
    } catch (err) {
      console.error("DB insert error:", err);
    }
  }

  const weather = await getWeather();

  const enrichedZones = [];
  for (const z of body.zones) {
    const trafficApi = await getTrafficForZone(z.id);
    enrichedZones.push({
      id: z.id,
      traffic: z.traffic,
      pollution: z.pollution,
      event: z.event ? { type: z.event } : null,
      weather,
      traffic_api: trafficApi
    });
  }

  console.log("Enriched zones sent to AI:", enrichedZones);

  const ai = await runScenarioBulk(enrichedZones);
  if (!ai?.zones) return res.status(500).json({ error: "AI analysis failed" });

  const responseZones = enrichedZones.map((zIn, idx) => {
    const zOut = ai.zones[idx];
    return {
      id: zIn.id,
      traffic: zIn.traffic,
      pollution: zIn.pollution,
      predictedTraffic: zOut.predicted_traffic,
      rerouteSuggested: zOut.reroute_suggested,
      analysis: zOut.analysis
    };
  });

  res.json({ ts: body.ts, zones: responseZones });
});

// ---- Latest zone data ----
app.get("/latest", async (req, res) => {
  try {
    const states = await prisma.latestState.findMany();
    const result = {};
    states.forEach(s => {
      result[s.zone] = {
        traffic: s.traffic,
        pollution: s.pollution,
        timestamp: s.timestamp?.getTime() ?? null,
        predictedTraffic: s.predictedTraffic,
        rerouteSuggested: s.rerouteSuggested
      };
    });
    res.json(result);
  } catch (err) {
    console.error("Fetch latest error:", err);
    res.status(500).send({ error: "Server error" });
  }
});

// ---- Weather widget ----
app.get("/weather-widget", async (req, res) => {
  const weather = await getWeather();
  res.json({
    temperature: weather.temp_c,
    humidity: weather.humidity,
    windSpeed: weather.wind_mps,
    condition: "N/A",
    pollution: randomFloat(0, 100)
  });
});

// ---- Automation rules CRUD ----
app.get("/automation-rules", async (req, res) => {
  try {
    const rules = await prisma.automationRule.findMany();
    res.json(rules);
  } catch (e) {
    console.error("Failed to fetch automation rules:", e);
    res.status(500).json({ error: "Failed to fetch automation rules" });
  }
});

app.post("/automation-rules", async (req, res) => {
  const body = req.body;
  try {
    const newRule = await prisma.automationRule.create({
      data: { name: body.name, zone: body.zone, trafficThreshold: body.trafficThreshold, enabled: body.enabled }
    });
    res.status(201).json(newRule);
  } catch (e) {
    console.error("Failed to create automation rule:", e);
    res.status(500).json({ error: "Failed to create automation rule" });
  }
});

app.put("/automation-rules/:id", async (req, res) => {
  const id = parseInt(req.params.id, 10);
  const body = req.body;
  try {
    const updated = await prisma.automationRule.update({
      where: { id },
      data: { name: body.name, zone: body.zone, trafficThreshold: body.trafficThreshold, enabled: body.enabled }
    });
    res.json(updated);
  } catch (e) {
    console.error("Failed to update automation rule:", e);
    res.status(500).json({ error: "Failed to update automation rule" });
  }
});

app.delete("/automation-rules/:id", async (req, res) => {
  const id = parseInt(req.params.id, 10);
  try {
    await prisma.automationRule.delete({ where: { id } });
    res.status(204).send();
  } catch (e) {
    console.error("Failed to delete automation rule:", e);
    res.status(500).json({ error: "Failed to delete automation rule" });
  }
});

// ---- Single Scenario Endpoint ----
app.post("/scenario", async (req, res) => {
  const body = req.body;
  if (!body || !body.zone || typeof body.traffic !== "number" || typeof body.pollution !== "number") {
    return res.status(400).json({ error: "Invalid payload" });
  }

  const weather = await getWeather();
  const trafficApi = await getTrafficForZone(body.zone);

  const enrichedZone = {
    id: body.zone,
    traffic: body.traffic,
    pollution: body.pollution,
    event: body.event ? { type: body.event } : null,
    weather,
    traffic_api: trafficApi
  };

  try {
    const response = await fetch(`${AI_SERVICE_URL}/scenario`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        zone: enrichedZone.id,
        pollution: enrichedZone.pollution,
        traffic: enrichedZone.traffic,
        closure_event: !!enrichedZone.event
      })
    });

    if (!response.ok) {
      return res.status(500).json({ error: "AI service failed" });
    }

    const ai = await response.json();

    res.json({
      zone: {
        id: enrichedZone.id,
        traffic: enrichedZone.traffic,
        pollution: enrichedZone.pollution,
        predictedTraffic: ai.predicted_traffic,
        rerouteSuggested: ai.reroute_suggested,
        analysis: ai.analysis
      }
    });
  } catch (e) {
    console.error("Scenario AI call failed:", e.message);
    res.status(500).json({ error: "Scenario AI call failed" });
  }
});

module.exports = app;
