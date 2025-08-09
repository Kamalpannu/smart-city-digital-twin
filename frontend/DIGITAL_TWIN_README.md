# AI-Driven Digital Twin Frontend (In-Place Upgrade)

This project was upgraded with:
- Three.js via @react-three/fiber for 3D city visualization
- Recharts for live charts
- Axios for backend API integration
- Zustand for state + polling

.env.example contains both Vite and CRA variables. Copy to `.env` and set your API base URL.

Scripts:
- Start: use your existing `npm run dev` (Vite) or `npm start` (CRA)
- Build: `npm run build`

Main entry:
- DigitalTwinApp.jsx (composed UI)
- If you want to mount it under routes, import and use `<DigitalTwinApp />` in your router.
