# Development roadmap

## Implemented in this milestone

- Repair the duplicate simulator icon imports.
- Extract a bounded educational flight-physics step and add tests for ground collision, maximum speed, altitude, and invalid state recovery.
- Add camera follow toggle, recenter, simulated position/attitude/speed telemetry, and a procedural local training area.
- Make the mobile navigation menu functional.
- Clearly mark overview values as demo data.
- Add a browser-local mission planner with waypoint editing, ordering, route preview, and mission duplication/deletion.
- Add telemetry cards and an in-session chart backed exclusively by physics samples.
- Add a deterministic local rules assistant with safe, local image preview and no unsupported detection claims.

## Remaining work

1. Run frontend tests, lint, and production build in an environment with PowerShell/Node command execution.
2. Implement connected map and map fallback controls.
3. Add a configured backend telemetry connection and persistent historical charts.
4. Add flight-session persistence, logs, export, and analytics.
5. Build the isolated FastAPI/SQLite backend and API/WebSocket tests.
6. Add optional local OpenCV image processing with explicit model/configuration status.
7. Implement settings, notifications, and their persistence.
8. Add browser-level responsive and camera/keyboard interaction tests.

Physical-drone control, autonomous real-world execution, and automatic connection to aircraft are outside scope.
