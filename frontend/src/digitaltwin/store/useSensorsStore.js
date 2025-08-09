import { create } from "zustand";
import dayjs from "dayjs";
import { fetchLatest } from "../services/api";

// Poll interval from env (Vite or CRA)
const POLL_MS =
  (typeof import.meta !== "undefined" && import.meta.env && Number(import.meta.env.VITE_POLL_INTERVAL_MS)) ||
  (typeof process !== "undefined" && process.env && Number(process.env.REACT_APP_POLL_INTERVAL_MS)) ||
  5000;

export const useSensorsStore = create((set, get) => ({
  latest: [],         // latest array of zones
  history: [],        // [{ timestamp, zones: [...] }]
  loading: false,
  error: null,
  _intervalId: null,

  refreshLatest: async () => {
    try {
      set({ loading: true, error: null });
      const latest = await fetchLatest();
      const ts = latest?.[0]?.timestamp || new Date().toISOString();
      set((state) => ({
        latest,
        history: [
          ...state.history.slice(-199), // keep last 200
          { timestamp: ts, zones: latest },
        ],
        loading: false,
      }));
    } catch (err) {
      console.error("fetchLatest error", err);
      set({ error: err?.message || "Failed to fetch latest", loading: false });
    }
  },

  startPolling: () => {
    const { _intervalId, refreshLatest } = get();
    if (_intervalId) return;
    refreshLatest(); // immediate first fetch
    const id = setInterval(refreshLatest, POLL_MS);
    set({ _intervalId: id });
  },

  stopPolling: () => {
    const { _intervalId } = get();
    if (_intervalId) {
      clearInterval(_intervalId);
      set({ _intervalId: null });
    }
  },
}));
