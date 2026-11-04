import { useEffect, useMemo, useState } from "react";
import { LocateFixed, MapPinned, Minus, Plus, Radio } from "lucide-react";
import { useSimulationTelemetry } from "../context/SimulationTelemetryContext.jsx";
import "./MapPage.css";

const MISSION_STORAGE_KEY = "drone-os.missions.v1";

function isWaypointList(value) {
  return Array.isArray(value) && value.every((mission) =>
    mission &&
    typeof mission.id === "string" &&
    typeof mission.name === "string" &&
    Array.isArray(mission.waypoints) &&
    mission.waypoints.every((point) =>
      Number.isFinite(point.x) && Number.isFinite(point.z)
    )
  );
}

export default function MapPage() {
  const { telemetry, hasSample } = useSimulationTelemetry();
  const [missions, setMissions] = useState([]);
  const [selectedMissionId, setSelectedMissionId] = useState("");
  const [missionError, setMissionError] = useState("");
  const [zoom, setZoom] = useState(1);
  const [follow, setFollow] = useState(true);
  const [mapCenter, setMapCenter] = useState({ x: 0, z: 0 });
  const [home, setHome] = useState({ x: 0, z: 0 });
  const [homeDraft, setHomeDraft] = useState({ x: "0", z: "0" });

  useEffect(() => {
    try {
      const saved = window.localStorage.getItem(MISSION_STORAGE_KEY);
      if (!saved) return;
      const parsed = JSON.parse(saved);
      if (!isWaypointList(parsed)) throw new Error("Saved mission data has an invalid format.");
      setMissions(parsed);
      setSelectedMissionId(parsed[0]?.id ?? "");
    } catch (loadError) {
      setMissionError(`Could not load local missions: ${loadError.message}`);
    }
  }, []);

  const selectedMission = missions.find(({ id }) => id === selectedMissionId);
  const centerX = follow ? telemetry.x : mapCenter.x;
  const centerZ = follow ? telemetry.z : mapCenter.z;
  const routePoints = useMemo(() => selectedMission?.waypoints.map((point) => ({
    x: 400 + (point.x - centerX) * zoom * 1.5,
    y: 220 + (point.z - centerZ) * zoom * 1.5
  })) ?? [], [selectedMission, centerX, centerZ, zoom]);
  const project = (x, z) => ({
    x: 400 + (x - centerX) * zoom * 1.5,
    y: 220 + (z - centerZ) * zoom * 1.5
  });
  const dronePoint = project(telemetry.x, telemetry.z);
  const homePoint = project(home.x, home.z);
  const route = routePoints.map(({ x, y }) => `${x},${y}`).join(" ");

  const toggleFollow = () => {
    if (follow) setMapCenter({ x: telemetry.x, z: telemetry.z });
    setFollow((enabled) => !enabled);
  };

  const updateHome = (event) => {
    event.preventDefault();
    const x = Number(homeDraft.x);
    const z = Number(homeDraft.z);
    if (!Number.isFinite(x) || !Number.isFinite(z) || Math.abs(x) > 100000 || Math.abs(z) > 100000) {
      setMissionError("Home coordinates must be finite values between -100,000 m and 100,000 m.");
      return;
    }
    setHome({ x, z });
    setMissionError("");
  };

  return (
    <section className="map-page">
      <header className="map-page-heading">
        <div>
          <span className="simulator-eyebrow">LOCAL SIMULATION MAP</span>
          <h2>Map</h2>
          <p>Offline coordinate-plane fallback. No map tiles or real location are requested.</p>
        </div>
        <span className="map-page-source"><Radio size={13} /> {hasSample ? "SIMULATED POSITION" : "SIMULATOR STANDBY"}</span>
      </header>

      <section className="panel map-page-panel">
        <div className="map-page-toolbar">
          <label>
            Mission route
            <select
              value={selectedMissionId}
              onChange={(event) => setSelectedMissionId(event.target.value)}
            >
              <option value="">No mission</option>
              {missions.map((mission) => <option value={mission.id} key={mission.id}>{mission.name || "Untitled mission"}</option>)}
            </select>
          </label>
          <button className={`map-page-control ${follow ? "selected" : ""}`} onClick={toggleFollow} aria-pressed={follow}>
            <MapPinned size={14} /> FOLLOW {follow ? "ON" : "OFF"}
          </button>
          <button className="map-page-control" onClick={() => setMapCenter({ x: telemetry.x, z: telemetry.z })}>
            <LocateFixed size={14} /> RECENTER
          </button>
          <div className="map-page-zoom">
            <button onClick={() => setZoom((value) => Math.min(3, value + 0.25))} aria-label="Zoom in" disabled={zoom >= 3}><Plus size={14} /></button>
            <span>{Math.round(zoom * 100)}%</span>
            <button onClick={() => setZoom((value) => Math.max(0.5, value - 0.25))} aria-label="Zoom out" disabled={zoom <= 0.5}><Minus size={14} /></button>
          </div>
        </div>

        {missionError && <p className="map-page-error" role="alert">{missionError}</p>}

        <div className="local-map">
          <svg viewBox="0 0 800 440" role="img" aria-label="Local simulated drone map">
            <defs>
              <pattern id="local-map-grid" width={32 * zoom} height={32 * zoom} patternUnits="userSpaceOnUse">
                <path d={`M ${32 * zoom} 0 L 0 0 0 ${32 * zoom}`} fill="none" stroke="#28485d" strokeWidth="1" />
              </pattern>
            </defs>
            <rect width="800" height="440" fill="url(#local-map-grid)" />
            <path d="M0 355 C160 320 210 175 350 220 S585 365 800 130" fill="none" stroke="#263b43" strokeWidth="38" opacity=".8" />
            <path d="M0 355 C160 320 210 175 350 220 S585 365 800 130" fill="none" stroke="#8ca0a8" strokeWidth="1.5" strokeDasharray="9 12" opacity=".6" />
            {routePoints.length > 1 && <polyline points={route} fill="none" stroke="#66d3ff" strokeWidth="3" strokeDasharray="7 7" />}
            {routePoints.map((point, index) => (
              <g key={selectedMission.waypoints[index].id}>
                <circle cx={point.x} cy={point.y} r="10" fill="#133c53" stroke="#69d4ff" strokeWidth="2" />
                <text x={point.x} y={point.y + 3} textAnchor="middle" fill="#e7f7ff" fontSize="8">{index + 1}</text>
              </g>
            ))}
            <g transform={`translate(${homePoint.x} ${homePoint.y})`}>
              <rect x="-7" y="-7" width="14" height="14" transform="rotate(45)" fill="#b5a2ff" />
              <text x="12" y="3" fill="#d4caff" fontSize="9">HOME</text>
            </g>
            <g transform={`translate(${dronePoint.x} ${dronePoint.y}) rotate(${telemetry.yaw})`}>
              <circle r="19" fill="#1e536e" opacity=".75" stroke="#6cdbff" />
              <path d="M0 -12 L8 9 L0 5 L-8 9 Z" fill="#d6f5ff" />
            </g>
          </svg>
          <span className="local-map-label">LOCAL X/Z · METERS</span>
          <div className="local-map-coordinates">
            X {hasSample ? telemetry.x.toFixed(1) : "0.0"} m&nbsp; · &nbsp;Z {hasSample ? telemetry.z.toFixed(1) : "0.0"} m
          </div>
        </div>

        <form className="map-home-form" onSubmit={updateHome}>
          <strong>SIMULATED HOME LOCATION</strong>
          <label>X (m)<input type="number" step="any" value={homeDraft.x} onChange={(event) => setHomeDraft((point) => ({ ...point, x: event.target.value }))} /></label>
          <label>Z (m)<input type="number" step="any" value={homeDraft.z} onChange={(event) => setHomeDraft((point) => ({ ...point, z: event.target.value }))} /></label>
          <button className="map-page-control" type="submit">Set home</button>
        </form>
      </section>
    </section>
  );
}
