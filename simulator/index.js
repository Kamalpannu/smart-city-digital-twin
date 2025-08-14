const http = require("http");

const backendUrl = process.env.BACKEND_URL || "http://localhost:4000";
const { hostname, port } = new URL(backendUrl);
const healthPath = "/health";
const ingestPath = "/ingest";

function randomWalk(v) {
  var change = (Math.random() - 0.5) * 0.1;
  var next = v + change;
  if (next < 0) next = 0;
  if (next > 1) next = 1;
  return next;
}

var zonesState = {
  A: { traffic: 0.5, pollution: 0.3, event: null },
  B: { traffic: 0.4, pollution: 0.25, event: null },
  C: { traffic: 0.3, pollution: 0.6, event: null }
};

function maybeTriggerEvents() {
  if (!zonesState.B.event && Math.random() < 0.05) {
    zonesState.B.event = { type: "accident", severity: 0.8, ttl_min: 20, startedAt: Date.now() };
  }
  // Pollution event in C (longer)
  if (!zonesState.C.event && Math.random() < 0.05) {
    zonesState.C.event = { type: "pollution", severity: 0.7, ttl_min: 60, startedAt: Date.now() };
  }

  // Decay TTL
  ["B", "C"].forEach(function (id) {
    var ev = zonesState[id].event;
    if (ev) {
      var elapsedMin = (Date.now() - ev.startedAt) / 60000;
      if (elapsedMin >= ev.ttl_min) {
        zonesState[id].event = null;
      }
    }
  });
}

function applyEventEffects() {
  // Accident in B → traffic up
  if (zonesState.B.event && zonesState.B.event.type === "accident") {
    zonesState.B.traffic = Math.min(1, zonesState.B.traffic * (1.5 + zonesState.B.event.severity * 0.5));
  }
  // Pollution in C → traffic down, pollution up
  if (zonesState.C.event && zonesState.C.event.type === "pollution") {
    zonesState.C.traffic = Math.max(0, zonesState.C.traffic * (0.5 - zonesState.C.event.severity * 0.2));
    zonesState.C.pollution = Math.min(1, zonesState.C.pollution * (1.4 + zonesState.C.event.severity * 0.4));
  }
}

function tickZones() {
  Object.keys(zonesState).forEach(function (id) {
    zonesState[id].traffic = randomWalk(zonesState[id].traffic);
    zonesState[id].pollution = randomWalk(zonesState[id].pollution);
  });
  maybeTriggerEvents();
  applyEventEffects();
}

function payloadFromState() {
  return {
    ts: Date.now(),
    zones: ["A", "B", "C"].map(function (id) {
      var z = zonesState[id];
      return {
        id: id,
        traffic: Number(z.traffic.toFixed(3)),
        pollution: Number(z.pollution.toFixed(3)),
        event: z.event ? {
          type: z.event.type,
          severity: z.event.severity,
          ttl_min: z.event.ttl_min
        } : null
      };
    })
  };
}

function sendData() {
  tickZones();

  var body = JSON.stringify(payloadFromState());

  var options = {
    hostname: hostname,
    port: port,
    path: ingestPath,
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "Content-Length": Buffer.byteLength(body)
    }
  };

  var req = http.request(options, function (res) {
    if (res.statusCode !== 200) {
      console.error("Backend responded with status", res.statusCode);
    }
  });

  req.on("error", function (e) { console.error("Failed to send to backend:", e.message); });
  req.write(body);
  req.end();
}

function waitForBackendReady(retries, delay) {
  retries = retries || 20;
  delay = delay || 2000;
  return new Promise(function (resolve, reject) {
    function tryOnce(attempt) {
      attempt = attempt || 1;
      var req = http.request(
        { hostname: hostname, port: port, method: "GET", path: healthPath },
        function (res) {
          if (res.statusCode === 200) return resolve();
          retry();
        }
      );
      req.on("error", retry);
      req.end();
      function retry() {
        if (attempt < retries) {
          console.log("Backend not ready, retrying (" + attempt + "/" + retries + ")...");
          setTimeout(function () { tryOnce(attempt + 1); }, delay);
        } else {
          reject(new Error("Backend not ready after retries"));
        }
      }
    }
    tryOnce();
  });
}

console.log("Simulator will send to " + backendUrl + ingestPath);

waitForBackendReady()
  .then(function () {
    sendData();
    setInterval(sendData, 2000);
  })
  .catch(function (err) {
    console.error(err.message);
    process.exit(1);
  });
