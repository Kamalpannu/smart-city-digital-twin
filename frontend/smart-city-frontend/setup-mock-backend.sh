# Smart City Simulation - Mock Backend Setup Script
# This script creates and starts a mock backend server for the smart city dashboard

echo "🏙️  Setting up Smart City Mock Backend Server..."

# Create backend directory
mkdir -p mock-backend
cd mock-backend

# Initialize package.json
cat > package.json << 'EOF'
{
  "name": "smart-city-mock-backend",
  "version": "1.0.0",
  "description": "Mock backend server for smart city simulation",
  "main": "server.js",
  "scripts": {
    "start": "node server.js",
    "dev": "nodemon server.js"
  },
  "dependencies": {
    "express": "^4.18.2",
    "cors": "^2.8.5"
  },
  "devDependencies": {
    "nodemon": "^3.0.1"
  }
}
EOF

# Create the mock server
cat > server.js << 'EOF'
const express = require('express');
const cors = require('cors');

const app = express();
const PORT = process.env.PORT || 8000;

// Middleware
app.use(cors());
app.use(express.json());

// Mock data generators
const generateWeatherData = () => ({
  temperature: Math.floor(Math.random() * 20) + 15, // 15-35°C
  humidity: Math.floor(Math.random() * 40) + 40,    // 40-80%
  windSpeed: Math.floor(Math.random() * 15) + 2,    // 2-17 km/h
  pollution: Math.floor(Math.random() * 80) + 20,   // 20-100 AQI
  pressure: Math.floor(Math.random() * 30) + 1010,  // 1010-1040 hPa
  timestamp: new Date().toISOString()
});

const generateTrafficData = () => {
  const zones = ['Zone A', 'Zone B', 'Zone C'];
  const traffic = {};
  
  zones.forEach(zone => {
    const trafficLevel = Math.floor(Math.random() * 100);
    const pollutionLevel = Math.floor(Math.random() * 120) + 20;
    
    let reroute = 'none';
    if (trafficLevel > 80 || pollutionLevel > 90) reroute = 'now';
    else if (trafficLevel > 60 || pollutionLevel > 70) reroute = 'consider';
    
    traffic[zone] = {
      traffic: trafficLevel,
      pollution: pollutionLevel,
      reroute
    };
  });
  
  return {
    zones: traffic,
    timestamp: new Date().toISOString()
  };
};

// Mock automation rules storage
let automationRules = [
  {
    id: 1,
    name: "High Traffic Reroute",
    zone: "Zone A",
    condition: "traffic > 80",
    action: "reroute_traffic",
    priority: "high",
    active: true,
    created: new Date().toISOString()
  },
  {
    id: 2,
    name: "Pollution Alert",
    zone: "Zone B", 
    condition: "pollution > 90",
    action: "send_alert",
    priority: "critical",
    active: true,
    created: new Date().toISOString()
  }
];

// API Routes
app.get('/weather/latest', (req, res) => {
  console.log('📡 Weather data requested');
  res.json(generateWeatherData());
});

app.get('/traffic/latest', (req, res) => {
  console.log('🚦 Traffic data requested');
  res.json(generateTrafficData());
});

app.get('/automation-rules', (req, res) => {
  console.log('⚙️  Automation rules requested');
  res.json(automationRules);
});

app.post('/automation-rules', (req, res) => {
  console.log('➕ Creating new automation rule');
  const newRule = {
    id: Date.now(),
    ...req.body,
    created: new Date().toISOString()
  };
  automationRules.push(newRule);
  res.status(201).json(newRule);
});

app.put('/automation-rules/:id', (req, res) => {
  console.log(`✏️  Updating automation rule ${req.params.id}`);
  const ruleIndex = automationRules.findIndex(r => r.id == req.params.id);
  if (ruleIndex !== -1) {
    automationRules[ruleIndex] = { ...automationRules[ruleIndex], ...req.body };
    res.json(automationRules[ruleIndex]);
  } else {
    res.status(404).json({ error: 'Rule not found' });
  }
});

app.delete('/automation-rules/:id', (req, res) => {
  console.log(`🗑️  Deleting automation rule ${req.params.id}`);
  const ruleIndex = automationRules.findIndex(r => r.id == req.params.id);
  if (ruleIndex !== -1) {
    automationRules.splice(ruleIndex, 1);
    res.status(204).send();
  } else {
    res.status(404).json({ error: 'Rule not found' });
  }
});

app.post('/scenario-bulk', (req, res) => {
  console.log('🧪 Scenario testing requested:', req.body);
  const { zone, event, duration, intensity } = req.body;
  
  // Mock AI prediction response
  const prediction = {
    scenario: { zone, event, duration, intensity },
    prediction: `AI Analysis: ${event} in ${zone} for ${duration} minutes will cause ${intensity === 'high' ? 'significant' : 'moderate'} traffic disruption. Recommended actions: ${event === 'road_closure' ? 'Activate alternate routes, increase public transport frequency' : 'Deploy air quality monitors, issue health advisories'}.`,
    impact: {
      traffic_change: event === 'road_closure' ? Math.floor(Math.random() * 40) + 30 : Math.floor(Math.random() * 20) + 10,
      estimated_delay: Math.floor(Math.random() * 15) + 5,
      affected_routes: Math.floor(Math.random() * 8) + 3,
      reroute_suggestions: [
        `Route via ${zone === 'Zone A' ? 'Zone B' : 'Zone A'} - Est. +${Math.floor(Math.random() * 10) + 5} min`,
        `Alternative path through ${zone === 'Zone C' ? 'Zone A' : 'Zone C'} - Est. +${Math.floor(Math.random() * 8) + 3} min`
      ]
    },
    timestamp: new Date().toISOString()
  };
  
  res.json(prediction);
});

// Health check
app.get('/health', (req, res) => {
  res.json({ status: 'OK', timestamp: new Date().toISOString() });
});

// Start server
app.listen(PORT, () => {
  console.log(`🚀 Smart City Mock Backend running on http://localhost:${PORT}`);
  console.log(`📊 Available endpoints:`);
  console.log(`   GET  /weather/latest`);
  console.log(`   GET  /traffic/latest`);
  console.log(`   GET  /automation-rules`);
  console.log(`   POST /automation-rules`);
  console.log(`   PUT  /automation-rules/:id`);
  console.log(`   DELETE /automation-rules/:id`);
  console.log(`   POST /scenario-bulk`);
  console.log(`   GET  /health`);
});
EOF

# Install dependencies
echo "📦 Installing dependencies..."
npm install

echo "✅ Mock backend setup complete!"
echo ""
echo "🚀 To start the server:"
echo "   cd mock-backend"
echo "   npm start"
echo ""
echo "🔧 To connect your frontend:"
echo "   Set NEXT_PUBLIC_API_URL=http://localhost:8000"
echo ""
echo "📡 The server will provide realistic mock data for:"
echo "   • Weather updates"
echo "   • Traffic monitoring"
echo "   • Automation rules management"
echo "   • Scenario testing with AI predictions"
