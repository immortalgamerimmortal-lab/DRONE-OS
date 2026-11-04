# Architecture

## Current structure

```text
frontend/
  src/
    App.jsx
    pages/
      MissionPlanner.jsx
      TelemetryPage.jsx
      AssistantPage.jsx
      MapPage.jsx
    simulation/
      DroneSimulator.jsx
      FlightPhysics.js
      FlightPhysics.test.js
    context/
      SimulationTelemetryContext.jsx
```

`App.jsx` owns workspace navigation and the overview demo. `MissionPlanner.jsx` owns route editing and saves missions under the browser local-storage key `drone-os.missions.v1`. `FlightPhysics.js` is a pure, frame-bounded simulation step used by the React Three Fiber scene. `SimulationTelemetryContext.jsx` shares physics-produced samples with `TelemetryPage.jsx` and retains a bounded in-session history.

## Data and safety boundaries

The overview values and route graphics are illustrative demo content, not measurements. The map uses only local X/Z coordinates and never requests the user's location or online tiles. The telemetry page shows only values produced by the local physics simulation; sensor fields the simulator does not produce are marked unavailable. Mission data is browser-local and is not sent to a server. The assistant uses deterministic local rules, and image selection only creates a local preview; there is no configured vision model. Simulator controls affect only the local 3D scene. There is no backend, external telemetry feed, or hardware communication layer in this version.

## Planned separation

Future backend, persistence, telemetry, and computer-vision modules should be introduced as isolated services and schemas. A future vehicle adapter must remain read-only and explicitly configured; browser mission planning must not issue vehicle-control commands.
