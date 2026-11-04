import {
  Activity,
  Camera,
  Compass,
  Gauge,
  LocateFixed,
  Move3D,
  Plane,
  RotateCcw,
  Wind
} from "lucide-react";
import { useEffect, useRef, useState } from "react";
import { Canvas, useFrame } from "@react-three/fiber";
import { Grid, OrbitControls } from "@react-three/drei";
import { Vector3 } from "three";
import {
  createInitialFlightState,
  GROUND_ALTITUDE,
  stepFlightPhysics
} from "./FlightPhysics.js";
import { useSimulationTelemetry } from "../context/SimulationTelemetryContext.jsx";

import "./DroneSimulator.css";

const INITIAL_CAMERA_TARGET = [0, GROUND_ALTITUDE, 0];

// -----------------------------------------
// FLIGHT PHYSICS ENGINE
// -----------------------------------------

function FlightPhysics({
  physicsRef,
  commandsRef,
  droneRef,
  onTelemetry
}) {
  const publishTimer = useRef(0);

  useFrame((_, delta) => {
    const p = stepFlightPhysics(
      physicsRef.current,
      commandsRef.current,
      delta
    );
    if (!Number.isFinite(delta) || delta <= 0) return;

    if (droneRef.current) {
      droneRef.current.position.set(p.x, p.y, p.z);
      droneRef.current.rotation.set(p.pitch, p.yaw, p.roll);
    }

    publishTimer.current += Math.min(delta, 0.04);

    if (publishTimer.current >= 0.1) {
      publishTimer.current = 0;

      onTelemetry({
        x: p.x,
        altitude: p.y,
        targetAltitude: p.targetAltitude,
        z: p.z,
        yaw: p.yaw * (180 / Math.PI),
        pitch: p.pitch * (180 / Math.PI),
        roll: p.roll * (180 / Math.PI),
        verticalSpeed: p.vy,
        batteryPercent: p.batteryPercent,
        speed: Math.hypot(p.vx, p.vy, p.vz),
        landed: !p.armed && p.y <= GROUND_ALTITUDE + 0.001
      });
    }
  });

  return null;
}

// -----------------------------------------
// 3D QUADCOPTER MODEL
// -----------------------------------------

