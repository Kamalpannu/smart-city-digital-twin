require("dotenv").config();
const express = require("express");
const cors = require("cors");
const { PrismaClient } = require("@prisma/client");
const { Pool } = require("pg");

const app = express();
app.use(cors());
app.use(express.json());

const prisma = new PrismaClient();
const pgPool = new (require("pg").Pool)({ connectionString: process.env.DATABASE_URL });

const AI_SERVICE_URL = process.env.AI_SERVICE_URL || "http://localhost:8000";
const PORT = parseInt(process.env.PORT || "4000", 10);

const zoneCoords = {
  A: { lat: 49.2827, lon: -123.1207 },
  B: { lat: 49.2463, lon: -123.1162 },
  C: { lat: 49.2260, lon: -123.0236 }
};

// ---- Weather cache ----
var _weatherCache = { at: 0, data: null };
function nowSec() { return Math.floor(Date.now() / 1000); }

async function getWeather() {
  var ttl = 300;
  if (_weatherCache.data && nowSec() - _weatherCache.at <= ttl) return _weatherCache.data;

  var url = "https://api.openweathermap.org/data/2.5/weather"
    + "?lat=" + zoneCoords.A.lat
    + "&lon=" + zoneCoords.A.lon
    + "&appid=" + process.env.OWM_API_KEY
    + "&units=metric";

  try {
    var res = await fetch(url);
    if (!res.ok) throw new Error("OWM: " + res.status);
    var j = await res.json();
    var data = {
      temp_c: j && j.main ? j.main.temp : null,
      wind_mps: j && j.wind ? j.wind.speed : null,
      humidity: j && j.main ? j.main.humidity : null
    };
    _weatherCache = { at: nowSec(), data: data };
    return data;
  } catch (e) {
    console.error("Weather fetch failed:", e.message);
    return { temp_c: null, wind_mps: null, humidity: null };
  }
}

var _trafficCache = {};
function tKey(zoneId) { return "z_" + zoneId; }

async function getTrafficForZone(zoneId) {
  var k = tKey(zoneId);
  var hit = _trafficCache[k];
  if (hit && nowSec() - hit.at <= 60) return hit.data;

  var c = zoneCoords[zoneId] || zoneCoords.A;
  var url = "https://api.tomtom.com/traffic/services/4/flowSegmentData/relative0/10/json"
    + "?point=" + c.lat + "%2C" + c.lon + "&unit=KMPH&key=" + process.env.TRAFFIC_API_KEY;

  try {
    var res = await fetch(url);
    if (!res.ok) throw new Error("TomTom: " + res.status);
    var j = await res.json();
    var speed = j && j.flowSegmentData ? j.flowSegmentData.currentSpeed : null;
    var free = j && j.flowSegmentData ? j.flowSegmentData.freeFlowSpeed : null;
    var congestion = (speed != null && free != null && free > 0)
      ? Math.max(0, Math.min(100, Math.round((1 - (speed / free)) * 100)))
      : null;
    var data = { congestion_pct: congestion, avg_speed_kmh: speed, incidents: 0 };
    _trafficCache[k] = { at: nowSec(), data: data };
    return data;
  } catch (e) {
    console.error("Traffic fetch failed (" + zoneId + "):", e.message);
    return { congestion_pct: null, avg_speed_kmh: null, incidents: 0 };
  }
}

// ---- Health ----
app.get("/health", function (req, res) {
  res.status(200).send("OK");
});

// ---- Compute prediction via AI service (single) – kept for backward compatibility ----
async function computePrediction(zone, pollution) {
  try {
    var response = await fetch(AI_SERVICE_URL + "/predict", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ zone: zone, pollution: pollution })
    });
    if (!response.ok) {
      console.error("AI /predict error:", await response.text());
      return null;
    }
    var data = await response.json();
    return data.predicted_traffic;
  } catch (e) {
    console.error("AI /predict failed:", e.message);
    return null;
  }
}

// ---- New: bulk scenario call with enrichment ----
async function runScenarioBulk(enrichedZones) {
  try {
    var response = await fetch(AI_SERVICE_URL + "/scenario-bulk", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ zones: enrichedZones })
    });
    if (!response.ok) {
      console.error("AI /scenario-bulk error:", await response.text());
      return null;
    }
    var data = await response.json();
    return data;
  } catch (e) {
    console.error("AI /scenario-bulk failed:", e.message);
    return null;
  }
}

