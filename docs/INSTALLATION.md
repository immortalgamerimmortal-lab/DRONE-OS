# Installation

## Requirements

- Windows with Node.js and npm installed.
- PowerShell.

## Start the frontend

```powershell
cd C:\Users\home\Desktop\DRONE-OS\frontend
npm.cmd install
npm.cmd run dev
```

Open the local URL printed by Vite. No API credentials, map token, or aircraft connection is required.

## Validate

```powershell
npm.cmd test
npm.cmd run lint
npm.cmd run build
```

The project currently contains no Python backend. Backend startup and database configuration are not available.

## Troubleshooting

- If `npm.cmd` is not found, install Node.js and reopen PowerShell.
- If Vite reports a port conflict, use the alternative local URL it prints.
- Missions are stored in the current browser profile. Clearing browser storage removes those locally saved missions.
- The simulator is a simplified educational model and is not suitable for real aircraft operation.