function DroneModel({ droneRef, flying }) {
  const propellers = useRef([]);

  useFrame((_, delta) => {
    const speed = flying ? 42 : 0;
    const frameDelta = Number.isFinite(delta) ? Math.min(delta, 0.04) : 0;

    propellers.current.forEach((propeller, index) => {
      if (propeller) {
        propeller.rotation.y +=
          frameDelta * speed * (index % 2 === 0 ? 1 : -1);
      }
    });
  });

  const motorPositions = [
    [1, 1],
    [-1, 1],
    [1, -1],
    [-1, -1]
  ];

  return (
    <group ref={droneRef} position={[0, GROUND_ALTITUDE, 0]}>

      {/* Main aircraft body */}
      <mesh castShadow receiveShadow>
        <boxGeometry args={[0.85, 0.2, 0.65]} />
        <meshStandardMaterial
          color="#1a344a"
          metalness={0.82}
          roughness={0.27}
        />
      </mesh>

      {/* Upper body */}
      <mesh position={[0, 0.13, 0]} castShadow>
        <boxGeometry args={[0.54, 0.09, 0.43]} />
        <meshStandardMaterial
          color="#327ba0"
          metalness={0.7}
          roughness={0.25}
        />
      </mesh>

      {/* Central light */}
      <mesh position={[0, 0.19, 0]}>
        <sphereGeometry args={[0.075, 16, 16]} />
        <meshStandardMaterial
          color="#63d9ff"
          emissive="#159dcc"
          emissiveIntensity={2}
        />
      </mesh>

      {/* Aircraft arms */}
      <mesh rotation={[0, Math.PI / 4, 0]} castShadow>
        <boxGeometry args={[2.85, 0.09, 0.13]} />
        <meshStandardMaterial
          color="#233f55"
          metalness={0.8}
          roughness={0.3}
        />
      </mesh>

      <mesh rotation={[0, -Math.PI / 4, 0]} castShadow>
        <boxGeometry args={[2.85, 0.09, 0.13]} />
        <meshStandardMaterial
          color="#233f55"
          metalness={0.8}
          roughness={0.3}
        />
      </mesh>

      {/* Four motors and propellers */}
      {motorPositions.map(([x, z], index) => (
        <group key={index} position={[x, 0.08, z]}>

          <mesh castShadow>
            <cylinderGeometry args={[0.17, 0.17, 0.15, 24]} />
            <meshStandardMaterial
              color="#31536a"
              metalness={0.85}
              roughness={0.25}
            />
          </mesh>

          <group
            ref={(node) => {
              propellers.current[index] = node;
            }}
            position={[0, 0.12, 0]}
          >
            <mesh castShadow>
              <boxGeometry args={[0.95, 0.025, 0.09]} />
              <meshStandardMaterial
                color="#a9c8dc"
                metalness={0.6}
                roughness={0.3}
              />
            </mesh>

            <mesh rotation={[0, Math.PI / 2, 0]} castShadow>
              <boxGeometry args={[0.95, 0.025, 0.09]} />
              <meshStandardMaterial color="#769cb6" />
            </mesh>

            <mesh position={[0, 0.035, 0]}>
              <cylinderGeometry args={[0.065, 0.065, 0.07, 20]} />
              <meshStandardMaterial color="#61d5ff" />
            </mesh>
          </group>
        </group>
      ))}

      {/* Landing supports */}
      {[-0.4, 0.4].map((x) => (
        <mesh key={x} position={[x, -0.33, 0.2]}>
          <cylinderGeometry args={[0.025, 0.025, 0.48, 12]} />
          <meshStandardMaterial color="#63849a" />
        </mesh>
      ))}

      {/* Landing feet */}
      {[-0.4, 0.4].map((x) => (
        <mesh key={x} position={[x, -0.58, 0.2]}>
          <boxGeometry args={[0.45, 0.055, 0.08]} />
          <meshStandardMaterial color="#8baabd" />
        </mesh>
      ))}

      {/* Front camera */}
      <mesh position={[0, -0.02, -0.36]}>
        <sphereGeometry args={[0.13, 20, 20]} />
        <meshStandardMaterial
          color="#07111e"
          metalness={0.5}
          roughness={0.2}
        />
      </mesh>

      <mesh position={[0, -0.02, -0.475]}>
        <sphereGeometry args={[0.055, 16, 16]} />
        <meshStandardMaterial
          color="#55d8ff"
          emissive="#169fd0"
          emissiveIntensity={1.5}
        />
      </mesh>

    </group>
  );
}

function FlightEnvironment() {
  const trees = [
    [-7, -5], [-5, 6], [6, -7], [8, 4], [-9, 2], [4, 9], [10, -2]
  ];

  return (
    <>
      <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, -0.035, 0]} receiveShadow>
        <planeGeometry args={[80, 80]} />
        <meshStandardMaterial color="#10251f" roughness={0.96} />
      </mesh>
      <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, 0.005, 0]}>
        <ringGeometry args={[1.3, 1.45, 48]} />
        <meshBasicMaterial color="#51d7ff" />
      </mesh>
      <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, 0.002, 0]}>
        <ringGeometry args={[0.42, 0.47, 48]} />
        <meshBasicMaterial color="#e2f5ff" />
      </mesh>
      <mesh position={[0, 0.01, -12]}>
        <boxGeometry args={[4, 0.025, 18]} />
        <meshStandardMaterial color="#26343d" roughness={0.85} />
      </mesh>
      {trees.map(([x, z]) => (
        <group key={`${x}-${z}`} position={[x, 0, z]}>
          <mesh position={[0, 0.55, 0]} castShadow>
            <cylinderGeometry args={[0.12, 0.18, 1.1, 8]} />
            <meshStandardMaterial color="#604c35" />
          </mesh>
          <mesh position={[0, 1.45, 0]} castShadow>
            <coneGeometry args={[0.8, 1.8, 8]} />
            <meshStandardMaterial color="#1e654b" roughness={0.9} />
          </mesh>
        </group>
      ))}
      <mesh position={[-6, 0.45, -1]} castShadow>
        <boxGeometry args={[2, 0.9, 2]} />
        <meshStandardMaterial color="#374b59" roughness={0.82} />
      </mesh>
      <mesh position={[-6, 0.92, -1]} castShadow>
        <coneGeometry args={[1.5, 0.6, 4]} />
        <meshStandardMaterial color="#506577" roughness={0.8} />
      </mesh>
    </>
  );
}

