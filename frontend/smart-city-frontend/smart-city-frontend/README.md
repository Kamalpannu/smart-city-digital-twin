# ÌøôÔ∏è Smart City Simulation Frontend

A React-based frontend for smart city traffic and pollution monitoring with 3D visualization.

## Features

- **3D Interactive City Map** - Click zones to see details, real-time traffic visualization
- **Live Weather Dashboard** - Temperature, humidity, wind, pollution monitoring
- **Traffic Analytics** - Historical charts and trend analysis
- **Automation Rules** - Create/edit/delete traffic management rules
- **Scenario Testing** - Test different events and see AI predictions
- **Real-time Updates** - Polls backend every 10 seconds

## Tech Stack

- **React** + **Vite** - Fast development and build
- **Three.js** - 3D city visualization
- **Recharts** - Data visualization and charts
- **Tailwind CSS** - Modern styling
- **Lucide React** - Beautiful icons

## Configuration

Update the backend URL in:
- `.env` file: `VITE_API_BASE_URL`
- `src/SmartCityApp.jsx`: `API_BASE` constant

## Development

```bash
# Install dependencies
npm install

# Start development server
npm run dev

# Build for production
npm run build

# Preview production build
npm run preview
```

## Backend API Routes Expected

- `GET /weather/latest` - Weather data
- `GET /traffic/latest` - Traffic data for all zones  
- `POST /scenario-bulk` - AI scenario predictions
- `GET /automation-rules` - List automation rules
- `POST /automation-rules` - Create new rule
- `PUT /automation-rules/:id` - Update rule
- `DELETE /automation-rules/:id` - Delete rule

## Mock Data

The app includes comprehensive mock data and will fall back to it if the backend is not available, allowing for immediate development and testing.
