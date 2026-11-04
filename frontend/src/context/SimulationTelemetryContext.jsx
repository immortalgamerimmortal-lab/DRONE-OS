import { createContext, useCallback, useContext, useMemo, useState } from "react";

const initialTelemetry = {
  x: 0,
  y: 0.65,
  z: 0,
  altitude: 0.65,
  yaw: 0,
  pitch: 0,
  roll: 0,
  verticalSpeed: 0,
  speed: 0,
  batteryPercent: 100,
  landed: true
};

const SimulationTelemetryContext = createContext(null);

export function SimulationTelemetryProvider({ children }) {
  const [telemetry, setTelemetry] = useState(initialTelemetry);
  const [history, setHistory] = useState([]);
  const [hasSample, setHasSample] = useState(false);

  const publishTelemetry = useCallback((sample) => {
    setTelemetry(sample);
    setHasSample(true);
    setHistory((previous) => [...previous, sample].slice(-60));
  }, []);

  const value = useMemo(() => ({
    telemetry,
    history,
    hasSample,
    publishTelemetry
  }), [telemetry, history, hasSample, publishTelemetry]);

  return (
    <SimulationTelemetryContext.Provider value={value}>
      {children}
    </SimulationTelemetryContext.Provider>
  );
}

export function useSimulationTelemetry() {
  const context = useContext(SimulationTelemetryContext);
  if (!context) {
    throw new Error("useSimulationTelemetry must be used within SimulationTelemetryProvider.");
  }
  return context;
}
