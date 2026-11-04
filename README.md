# DRONE OS

DRONE OS is a browser-based drone ground-control **simulation prototype**. It does not connect to, command, or report telemetry from physical aircraft.

## Current implementation

- React/Vite dashboard with explicitly illustrative demo values.
- 3D quadcopter simulator with keyboard flight controls, bounded educational physics, a procedural training area, orbit/pan/zoom, follow toggle, and recenter.
- Local mission planner with editable waypoints, route preview, reorder/duplicate/delete, and browser-local persistence.
- Local telemetry page backed only by samples emitted from the simulator physics, with a bounded in-session history chart.
- Deterministic local rules assistant for simulation telemetry and physics; selected images remain in-browser as previews and are not analyzed or uploaded.
- Unit tests for core flight-physics bounds.

The map, flight logs, settings, OpenCV processing, and Python backend are not implemented yet. Their navigation entries are marked unavailable rather than showing fabricated records. PX4/MAVLink and real aircraft control are intentionally not implemented.

## Run on Windows

```powershell
cd C:\Users\home\Desktop\DRONE-OS\frontend
npm.cmd install
npm.cmd run dev
```

In another PowerShell window:

```powershell
cd C:\Users\home\Desktop\DRONE-OS\frontend
npm.cmd test
npm.cmd run lint
npm.cmd run build
```

See [installation](./docs/INSTALLATION.md), [architecture](./docs/ARCHITECTURE.md), [controls](./docs/CONTROLS.md), [API status](./docs/API.md), and the [development roadmap](./docs/DEVELOPMENT-ROADMAP.md).
