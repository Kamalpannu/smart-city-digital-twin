const http = require("http");

function randomWalk(value) {
  const change = (Math.random() - 0.5) * 0.1;
  let next = value + change;
  if (next < 0) next = 0;
  if (next > 1) next = 1;
  return next;
}

let traffic = 0.5;
let pollution = 0.3;

function sendData() {
  traffic = randomWalk(traffic);
  pollution = randomWalk(pollution);

  const payload = JSON.stringify({
    zone: "A",
    traffic: Number(traffic.toFixed(3)),
    pollution: Number(pollution.toFixed(3)),
    timestamp: Date.now()
  });

  const options = {
    hostname: "localhost",
    port: 4000,
    path: "/ingest",
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "Content-Length": Buffer.byteLength(payload)
    }
  };

  const req = http.request(options, res => {});
  req.on("error", e => console.error("Failed to send to backend:", e.message));
  req.write(payload);
  req.end();
}

setInterval(sendData, 2000);
console.log("Simulator running, sending data to http://localhost:4000/ingest");
