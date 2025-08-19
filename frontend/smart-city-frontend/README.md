# Smart City Simulation Frontend

A modern React dashboard for smart city simulation with real-time 3D visualization.

## Features
- 🏙️ Interactive 3D city map with Three.js
- 📊 Real-time charts with Recharts
- ⚙️ Automation rules management
- 🧪 Scenario testing with AI predictions
- 📱 Responsive Tailwind CSS design

## Quick Start
```bash
npm install
npm run dev
```

## Environment Setup
Update `.env` with your backend API URL:
```
VITE_API_BASE_URL=http://your-backend-url:3001
```

## Backend Integration
Expects these endpoints:
- GET /weather/latest
- GET /traffic/latest
- GET /automation-rules
- POST /automation-rules
- PUT /automation-rules/:id
- DELETE /automation-rules/:id
- POST /scenario-bulk

Access at: http://localhost:3000