app.post("/ingest", async function (req, res) {
  var body = req.body;
  if (!body || !Array.isArray(body.zones) || typeof body.ts !== "number") {
    return res.status(400).json({ error: "Invalid payload: { ts:number, zones:[] }" });
  }

  try {
    var timestamp = new Date(body.ts);
    for (var i = 0; i < body.zones.length; i++) {
      var z = body.zones[i];
      if (!z || typeof z.id !== "string" || typeof z.traffic !== "number" || typeof z.pollution !== "number") {
        continue;
      }
      await pgPool.query(
        "INSERT INTO sensor_readings (zone, traffic, pollution, timestamp) VALUES ($1,$2,$3,$4)",
        [z.id, z.traffic, z.pollution, timestamp.toISOString()]
      );
    }
  } catch (err) {
    console.error("DB insert error:", err);
  }

  var weather = await getWeather();
  var enrichedZones = [];
  for (var j = 0; j < body.zones.length; j++) {
    var zi = body.zones[j];
    var trafficApi = await getTrafficForZone(zi.id);
    enrichedZones.push({
      id: zi.id,
      traffic: zi.traffic,
      pollution: zi.pollution,
      event: zi.event || null,
      weather: weather,
      traffic_api: trafficApi
    });
  }

  console.log("Enriched zones sent to AI:", enrichedZones);



  var ai = await runScenarioBulk(enrichedZones);
  if (!ai || !Array.isArray(ai.zones)) {
    return res.status(500).json({ error: "AI analysis failed" });
  }

  try {
    for (var k = 0; k < enrichedZones.length; k++) {
      var zIn = enrichedZones[k];
      var zOut = ai.zones[k];

      var rule = await prisma.automationRule.findFirst({
        where: { zone: zIn.id, enabled: true },
        orderBy: { id: "desc" }
      });
      var threshold = (rule && rule.trafficThreshold != null) ? rule.trafficThreshold : 0.8;

      var rerouteSuggested = zOut && typeof zOut.predicted_traffic === "number" ? (zOut.predicted_traffic > threshold) : false;

      await prisma.latestState.upsert({
        where: { zone: zIn.id },
        update: {
          traffic: zIn.traffic,
          pollution: zIn.pollution,
          timestamp: new Date(body.ts),
          predictedTraffic: zOut ? zOut.predicted_traffic : null,
          rerouteSuggested: rerouteSuggested,
          updatedAt: new Date()
        },
        create: {
          zone: zIn.id,
          traffic: zIn.traffic,
          pollution: zIn.pollution,
          timestamp: new Date(body.ts),
          predictedTraffic: zOut ? zOut.predicted_traffic : null,
          rerouteSuggested: rerouteSuggested
        }
      });
    }
  } catch (e) {
    console.error("latestState upsert error:", e);

  }

  res.json({
    ts: body.ts,
    zones: ai.zones // [{predicted_traffic, reroute_suggested, analysis}]
  });
});

// ---- Read latest per zone ----
app.get("/latest", async function (req, res) {
  try {
    var states = await prisma.latestState.findMany();
    var result = {};
    states.forEach(function (s) {
      result[s.zone] = {
        traffic: s.traffic,
        pollution: s.pollution,
        timestamp: s.timestamp ? s.timestamp.getTime() : null,
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

app.get("/weather-widget", async (req, res) => {
  const weather = await getWeather();
  res.json({
    temperature: weather.temp_c,
    humidity: weather.humidity,
    windSpeed: weather.wind_mps,
    condition: "N/A",
    pollution: 0 
  });
});


// ---- Automation rules CRUD (unchanged) ----
app.get("/automation-rules", async function (req, res) {
  try {
    var rules = await prisma.automationRule.findMany();
    res.json(rules);
  } catch (e) {
    console.error("Failed to fetch automation rules:", e);
    res.status(500).json({ error: "Failed to fetch automation rules" });
  }
});

app.post("/automation-rules", async function (req, res) {
  var body = req.body;
  try {
    var newRule = await prisma.automationRule.create({
      data: { name: body.name, zone: body.zone, trafficThreshold: body.trafficThreshold, enabled: body.enabled }
    });
    res.status(201).json(newRule);
  } catch (e) {
    console.error("Failed to create automation rule:", e);
    res.status(500).json({ error: "Failed to create automation rule" });
  }
});

app.put("/automation-rules/:id", async function (req, res) {
  var id = parseInt(req.params.id, 10);
  var body = req.body;
  try {
    var updated = await prisma.automationRule.update({
      where: { id: id },
      data: { name: body.name, zone: body.zone, trafficThreshold: body.trafficThreshold, enabled: body.enabled }
    });
    res.json(updated);
  } catch (e) {
    console.error("Failed to update automation rule:", e);
    res.status(500).json({ error: "Failed to update automation rule" });
  }
});

app.delete("/automation-rules/:id", async function (req, res) {
  var id = parseInt(req.params.id, 10);
  try {
    await prisma.automationRule.delete({ where: { id: id } });
    res.status(204).send();
  } catch (e) {
    console.error("Failed to delete automation rule:", e);
    res.status(500).json({ error: "Failed to delete automation rule" });
  }
});


module.exports = app;
