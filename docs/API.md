# API status

There is currently no FastAPI backend and no HTTP or WebSocket API. The frontend works without a server; mission records are saved in browser local storage.

The following endpoints are planned but do not exist yet:

| Method | Path | Planned purpose |
|---|---|---|
| GET | `/api/health` | Backend health |
| GET | `/api/telemetry` | Clearly identified simulation telemetry |
| GET, POST | `/api/missions` | Persist and list missions |
| PUT, DELETE | `/api/missions/{mission_id}` | Update or remove a mission |
| GET | `/api/flights` | Retrieve saved simulation sessions |
| GET | `/api/simulation/status` | Report local simulation status |
| WebSocket | `/ws/telemetry` | Stream simulated telemetry |

No values should be treated as live aircraft telemetry until a separately configured, validated telemetry source exists. No aircraft command endpoint is planned.
