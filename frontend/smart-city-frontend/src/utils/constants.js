export const ZONES = ['A', 'B', 'C'];
export const EVENT_TYPES = { ROAD_CLOSURE: 'road_closure', POLLUTION_SPIKE: 'pollution_spike', TRAFFIC_ACCIDENT: 'traffic_accident', CONSTRUCTION: 'construction' };
export const TRAFFIC_THRESHOLDS = { LOW: 30, MODERATE: 60, HIGH: 80 };
export const POLLUTION_THRESHOLDS = { LOW: 30, MODERATE: 60, HIGH: 80 };
export const POLLING_INTERVAL = parseInt(import.meta.env.VITE_POLLING_INTERVAL) || 5000;
export const CHART_COLORS = { ZONE_A: '#3182ce', ZONE_B: '#38a169', ZONE_C: '#d69e2e', TRAFFIC: '#2563eb', POLLUTION: '#dc2626' };