function CameraFollowController({
  controlsRef,
  droneRef,
  follow,
  recenterRequest
}) {
  const previousPosition = useRef(new Vector3());
  const recenterRequestRef = useRef(recenterRequest);
  const recentering = useRef(false);
  const desiredTarget = useRef(new Vector3());
  const desiredCamera = useRef(new Vector3());

  useEffect(() => {
    if (droneRef.current) {
      previousPosition.current.copy(droneRef.current.position);
    }
    if (follow && controlsRef.current && droneRef.current) {
      const controls = controlsRef.current;
      desiredTarget.current.copy(droneRef.current.position);
      desiredCamera.current
        .copy(controls.object.position)
        .sub(controls.target)
        .add(desiredTarget.current);
      recentering.current = true;
    }
  }, [follow, controlsRef, droneRef]);

  useFrame((_, delta) => {
    const controls = controlsRef.current;
    const drone = droneRef.current;
    if (!controls || !drone) return;

    if (recenterRequestRef.current !== recenterRequest) {
      recenterRequestRef.current = recenterRequest;
      desiredTarget.current.copy(drone.position);
      desiredCamera.current
        .copy(controls.object.position)
        .sub(controls.target)
        .add(desiredTarget.current);
      recentering.current = true;
    }

    if (follow) {
      const movement = drone.position.clone().sub(previousPosition.current);
      controls.target.add(movement);
      controls.object.position.add(movement);
      if (recentering.current) {
        desiredTarget.current.add(movement);
        desiredCamera.current.add(movement);
      }
      previousPosition.current.copy(drone.position);
    }

    if (recentering.current) {
      const blend = 1 - Math.exp(-5 * Math.min(delta, 0.05));
      controls.target.lerp(desiredTarget.current, blend);
      controls.object.position.lerp(desiredCamera.current, blend);
      if (controls.target.distanceTo(desiredTarget.current) < 0.01) {
        controls.target.copy(desiredTarget.current);
        controls.object.position.copy(desiredCamera.current);
        recentering.current = false;
      }
    }

    controls.update();
  });

  return null;
}

// -----------------------------------------
// THREE.JS SCENE
// -----------------------------------------

function DroneScene({
  physicsRef,
  commandsRef,
  flying,
  onTelemetry,
  follow,
  recenterRequest
}) {
  const droneRef = useRef(null);
  const controlsRef = useRef(null);

  return (
    <Canvas
      shadows
      dpr={[1, 2]}
      camera={{ position: [4.3, 3.4, 5.3], fov: 43 }}
      gl={{ antialias: true }}
    >
      <color attach="background" args={["#081521"]} />

      <ambientLight intensity={1.25} />

      <directionalLight
        position={[5, 8, 5]}
        intensity={2.2}
        castShadow
      />

      <pointLight
        position={[-4, 3, -3]}
        color="#26baff"
        intensity={22}
      />

      <pointLight
        position={[4, 2, 3]}
        color="#7861ff"
        intensity={12}
      />

      <fog attach="fog" args={["#081521", 18, 48]} />

      <Grid
        position={[0, 0, 0]}
        args={[30, 30]}
        cellSize={0.5}
        cellThickness={0.55}
        sectionSize={2}
        sectionThickness={1}
        cellColor="#24506a"
        sectionColor="#327a9b"
        fadeDistance={18}
        fadeStrength={1}
        infiniteGrid
      />

      <FlightEnvironment />
      <DroneModel droneRef={droneRef} flying={flying} />

      <FlightPhysics
        physicsRef={physicsRef}
        commandsRef={commandsRef}
        droneRef={droneRef}
        onTelemetry={onTelemetry}
      />

      <OrbitControls
        ref={controlsRef}
        makeDefault
        target={INITIAL_CAMERA_TARGET}
        enableDamping
        dampingFactor={0.08}
        minDistance={3}
        maxDistance={11}
        maxPolarAngle={Math.PI / 2.05}
      />
      <CameraFollowController
        controlsRef={controlsRef}
        droneRef={droneRef}
        follow={follow}
        recenterRequest={recenterRequest}
      />
    </Canvas>
  );
}

// -----------------------------------------
// MAIN SIMULATOR PAGE
// -----------------------------------------

