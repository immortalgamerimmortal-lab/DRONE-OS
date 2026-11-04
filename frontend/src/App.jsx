import DroneSimulator from "./simulation/DroneSimulator.jsx";
import MissionPlanner from "./pages/MissionPlanner.jsx";
import TelemetryPage from "./pages/TelemetryPage.jsx";
import AssistantPage from "./pages/AssistantPage.jsx";
import { SimulationTelemetryProvider } from "./context/SimulationTelemetryContext.jsx";
import { useState } from "react";
import {
  Activity, ArrowUpRight, BatteryCharging, Bell,
  ChevronDown, CircleHelp, Clock3, Compass,
  Crosshair, Gauge, Layers3, Map, MapPinned, Menu,
  MoreHorizontal, Navigation, Plane, Play,
  RadioTower, Search, Settings2,
  ShieldCheck, Signal,
  Thermometer, Wifi, Wind, Zap
} from "lucide-react";

import "./App.css";

const navigation = [
  { label: "Overview", icon: Gauge },
  { label: "Mission Planner", icon: MapPinned },
  { label: "Live Telemetry", icon: Activity },
  { label: "3D Simulator", icon: Crosshair },
  { label: "Flight Logs", icon: Clock3 },
  { label: "AI Assistant", icon: Zap },
  { label: "Map", icon: Map },
];

const metrics = [
  {
    label: "ALTITUDE",
    value: "124.8",
    unit: "m",
    detail: "Demo value · not live",
    icon: Navigation,
    color: "blue",
    points: "0,27 15,24 30,26 45,17 60,20 75,12 90,15 110,5 120,8"
  },
  {
    label: "GROUND SPEED",
    value: "12.6",
    unit: "m/s",
    detail: "Demo value · not live",
    icon: Wind,
    color: "purple",
    points: "0,24 15,19 30,22 45,12 60,15 75,10 90,13 105,5 120,9"
  },
  {
    label: "BATTERY",
    value: "84",
    unit: "%",
    detail: "Demo value · not live",
    icon: BatteryCharging,
    color: "green",
    points: "0,7 15,8 30,9 45,11 60,13 75,15 90,16 105,19 120,21"
  },
  {
    label: "SIGNAL STRENGTH",
    value: "98",
    unit: "%",
    detail: "No aircraft connected",
    icon: Signal,
    color: "orange",
    points: "0,17 15,13 30,17 45,9 60,12 75,8 90,11 105,5 120,7"
  },
];

function MetricCard({ metric }) {
  const Icon = metric.icon;

  return (
    <div className="metric-card">
      <div className="metric-top">
        <span className="metric-label">{metric.label}</span>
        <div className={`metric-icon ${metric.color}`}>
          <Icon size={17} />
        </div>
      </div>

      <div className="metric-value">
        {metric.value}
        <span>{metric.unit}</span>
      </div>

      <div className="metric-bottom">
        <span>{metric.detail}</span>
        <svg viewBox="0 0 120 36" className="sparkline">
          <polyline points={metric.points} />
        </svg>
      </div>
    </div>
  );
}

