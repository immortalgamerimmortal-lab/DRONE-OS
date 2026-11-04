import { useEffect, useMemo, useState } from "react";
import {
  ArrowDown,
  ArrowUp,
  Copy,
  MapPinned,
  Plus,
  Save,
  Trash2
} from "lucide-react";
import "./MissionPlanner.css";

const STORAGE_KEY = "drone-os.missions.v1";
const WAYPOINT_BOUNDS = {
  x: [-100000, 100000],
  z: [-100000, 100000],
  altitude: [0, 10000],
  speed: [0.1, 100]
};

function isMissionList(value) {
  return Array.isArray(value) && value.every((mission) =>
    mission &&
    typeof mission.id === "string" &&
    typeof mission.name === "string" &&
    typeof mission.description === "string" &&
    Array.isArray(mission.waypoints) &&
    mission.waypoints.every((waypoint) =>
      waypoint &&
      typeof waypoint.id === "string" &&
      Number.isFinite(waypoint.x) &&
      Number.isFinite(waypoint.z) &&
      Number.isFinite(waypoint.altitude) &&
      Number.isFinite(waypoint.speed)
    )
  );
}

function createId() {
  return `${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
}

function createMission(name = "New mission") {
  return {
    id: createId(),
    name,
    description: "",
    waypoints: []
  };
}

function createWaypoint(index) {
  return {
    id: createId(),
    x: index === 0 ? 0 : index * 25,
    z: index === 0 ? 0 : index * 15,
    altitude: 30,
    speed: 5
  };
}

function getMissionStats(waypoints) {
  let distance = 0;
  let duration = 0;

  for (let index = 1; index < waypoints.length; index += 1) {
    const previous = waypoints[index - 1];
    const current = waypoints[index];
    const segment = Math.hypot(current.x - previous.x, current.z - previous.z);
    distance += segment;
    duration += segment / Math.max(current.speed, 0.1);
  }

  return { distance, duration };
}

function getPreviewPoints(waypoints) {
  if (waypoints.length === 0) return [];
  const xs = waypoints.map(({ x }) => x);
  const zs = waypoints.map(({ z }) => z);
  const minX = Math.min(...xs);
  const maxX = Math.max(...xs);
  const minZ = Math.min(...zs);
  const maxZ = Math.max(...zs);
  const rangeX = Math.max(maxX - minX, 1);
  const rangeZ = Math.max(maxZ - minZ, 1);

  return waypoints.map((point) => ({
    x: 24 + ((point.x - minX) / rangeX) * 352,
    y: 24 + ((point.z - minZ) / rangeZ) * 192
  }));
}

export default function MissionPlanner() {
  const [missions, setMissions] = useState([]);
  const [selectedId, setSelectedId] = useState("");
  const [storageReady, setStorageReady] = useState(false);
  const [error, setError] = useState("");
  const [waypointDrafts, setWaypointDrafts] = useState({});
  const selectedMission = missions.find(({ id }) => id === selectedId);

  useEffect(() => {
    try {
      const saved = window.localStorage.getItem(STORAGE_KEY);
      if (saved) {
        const parsed = JSON.parse(saved);
        if (!isMissionList(parsed)) {
          throw new Error("Saved mission data has an invalid format.");
        }
        setMissions(parsed);
        setSelectedId(parsed[0]?.id ?? "");
      }
      setStorageReady(true);
    } catch (loadError) {
      setError(`Could not load saved missions: ${loadError.message}`);
    }
  }, []);

  const persistMissions = (nextMissions) => {
    try {
      window.localStorage.setItem(STORAGE_KEY, JSON.stringify(nextMissions));
      setMissions(nextMissions);
      setError("");
      return true;
    } catch (saveError) {
      setError(`Could not save missions in this browser: ${saveError.message}`);
      return false;
    }
  };

  const updateSelected = (update) => {
    if (!selectedMission) return;
    persistMissions(missions.map((mission) =>
      mission.id === selectedId ? update(mission) : mission
    ));
  };

  const createNewMission = () => {
    const mission = createMission();
    if (persistMissions([...missions, mission])) setSelectedId(mission.id);
  };

  const deleteSelected = () => {
    const nextMissions = missions.filter(({ id }) => id !== selectedId);
    if (persistMissions(nextMissions)) {
      setSelectedId(nextMissions[0]?.id ?? "");
    }
  };

  const duplicateSelected = () => {
    if (!selectedMission) return;
    const duplicate = {
      ...selectedMission,
      id: createId(),
      name: `${selectedMission.name} copy`,
      waypoints: selectedMission.waypoints.map((waypoint) => ({
        ...waypoint,
        id: createId()
      }))
    };
    if (persistMissions([...missions, duplicate])) setSelectedId(duplicate.id);
  };

  const updateWaypoint = (waypointId, field, value) => {
    const draftKey = `${selectedId}:${waypointId}:${field}`;
    setWaypointDrafts((drafts) => ({ ...drafts, [draftKey]: value }));
    if (value.trim() === "") return;
    const numericValue = Number(value);
    if (!Number.isFinite(numericValue) || !WAYPOINT_BOUNDS[field]) return;
    const [minimum, maximum] = WAYPOINT_BOUNDS[field];
    const boundedValue = Math.min(maximum, Math.max(minimum, numericValue));
    updateSelected((mission) => ({
      ...mission,
      waypoints: mission.waypoints.map((waypoint) =>
        waypoint.id === waypointId
          ? { ...waypoint, [field]: boundedValue }
          : waypoint
      )
    }));
  };

  const moveWaypoint = (index, direction) => {
    const nextIndex = index + direction;
    if (!selectedMission || nextIndex < 0 || nextIndex >= selectedMission.waypoints.length) return;
    updateSelected((mission) => {
      const waypoints = [...mission.waypoints];
      [waypoints[index], waypoints[nextIndex]] = [waypoints[nextIndex], waypoints[index]];
      return { ...mission, waypoints };
    });
  };

  const stats = useMemo(
    () => getMissionStats(selectedMission?.waypoints ?? []),
    [selectedMission?.waypoints]
  );
  const previewPoints = useMemo(
    () => getPreviewPoints(selectedMission?.waypoints ?? []),
    [selectedMission?.waypoints]
  );
  const route = previewPoints.map(({ x, y }) => `${x},${y}`).join(" ");

  return (
    <section className="mission-planner">
      <header className="mission-heading">
        <div>
          <span className="mission-eyebrow">SIMULATION WORKSPACE</span>
          <h2>Mission Planner</h2>
          <p>Design and save local simulated routes. Nothing here controls an aircraft.</p>
        </div>
        <button className="mission-primary-button" onClick={createNewMission} disabled={!storageReady}>
          <Plus size={16} /> New mission
        </button>
      </header>

      {error && <div className="mission-error" role="alert">{error}</div>}

      {!storageReady && !error && <div className="mission-empty">Loading saved missions…</div>}

      {storageReady && missions.length === 0 && (
        <div className="panel mission-empty">
          <MapPinned size={28} />
          <strong>No saved missions</strong>
          <span>Create a mission to start adding virtual waypoints.</span>
        </div>
      )}

      {storageReady && missions.length > 0 && selectedMission && (
        <div className="mission-layout">
          <aside className="panel mission-list">
            <div className="mission-panel-title">SAVED MISSIONS</div>
            {missions.map((mission) => (
              <button
                key={mission.id}
                className={`mission-list-item ${mission.id === selectedId ? "active" : ""}`}
                onClick={() => setSelectedId(mission.id)}
              >
                <strong>{mission.name || "Untitled mission"}</strong>
                <span>{mission.waypoints.length} waypoints</span>
              </button>
            ))}
          </aside>

          <div className="mission-editor">
            <section className="panel mission-details">
              <div className="mission-section-header">
                <div>
                  <div className="mission-panel-title">MISSION DETAILS</div>
                  <p>Changes are saved in this browser automatically.</p>
                </div>
                <div className="mission-actions">
                  <button className="mission-icon-button" onClick={duplicateSelected} aria-label="Duplicate mission" title="Duplicate mission">
                    <Copy size={15} />
                  </button>
                  <button className="mission-icon-button danger" onClick={deleteSelected} aria-label="Delete mission" title="Delete mission">
                    <Trash2 size={15} />
                  </button>
                </div>
              </div>
              <label className="mission-field">
                <span>Mission name</span>
                <input
                  value={selectedMission.name}
                  maxLength={80}
                  onChange={(event) => updateSelected((mission) => ({ ...mission, name: event.target.value }))}
                />
              </label>
              <label className="mission-field">
                <span>Description</span>
                <textarea
                  value={selectedMission.description}
                  maxLength={500}
                  rows={3}
                  onChange={(event) => updateSelected((mission) => ({ ...mission, description: event.target.value }))}
                />
              </label>
            </section>

            <section className="panel mission-preview-panel">
              <div className="mission-section-header">
                <div>
                  <div className="mission-panel-title">ROUTE PREVIEW</div>
                  <p>Local coordinate plane · illustrative route only</p>
                </div>
                <div className="mission-stats">
                  <span><strong>{stats.distance.toFixed(0)}</strong> m distance</span>
                  <span>
                    <strong>{stats.duration < 60 ? Math.ceil(stats.duration) : Math.ceil(stats.duration / 60)}</strong>
                    {stats.duration < 60 ? " sec est." : " min est."}
                  </span>
                  <span><strong>{selectedMission.waypoints.length}</strong> points</span>
                </div>
              </div>
              <svg className="mission-route-preview" viewBox="0 0 400 240" role="img" aria-label="Mission waypoint route preview">
                <defs>
                  <pattern id="mission-grid" width="32" height="32" patternUnits="userSpaceOnUse">
                    <path d="M 32 0 L 0 0 0 32" fill="none" stroke="#29465c" strokeWidth="1" />
                  </pattern>
                </defs>
                <rect width="400" height="240" fill="url(#mission-grid)" />
                {previewPoints.length > 1 && <polyline points={route} fill="none" stroke="#58cfff" strokeWidth="2" strokeDasharray="5 6" />}
                {previewPoints.map((point, index) => (
                  <g key={selectedMission.waypoints[index].id}>
                    <circle cx={point.x} cy={point.y} r="11" fill="#143a50" stroke="#59cfff" />
                    <text x={point.x} y={point.y + 3} textAnchor="middle" fill="#eaf8ff" fontSize="9">{index + 1}</text>
                  </g>
                ))}
                {previewPoints.length === 0 && <text x="200" y="125" textAnchor="middle" fill="#8195a8" fontSize="12">Add a waypoint to preview your route</text>}
              </svg>
            </section>

            <section className="panel mission-waypoints">
              <div className="mission-section-header">
                <div>
                  <div className="mission-panel-title">WAYPOINTS</div>
                  <p>Local X/Z coordinates, altitude in meters, speed in m/s.</p>
                </div>
                <button
                  className="mission-secondary-button"
                  onClick={() => updateSelected((mission) => ({
                    ...mission,
                    waypoints: [...mission.waypoints, createWaypoint(mission.waypoints.length)]
                  }))}
                >
                  <Plus size={14} /> Add waypoint
                </button>
              </div>

              {selectedMission.waypoints.length === 0 ? (
                <div className="mission-empty-inline">No waypoints yet.</div>
              ) : (
                <div className="waypoint-list">
                  {selectedMission.waypoints.map((waypoint, index) => (
                    <article className="waypoint-row" key={waypoint.id}>
                      <strong className="waypoint-number">{String(index + 1).padStart(2, "0")}</strong>
                      {[
                        ["X (m)", "x"],
                        ["Z (m)", "z"],
                        ["Altitude (m)", "altitude"],
                        ["Speed (m/s)", "speed"]
                      ].map(([label, field]) => {
                        const draftKey = `${selectedId}:${waypoint.id}:${field}`;
                        const [minimum, maximum] = WAYPOINT_BOUNDS[field];
                        return (
                        <label className="waypoint-field" key={field}>
                          <span>{label}</span>
                          <input
                            type="number"
                            min={minimum}
                            max={maximum}
                            step="any"
                            value={waypointDrafts[draftKey] ?? waypoint[field]}
                            onChange={(event) => updateWaypoint(waypoint.id, field, event.target.value)}
                            onBlur={() => setWaypointDrafts((drafts) => {
                              const next = { ...drafts };
                              delete next[draftKey];
                              return next;
                            })}
                          />
                        </label>
                        );
                      })}
                      <div className="waypoint-actions">
                        <button className="mission-icon-button" onClick={() => moveWaypoint(index, -1)} disabled={index === 0} aria-label={`Move waypoint ${index + 1} up`}>
                          <ArrowUp size={14} />
                        </button>
                        <button className="mission-icon-button" onClick={() => moveWaypoint(index, 1)} disabled={index === selectedMission.waypoints.length - 1} aria-label={`Move waypoint ${index + 1} down`}>
                          <ArrowDown size={14} />
                        </button>
                        <button
                          className="mission-icon-button danger"
                          aria-label={`Remove waypoint ${index + 1}`}
                          onClick={() => updateSelected((mission) => ({
                            ...mission,
                            waypoints: mission.waypoints.filter(({ id }) => id !== waypoint.id)
                          }))}
                        >
                          <Trash2 size={14} />
                        </button>
                      </div>
                    </article>
                  ))}
                </div>
              )}
            </section>
          </div>
        </div>
      )}

      <div className="mission-safety-note"><Save size={14} /> Missions are stored locally in this browser. Execution is not connected or available.</div>
    </section>
  );
}
