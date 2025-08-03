# AI-Driven Digital Twin for Smart City Simulation

## Overview
This prototype simulates city traffic and pollution, predicts congestion, and applies simple automation (e.g., rerouting) in real time.

## Components
- **Simulator:** emits fake sensor data (traffic, pollution)
- **Backend:** collects data and exposes latest metrics
- **Frontend:** displays live values

## Getting Started (dev)
Each component runs separately.

### Simulator
cd simulator
node index.js

### Backend
cd backend
node index.js

### Frontend
cd frontend
npm run dev

## Next Steps
- Add AI prediction service
- Replace in-memory store with database
- Expand visualization (map, scenarios)