function App() {
  const [activeNav, setActiveNav] = useState("Overview");
  const [menuOpen, setMenuOpen] = useState(false);

  return (
    <SimulationTelemetryProvider>
    <div className="app-shell">

      {/* SIDEBAR */}
      <aside className={`sidebar ${menuOpen ? "menu-open" : ""}`}>
        <div className="brand">
          <div className="brand-icon">
            <Plane size={23} />
          </div>
          <div>
            <h2>DRONE<span>OS</span></h2>
            <p>FLIGHT INTELLIGENCE</p>
          </div>
        </div>

        <div className="workspace-label">WORKSPACE</div>

        <nav className="navigation-menu">
          {navigation.map((item) => {
            const Icon = item.icon;

            return (
              <button
                key={item.label}
                className={`nav-item ${
                  activeNav === item.label ? "active" : ""
                }`}
                onClick={() => {
                  setActiveNav(item.label);
                  setMenuOpen(false);
                }}
              >
                <Icon size={18} />
                <span>{item.label}</span>
              </button>
            );
          })}
        </nav>

        <div className="sidebar-spacer" />

        <div className="connection-card">
          <div className="connection-heading">
            <span className="offline-dot" />
            DEMO MODE
            <span className="offline-label">OFFLINE</span>
          </div>
          <p>No aircraft or telemetry source connected</p>
        </div>

        <button className={`nav-item settings-item ${activeNav === "Settings" ? "active" : ""}`}
          onClick={() => {
            setActiveNav("Settings");
            setMenuOpen(false);
          }}>
          <Settings2 size={18} />
          <span>Settings</span>
        </button>

        <div className="profile">
          <div className="avatar">D</div>
          <div className="profile-details">
            <strong>Drone Operator</strong>
            <span>Administrator</span>
          </div>
          <MoreHorizontal size={19} />
        </div>
      </aside>

      {/* MAIN CONTENT */}
      <main className="main-content">

        {/* HEADER */}
        <header className="topbar">
          <div className="breadcrumb">
            <button
              className="mobile-menu"
              aria-label={menuOpen ? "Close navigation" : "Open navigation"}
              aria-expanded={menuOpen}
              onClick={() => setMenuOpen((open) => !open)}
            >
              <Menu size={20} />
            </button>
            <span>Workspace</span>
            <span className="breadcrumb-slash">/</span>
            <strong>{activeNav}</strong>
          </div>

          <div className="topbar-actions">
            <div className="system-status">
              <span className="online-dot" />
              SIMULATION DEMO
            </div>

            <button className="icon-button" aria-label="Search" title="Search is not configured in this frontend." disabled>
              <Search size={18} />
            </button>

            <button className="icon-button" aria-label="Notifications" title="No notification source is connected." disabled>
              <Bell size={18} />
            </button>

            <button className="icon-button" aria-label="Help" title="Help content is not configured." disabled>
              <CircleHelp size={18} />
            </button>

            <div className="top-divider" />

            <button className="operator-button" title="Operator accounts are not configured." disabled>
              <div className="avatar small">D</div>
              <ChevronDown size={15} />
            </button>
          </div>
        </header>

        {/* PAGE CONTENT */}
        <div className="dashboard">

          <section className="welcome-section">
            <div>
              <div className="eyebrow">
                <span className="eyebrow-line" />
                COMMAND CENTER / V1.0
              </div>

                  <h1>
                  {activeNav === "3D Simulator" ? (
                    <>3D Flight <span>Simulator.</span></>
                  ) : activeNav === "Overview" ? (
                    <>Flight <span>Overview.</span></>
                  ) : (
                    <>{activeNav}<span>.</span></>
                  )}
                </h1>
             <p className="welcome-description">
  {activeNav === "3D Simulator"
    ? "Explore and control your virtual aircraft."
    : activeNav === "Overview"
      ? "Monitor the DRONE OS demo interface and launch the virtual flight simulator."
      : `Open the ${activeNav.toLowerCase()} workspace.`}
</p>
            </div>
            <div className="welcome-actions">
  {activeNav === "3D Simulator" ? (
    <button
      className="secondary-button"
      onClick={() => setActiveNav("Overview")}
    >
      <Gauge size={16} />
      Back to Overview
    </button>
  ) : activeNav !== "Overview" ? (
    <button className="secondary-button" onClick={() => setActiveNav("Overview")}>
      <Gauge size={16} />
      Back to Overview
    </button>
  ) : (
    <>
      <button className="secondary-button" onClick={() => setActiveNav("Flight Logs")}>
        <Clock3 size={16} />
        Flight History
      </button>

      <button className="primary-button" onClick={() => setActiveNav("3D Simulator")}>
        <Play size={16} />
        Launch Simulator
      </button>
    </>
  )}
</div>
            
          </section>
          {activeNav === "3D Simulator" && <DroneSimulator />}
          {activeNav === "Mission Planner" && <MissionPlanner />}
          {activeNav === "Live Telemetry" && <TelemetryPage />}
          {activeNav === "AI Assistant" && <AssistantPage />}
          {!["Overview", "3D Simulator", "Mission Planner", "Live Telemetry", "AI Assistant"].includes(activeNav) && (
            <section className="panel module-placeholder">
              <span className="simulator-eyebrow">MODULE NOT CONNECTED</span>
              <h2>{activeNav}</h2>
              <p>
                This workspace is not implemented yet. No map tiles, flight records,
                or persisted settings are available in this frontend.
              </p>
              <span>Backend status: unavailable · Hardware control: disabled</span>
            </section>
          )}
          {activeNav === "Overview" && (
            <>
          <div className="demo-banner" role="status">
            <ShieldCheck size={16} />
            DEMO DATA ONLY — values below are illustrative and are not measurements from an aircraft.
          </div>

          {/* STAT CARDS */}
          <section className="metrics-grid">
            {metrics.map((metric) => (
              <MetricCard key={metric.label} metric={metric} />
            ))}
          </section>

          {/* MAIN GRID */}
          <section className="content-grid">

            {/* MAP PANEL */}
            <div className="panel map-panel">
              <div className="panel-header">
                <div>
                  <div className="panel-title">
                    <MapPinned size={17} />
                    Flight Visualization
                  </div>
                  <p>Simulated aircraft position</p>
                </div>

                <button className="icon-button" aria-label="Map controls unavailable" title="Overview map is a static demo preview." disabled>
                  <MoreHorizontal size={19} />
                </button>
              </div>

              <div className="map-container">
                <div className="map-grid" />
                <div className="map-glow" />

                <svg className="flight-route"
                  viewBox="0 0 600 320"
                  preserveAspectRatio="none">
                  <path
                    d="M65 252 Q170 240 210 170 T370 115 T525 55"
                    fill="none"
                    stroke="#46C8FF"
                    strokeWidth="2.5"
                    strokeDasharray="7 8"
                  />
                  <circle cx="65" cy="252" r="6"
                    fill="#46C8FF" />
                  <circle cx="525" cy="55" r="7"
                    fill="#46C8FF" />
                </svg>

                <div className="map-location start-location">
                  <span className="location-dot" />
                  <span>BASE STATION</span>
                </div>

                <div className="drone-marker">
                  <div className="drone-marker-ring" />
                  <Plane size={24} />
                </div>

                <div className="map-location end-location">
                  <span className="location-dot" />
                  <span>WAYPOINT 03</span>
                </div>

                <div className="map-coordinates">
                  <span>LAT 20.2961° N</span>
                  <span>LON 85.8245° E</span>
                </div>

                <div className="map-zoom">
                  <button disabled title="Zoom is unavailable in the static demo preview.">+</button>
                  <button disabled title="Zoom is unavailable in the static demo preview.">−</button>
                  <button disabled title="Map layers are unavailable in the static demo preview."><Layers3 size={16} /></button>
                </div>

                <div className="map-label">
                  <Crosshair size={14} />
                  SIMULATION MAP
                </div>
              </div>

              <div className="map-footer">
                <div>
                  <span className="footer-label">MISSION DISTANCE</span>
                  <strong>2.48 <small>km</small></strong>
                </div>
                <div>
                  <span className="footer-label">FLIGHT DURATION</span>
                  <strong>08:42 <small>min</small></strong>
                </div>
                <div>
                  <span className="footer-label">WAYPOINTS</span>
                  <strong>03 <small>/ 08</small></strong>
                </div>
                <button className="map-action" onClick={() => setActiveNav("Mission Planner")}>
                  Mission details <ArrowUpRight size={15} />
                </button>
              </div>
            </div>

            {/* AIRCRAFT PANEL */}
            <div className="panel aircraft-panel">
              <div className="panel-header">
                <div>
                  <div className="panel-title">
                    <Plane size={17} />
                    Aircraft Status
                  </div>
                  <p>Vehicle identification and health</p>
                </div>
                <span className="status-pill">
                  <span className="online-dot" />
                  SIMULATED
                </span>
              </div>

              <div className="aircraft-visual">
                <div className="aircraft-circle">
                  <div className="aircraft-circle-inner">
                    <Plane size={65} strokeWidth={1.2} />
                  </div>
                </div>
                <span className="aircraft-caption">
                  QUADCOPTER / SIMULATED MODEL
                </span>
              </div>

              <div className="aircraft-info">
                <div>
                  <span>MODEL</span>
                  <strong>DRONE-X1</strong>
                </div>
                <div>
                  <span>FIRMWARE</span>
                  <strong>v1.2.0</strong>
                </div>
                <div>
                  <span>CONNECTION</span>
                  <strong>NOT CONNECTED</strong>
                </div>
              </div>

              <div className="aircraft-sensors">
                <div>
                  <Thermometer size={17} />
                  <span>Temperature</span>
                  <strong>32°C</strong>
                </div>
                <div>
                  <Compass size={17} />
                  <span>Heading</span>
                  <strong>245°</strong>
                </div>
                <div>
                  <Wifi size={17} />
                  <span>GPS Satellites</span>
                  <strong>14</strong>
                </div>
              </div>
            </div>
          </section>

          {/* LOWER GRID */}
          <section className="bottom-grid">

            <div className="panel activity-panel">
              <div className="panel-header">
                <div>
                  <div className="panel-title">
                    <Activity size={17} />
                    Demo Status
                  </div>
                  <p>Current frontend capabilities</p>
                </div>
                <button className="text-button" onClick={() => setActiveNav("Flight Logs")}>View all</button>
              </div>

              <div className="activity-list">
                <div className="activity-row">
                  <div className="activity-icon green">
                    <ShieldCheck size={16} />
                  </div>
                  <div className="activity-text">
                    <strong>Simulation-only mode</strong>
                    <span>No physical aircraft connection is implemented</span>
                  </div>
                  <time>LOCAL</time>
                </div>

                <div className="activity-row">
                  <div className="activity-icon blue">
                    <RadioTower size={16} />
                  </div>
                  <div className="activity-text">
                    <strong>Telemetry source</strong>
                    <span>Only local simulator samples are available</span>
                  </div>
                  <time>SIM</time>
                </div>

                <div className="activity-row">
                  <div className="activity-icon purple">
                    <MapPinned size={16} />
                  </div>
                  <div className="activity-text">
                    <strong>Mission storage</strong>
                    <span>Missions are saved in this browser only</span>
                  </div>
                  <time>LOCAL</time>
                </div>
              </div>
            </div>

            <div className="panel quick-panel">
              <div className="panel-header">
                <div>
                  <div className="panel-title">
                    <Zap size={17} />
                    Quick Controls
                  </div>
                  <p>Simulation shortcuts</p>
                </div>
              </div>

              <button className="quick-control"
                onClick={() => setActiveNav("Mission Planner")}>
                <div className="quick-icon blue">
                  <MapPinned size={18} />
                </div>
                <span>
                  <strong>Mission Planner</strong>
                  <small>Create a flight route</small>
                </span>
                <ArrowUpRight size={17} />
              </button>

              <button className="quick-control"
                onClick={() => setActiveNav("3D Simulator")}>
                <div className="quick-icon purple">
                  <Crosshair size={18} />
                </div>
                <span>
                  <strong>3D Simulator</strong>
                  <small>Explore virtual flight</small>
                </span>
                <ArrowUpRight size={17} />
              </button>

              <button className="quick-control"
                onClick={() => setActiveNav("Live Telemetry")}>
                <div className="quick-icon green">
                  <Activity size={18} />
                </div>
                <span>
                  <strong>Telemetry Monitor</strong>
                  <small>Inspect vehicle sensors</small>
                </span>
                <ArrowUpRight size={17} />
              </button>
            </div>
          </section>

          <footer className="dashboard-footer">
            <span>DRONE OS © 2026</span>
            <span>GROUND CONTROL INTERFACE</span>
            <span className="safe-indicator">
              <ShieldCheck size={13} />
              SIMULATION / NO HARDWARE CONTROL
            </span>
          </footer>
            </>
          )}
        </div>
      </main>
    </div>
    </SimulationTelemetryProvider>
  );
}

export default App;