const KEY_MAP = {
  w: ["forward", 1],
  ArrowUp: ["forward", 1],
  s: ["forward", -1],
  ArrowDown: ["forward", -1],
  a: ["right", -1],
  ArrowLeft: ["right", -1],
  d: ["right", 1],
  ArrowRight: ["right", 1],
  q: ["yaw", -1],
  e: ["yaw", 1],
  r: ["vertical", 1],
  f: ["vertical", -1]
};

export default function DroneSimulator() {
  const { publishTelemetry } = useSimulationTelemetry();
  const physicsRef = useRef(createInitialFlightState());

  const commandsRef = useRef({
    forward: 0,
    right: 0,
    vertical: 0,
    yaw: 0
  });

  const [altitude, setAltitude] = useState(GROUND_ALTITUDE);
  const [targetAltitude, setTargetAltitude] = useState(GROUND_ALTITUDE);
  const [yaw, setYaw] = useState(0);
  const [tilt, setTilt] = useState(0);
  const [speed, setSpeed] = useState(0);
  const [position, setPosition] = useState({ x: 0, z: 0 });
  const [verticalSpeed, setVerticalSpeed] = useState(0);
  const [roll, setRoll] = useState(0);
  const [batteryPercent, setBatteryPercent] = useState(100);
  const [flying, setFlying] = useState(false);
  const [follow, setFollow] = useState(true);
  const [recenterRequest, setRecenterRequest] = useState(0);

  // Keyboard flight controls
  useEffect(() => {
    const handleKeyDown = (event) => {
      const key = KEY_MAP[event.key] || KEY_MAP[event.key.toLowerCase()];

      if (!key) return;

      if (
        event.target?.isContentEditable ||
        ["INPUT", "TEXTAREA", "SELECT"].includes(event.target?.tagName)
      ) {
        return;
      }

      if (event.ctrlKey || event.metaKey || event.altKey) return;
      event.preventDefault();

      const [command, value] = key;
      commandsRef.current[command] = value;

      if (command === "vertical") {
        physicsRef.current.armed = true;
        setFlying(true);
      }
    };

    const handleKeyUp = (event) => {
      const key = KEY_MAP[event.key] || KEY_MAP[event.key.toLowerCase()];

      if (!key) return;

      const [command, value] = key;

      if (commandsRef.current[command] === value) {
        commandsRef.current[command] = 0;
      }
    };

    const resetKeys = () => {
      commandsRef.current = {
        forward: 0,
        right: 0,
        vertical: 0,
        yaw: 0
      };
    };

    const handleVisibilityChange = () => {
      if (document.hidden) resetKeys();
    };

    window.addEventListener("keydown", handleKeyDown);
    window.addEventListener("keyup", handleKeyUp);
    window.addEventListener("blur", resetKeys);
    document.addEventListener("visibilitychange", handleVisibilityChange);

    return () => {
      window.removeEventListener("keydown", handleKeyDown);
      window.removeEventListener("keyup", handleKeyUp);
      window.removeEventListener("blur", resetKeys);
      document.removeEventListener("visibilitychange", handleVisibilityChange);
    };
  }, []);

  // Receive live physics telemetry
  const handleTelemetry = (data) => {
    publishTelemetry(data);
    setAltitude(data.altitude);
    setTargetAltitude(data.targetAltitude);
    setYaw(data.yaw);
    setTilt(data.pitch);
    setRoll(data.roll);
    setBatteryPercent(data.batteryPercent);
    setPosition({ x: data.x, z: data.z });
    setVerticalSpeed(data.verticalSpeed);
    setSpeed(data.speed);

    if (data.landed) {
      setFlying(false);
    }
  };

  const takeOff = () => {
    physicsRef.current.armed = true;
    physicsRef.current.targetAltitude = 1.8;
    setTargetAltitude(1.8);
    setFlying(true);
  };

  const land = () => {
    physicsRef.current.armed = true;
    physicsRef.current.targetAltitude = GROUND_ALTITUDE;
    setTargetAltitude(GROUND_ALTITUDE);
    setFlying(true);
  };

  const reset = () => {
    physicsRef.current = createInitialFlightState();

    commandsRef.current = {
      forward: 0,
      right: 0,
      vertical: 0,
      yaw: 0
    };

    setAltitude(GROUND_ALTITUDE);
    setTargetAltitude(GROUND_ALTITUDE);
    setYaw(0);
    setTilt(0);
    setSpeed(0);
    setPosition({ x: 0, z: 0 });
    setVerticalSpeed(0);
    setRoll(0);
    setBatteryPercent(100);
    setFlying(false);
  };

  const changeAltitude = (value) => {
    const next = Number(value);

    physicsRef.current.targetAltitude = next;
    physicsRef.current.armed = true;

    setTargetAltitude(next);
    setFlying(true);
  };

  const changeYaw = (value) => {
    const next = Number(value);

    physicsRef.current.yaw = next * Math.PI / 180;
    setYaw(next);
  };

  const changeTilt = (value) => {
    const next = Number(value);

    physicsRef.current.manualPitch = next * Math.PI / 180;
    physicsRef.current.pitch = next * Math.PI / 180;

    setTilt(next);
  };

  return (
    <div className="simulator-page">

      <div className="simulator-intro">
        <div>
          <div className="simulator-eyebrow">
            VIRTUAL FLIGHT ENVIRONMENT
          </div>
          <h2>3D Flight Simulator</h2>
          <p>
            Experience virtual flight with acceleration,
            momentum, gravity and aircraft orientation.
          </p>
        </div>

        <div className={`simulator-status ${flying ? "flying" : ""}`}>
          <span />
          {flying ? "SIMULATED FLIGHT" : "STANDBY"}
        </div>
      </div>

      <div className="simulator-layout">

        {/* 3D VIEWPORT */}
        <section className="panel simulator-viewport">

          <div className="panel-header">
            <div>
              <div className="panel-title">
                <Plane size={17} />
                DRONE-X1 / 3D VIEW
              </div>
              <p>Interactive physics simulation</p>
            </div>

            <span className="simulator-live">
              <span />
              PHYSICS ACTIVE
            </span>
          </div>

          <div className="simulator-canvas">
            <DroneScene
              physicsRef={physicsRef}
              commandsRef={commandsRef}
              flying={flying}
              onTelemetry={handleTelemetry}
              follow={follow}
              recenterRequest={recenterRequest}
            />

            <div className="simulator-hud simulator-hud-top">
              <span>DRONE-X1</span>
              <span>3D PHYSICS ENGINE</span>
            </div>

            <div className="simulator-hud simulator-hud-bottom">
              <span>ALT {altitude.toFixed(2)} M</span>
              <span>YAW {Math.round(yaw)}°</span>
              <span>{flying ? "PROPELLERS ACTIVE" : "MOTORS IDLE"}</span>
            </div>
          </div>

          <div className="simulator-viewport-footer">
            <span>DRAG TO ORBIT</span>
            <span>SCROLL TO ZOOM</span>
            <span>RIGHT-DRAG TO PAN</span>
          </div>

          <div className="simulator-camera-controls">
            <button
              className={`sim-camera-button ${follow ? "selected" : ""}`}
              onClick={() => setFollow((enabled) => !enabled)}
              aria-pressed={follow}
            >
              <Camera size={14} />
              FOLLOW {follow ? "ON" : "OFF"}
            </button>
            <button
              className="sim-camera-button"
              onClick={() => setRecenterRequest((request) => request + 1)}
            >
              <LocateFixed size={14} />
              RECENTER
            </button>
          </div>

          <div className="simulator-keyboard-help">
            <strong>KEYBOARD CONTROLS</strong>
            <span>W / S <small>Forward / Back</small></span>
            <span>A / D <small>Left / Right</small></span>
            <span>Q / E <small>Yaw</small></span>
            <span>R / F <small>Climb / Descend</small></span>
          </div>
        </section>

        {/* FLIGHT CONTROL PANEL */}
        <aside className="panel simulator-control-panel">

          <div className="panel-header">
            <div>
              <div className="panel-title">
                <Activity size={17} />
                Flight Parameters
              </div>
              <p>Virtual aircraft controls</p>
            </div>

            <button
              className="sim-reset-icon"
              onClick={reset}
              aria-label="Reset simulation"
              title="Reset simulation"
            >
              <RotateCcw size={16} />
            </button>
          </div>

          <div className="simulator-control-body">

            <div className="simulator-readouts">
              <div>
                <Gauge size={17} />
                <span>ALTITUDE</span>
                <strong>{altitude.toFixed(2)} <small>m</small></strong>
              </div>

              <div>
                <Compass size={17} />
                <span>HEADING</span>
                <strong>{Math.round(yaw)}<small>°</small></strong>
              </div>
              <div>
                <Wind size={17} />
                <span>GROUND SPEED</span>
                <strong>{speed.toFixed(2)} <small>m/s</small></strong>
              </div>
              <div>
                <Activity size={17} />
                <span>VERTICAL SPEED</span>
                <strong>{verticalSpeed.toFixed(2)} <small>m/s</small></strong>
              </div>
              <div>
                <Wind size={17} />
                <span>SIMULATED BATTERY</span>
                <strong>{Math.round(batteryPercent)}<small>%</small></strong>
              </div>
            </div>

            <div className="sim-control">
              <div className="sim-control-label">
                <label htmlFor="sim-altitude">Target Altitude</label>
                <strong>{targetAltitude.toFixed(2)} m</strong>
              </div>

              <input
                id="sim-altitude"
                type="range"
                min={GROUND_ALTITUDE}
                max="4"
                step="0.05"
                value={targetAltitude}
                onChange={(event) => changeAltitude(event.target.value)}
              />

              <div className="sim-range-labels">
                <span>0.65 m</span>
                <span>4.0 m</span>
              </div>
            </div>

            <div className="sim-control">
              <div className="sim-control-label">
                <label htmlFor="sim-yaw">Heading / Yaw</label>
                <strong>{Math.round(yaw)}°</strong>
              </div>

              <input
                id="sim-yaw"
                type="range"
                min="-180"
                max="180"
                step="1"
                value={yaw}
                onChange={(event) => changeYaw(event.target.value)}
              />

              <div className="sim-range-labels">
                <span>-180°</span>
                <span>180°</span>
              </div>
            </div>

            <div className="sim-control">
              <div className="sim-control-label">
                <label htmlFor="sim-tilt">Pitch Trim / Tilt</label>
                <strong>{Math.round(tilt)}°</strong>
              </div>

              <input
                id="sim-tilt"
                type="range"
                min="-25"
                max="25"
                step="1"
                value={tilt}
                onChange={(event) => changeTilt(event.target.value)}
              />

              <div className="sim-range-labels">
                <span>-25°</span>
                <span>25°</span>
              </div>
            </div>

            <div className="sim-command-buttons">
              <button
                className="sim-action takeoff"
                onClick={takeOff}
                disabled={flying}
              >
                <Plane size={17} />
                TAKE OFF
              </button>

              <button
                className="sim-action land"
                onClick={land}
                disabled={!flying && altitude <= GROUND_ALTITUDE + 0.01}
              >
                <Wind size={17} />
                LAND
              </button>
            </div>

            <button className="sim-reset-button" onClick={reset}>
              <RotateCcw size={14} />
              RESET SIMULATION
            </button>

            <div className="simulator-safety-note">
              <Activity size={15} />
              <span>
                Virtual simulation only. No physical aircraft
                is connected. Physics are simplified for learning.
              </span>
            </div>

          </div>
        </aside>
      </div>

      {/* LIVE SIMULATION INFORMATION */}
      <div className="simulator-info-grid">

        <div className="panel simulator-info-card">
          <Wind size={19} />
          <div>
            <span>ROTOR STATUS</span>
            <strong>{flying ? "SPINNING" : "IDLE"}</strong>
          </div>
          <span className={`info-indicator ${flying ? "active" : ""}`} />
        </div>

        <div className="panel simulator-info-card">
          <Gauge size={19} />
          <div>
            <span>ALTITUDE</span>
            <strong>{altitude.toFixed(2)} m</strong>
          </div>
        </div>

        <div className="panel simulator-info-card">
          <Activity size={19} />
          <div>
            <span>GROUND SPEED</span>
            <strong>{speed.toFixed(2)} m/s</strong>
          </div>
        </div>

        <div className="panel simulator-info-card">
          <Compass size={19} />
          <div>
            <span>SIMULATED POSITION (X / Z)</span>
            <strong>{position.x.toFixed(1)} / {position.z.toFixed(1)} m</strong>
          </div>
        </div>

        <div className="panel simulator-info-card">
          <Move3D size={19} />
          <div>
            <span>PITCH / ROLL</span>
            <strong>{Math.round(tilt)}° / {Math.round(roll)}°</strong>
          </div>
        </div>

        <div className="panel simulator-info-card">
          <Activity size={19} />
          <div>
            <span>SIMULATED BATTERY</span>
            <strong>{Math.round(batteryPercent)}%</strong>
          </div>
        </div>

      </div>
    </div>
  );
}
