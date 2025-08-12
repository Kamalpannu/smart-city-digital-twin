const http = require("http");

const backendUrl = process.env.BACKEND_URL || "http://localhost:4000";
const { hostname, port } = new URL(backendUrl);
const healthPath = "/health";  // For health check
const ingestPath = "/ingest";

function randomWalk(value) {
  const change = (Math.random() - 0.5) * 0.1;
  let next = value + change;
  if (next < 0) next = 0;
  if (next > 1) next = 1;
  return next;
}

let traffic = 0.5;
let pollution = 0.3;

function waitForBackendReady(retries = 10, delay = 2000) {
  return new Promise((resolve, reject) => {
    const tryConnect = (attempt = 1) => {
      const req = http.request(
        { hostname, port, method: "GET", path: healthPath },
        (res) => {
          if (res.statusCode === 200) {
            console.log("Backend is ready.");
            resolve();
          } else {
            retryOrFail();
          }
        }
      );
      req.on("error", retryOrFail);
      req.end();

      function retryOrFail() {
        if (attempt < retries) {
          console.log(`Backend not ready, retrying (${attempt}/${retries})...`);
          setTimeout(() => tryConnect(attempt + 1), delay);
        } else {
          reject(new Error("Backend not ready after retries"));
        }
      }
    };
    tryConnect();
  });
}

function sendData() {
  traffic = randomWalk(traffic);
  pollution = randomWalk(pollution);

  const payload = JSON.stringify({
    zone: "A",
    traffic: Number(traffic.toFixed(3)),
    pollution: Number(pollution.toFixed(3)),
    timestamp: Date.now(),
  });

  const options = {
    hostname,
    port,
    path: ingestPath,
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "Content-Length": Buffer.byteLength(payload),
    },
  };

  const req = http.request(options, (res) => {
    // Optional: handle response if needed
    if (res.statusCode !== 200) {
      console.error(`Backend responded with status ${res.statusCode}`);
    }
  });

  req.on("error", (e) => console.error("Failed to send to backend:", e.message));
  req.write(payload);
  req.end();
}

console.log(`Simulator running, will send data to ${backendUrl}${ingestPath} once backend is ready.`);

waitForBackendReady()
  .then(() => {
    sendData();
    setInterval(sendData, 2000);
  })
  .catch((err) => {
    console.error(err.message);
    process.exit(1);
  });
