import React, { useEffect } from "react";
import ThreeCity from "./digitaltwin/components/ThreeCity";
import TrafficChart from "./digitaltwin/components/charts/TrafficChart";
import PollutionChart from "./digitaltwin/components/charts/PollutionChart";
import EnergyChart from "./digitaltwin/components/charts/EnergyChart";
import AutomationRules from "./digitaltwin/components/AutomationRules";
import ScenarioControls from "./digitaltwin/components/ScenarioControls";
import { useSensorsStore } from "./digitaltwin/store/useSensorsStore";
import "./styles/digitaltwin.css";

export default function DigitalTwinApp() {
  const startPolling = useSensorsStore((s) => s.startPolling);
  const stopPolling = useSensorsStore((s) => s.stopPolling);

  useEffect(() => {
    startPolling();
    return () => stopPolling();
  }, [startPolling, stopPolling]);

  return (
    <div className="dtw-container">
      <header className="dtw-header">
        <h1>AI-Driven Digital Twin for Smart City</h1>
        <p>Live traffic, pollution, and energy insights with 3D city visualization.</p>
      </header>

      <main className="dtw-main">
        <section className="dtw-hero">
          <ThreeCity />
        </section>

        <section className="dtw-charts">
          <TrafficChart />
          <PollutionChart />
          <EnergyChart />
        </section>

        <section className="dtw-side">
          <AutomationRules />
          <div style={{ height: 16 }} />
          <ScenarioControls />
        </section>
      </main>

      <footer className="dtw-footer">
        <small>&copy; {new Date().getFullYear()} Smart City Digital Twin</small>
      </footer>
    </div>
  );
}
