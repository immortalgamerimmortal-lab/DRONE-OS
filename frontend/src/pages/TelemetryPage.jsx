import { Activity, BatteryCharging, Compass, Navigation, Wind } from "lucide-react";
import { useSimulationTelemetry } from "../context/SimulationTelemetryContext.jsx";
import "./TelemetryPage.css";

function makePolyline(samples, key, width = 240, height = 68) {
  if (samples.length < 2) return "";
  const values = samples.map((sample) => sample[key]);
  const minimum = Math.min(...values);
  const range = Math.max(Math.max(...values) - minimum, 0.1);
  return values.map((value, index) => {
    const x = (index / (values.length - 1)) * width;
    const y = height - ((value - minimum) / range) * (height - 8) - 4;
    return `${x},${y}`;
  }).join(" ");
}

function TelemetryCard({ icon: Icon, label, value, unit, detail }) {
  return (
    <article className="panel telemetry-card">
      <Icon size={17} />
      <span>{label}</span>
      <strong>{value}<small>{unit}</small></strong>
      <p>{detail}</p>
    </article>
  );
}

export default function TelemetryPage() {
  const { telemetry, history, hasSample } = useSimulationTelemetry();
  const displayed = (value, digits = 2) => hasSample ? Number(value).toFixed(digits) : "—";

  return (
    <section className="telemetry-page">
      <header className="telemetry-heading">
        <div>
          <span className="simulator-eyebrow">LOCAL SIMULATION SOURCE</span>
          <h2>Live Telemetry</h2>
          <p>Values are published by the 3D simulator only; no aircraft is connected.</p>
        </div>
        <span className="telemetry-source"><i /> {hasSample ? "SAMPLE AVAILABLE" : "STANDBY"}</span>
      </header>

      <div className="telemetry-cards">
        <TelemetryCard icon={Navigation} label="ALTITUDE" value={displayed(telemetry.altitude)} unit="m" detail="Simulated vertical position" />
        <TelemetryCard icon={Wind} label="GROUND SPEED" value={displayed(telemetry.speed)} unit="m/s" detail="Calculated from simulated velocity" />
        <TelemetryCard icon={Activity} label="VERTICAL SPEED" value={displayed(telemetry.verticalSpeed)} unit="m/s" detail="Positive values indicate climb" />
        <TelemetryCard icon={BatteryCharging} label="BATTERY" value={hasSample ? Math.round(telemetry.batteryPercent) : "—"} unit="%" detail="Simulated battery estimate" />
        <TelemetryCard icon={Compass} label="HEADING" value={hasSample ? Math.round(telemetry.yaw) : "—"} unit="°" detail="Local virtual aircraft heading" />
        <TelemetryCard icon={Navigation} label="POSITION (X / Z)" value={hasSample ? `${telemetry.x.toFixed(1)} / ${telemetry.z.toFixed(1)}` : "—"} unit="m" detail="Local simulator coordinates" />
        <TelemetryCard icon={Activity} label="PITCH / ROLL" value={hasSample ? `${Math.round(telemetry.pitch)} / ${Math.round(telemetry.roll)}` : "—"} unit="°" detail="Simulated aircraft attitude" />
      </div>

      <div className="telemetry-chart-grid">
        <section className="panel telemetry-chart">
          <div className="mission-panel-title">SIMULATED ALTITUDE HISTORY</div>
          <p>Latest {history.length} physics samples</p>
          {history.length > 1 ? (
            <svg viewBox="0 0 240 68" role="img" aria-label="Simulated altitude history">
              <polyline points={makePolyline(history, "altitude")} />
            </svg>
          ) : (
            <div className="telemetry-chart-empty">Start the 3D simulator to collect local samples.</div>
          )}
        </section>
        <section className="panel telemetry-health">
          <div className="mission-panel-title">SOURCE AND SENSOR STATUS</div>
          <dl>
            <div><dt>Telemetry source</dt><dd>Local physics engine</dd></div>
            <div><dt>Connection</dt><dd>Browser-local</dd></div>
            <div><dt>GPS coordinates</dt><dd>Not provided</dd></div>
            <div><dt>Temperature / signal</dt><dd>Not simulated</dd></div>
          </dl>
        </section>
      </div>
    </section>
  );
}
