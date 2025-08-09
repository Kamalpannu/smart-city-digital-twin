// Centralized API client with env fallbacks for Vite and CRA
import axios from "axios";

const API_BASE = import.meta.env.VITE_API_BASE_URL || "http://localhost:4000";

export const api = axios.create({
  baseURL: API_BASE,
  timeout: 10000,
});
console.log("✅ API base URL:", API_BASE);
// Backend API wrappers (per your contract)
export async function fetchLatest() {
  const { data } = await api.get("/latest");
  return data; // Expecting array of zones with traffic, pollution, timestamp, predictedTraffic, rerouteSuggested
}

export async function fetchRules() {
  const { data } = await api.get("/automation-rules");
  return data; // Array of rules
}

export async function createRule(payload) {
  const { data } = await api.post("/automation-rules", payload);
  return data;
}

export async function updateRule(id, payload) {
  const { data } = await api.put(`/automation-rules/${id}`, payload);
  return data;
}

export async function deleteRule(id) {
  const { data } = await api.delete(`/automation-rules/${id}`);
  return data;
}

export async function ingestData(payload) {
  const { data } = await api.post("/ingest", payload);
  return data;
}
