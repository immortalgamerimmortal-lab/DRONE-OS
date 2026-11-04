export const GROUND_ALTITUDE = 0.65;
export const MAX_ALTITUDE = 4;
export const MAX_HORIZONTAL_SPEED = 4.5;

const clamp = (value, min, max) => Math.min(Math.max(value, min), max);

export function createInitialFlightState() {
  return {
    x: 0,
    y: GROUND_ALTITUDE,
    z: 0,
    vx: 0,
    vy: 0,
    vz: 0,
    yaw: 0,
    pitch: 0,
    roll: 0,
    manualPitch: 0,
    targetAltitude: GROUND_ALTITUDE,
    batteryPercent: 100,
    armed: false
  };
}

export function stepFlightPhysics(state, commands, frameDelta) {
  const dt = Number.isFinite(frameDelta) ? clamp(frameDelta, 0, 0.04) : 0;
  if (dt === 0) return state;

  const numericFields = [
    "x", "y", "z", "vx", "vy", "vz", "yaw",
    "pitch", "roll", "manualPitch", "targetAltitude", "batteryPercent"
  ];
  if (numericFields.some((field) => !Number.isFinite(state[field]))) {
    Object.assign(state, createInitialFlightState());
  }

  const forward = Number.isFinite(commands.forward) ? commands.forward : 0;
  const right = Number.isFinite(commands.right) ? commands.right : 0;
  const vertical = Number.isFinite(commands.vertical) ? commands.vertical : 0;
  const yawCommand = Number.isFinite(commands.yaw) ? commands.yaw : 0;

  if (vertical !== 0) {
    state.targetAltitude = clamp(
      state.targetAltitude + vertical * 1.4 * dt,
      GROUND_ALTITUDE,
      MAX_ALTITUDE
    );
    state.armed = true;
  }

  const liftDemand = state.armed
    ? 9.81 + (state.targetAltitude - state.y) * 5 - state.vy * 3.4
    : 0;
  const verticalAcceleration = clamp(liftDemand, 0, 22) - 9.81;

  state.vy += verticalAcceleration * dt;
  state.y += state.vy * dt;

  if (state.y >= MAX_ALTITUDE) {
    state.y = MAX_ALTITUDE;
    state.vy = Math.min(state.vy, 0);
  }

  if (state.y <= GROUND_ALTITUDE) {
    state.y = GROUND_ALTITUDE;
    if (state.vy < 0) state.vy = 0;

    if (
      state.targetAltitude <= GROUND_ALTITUDE + 0.01 &&
      Math.abs(state.vy) < 0.08
    ) {
      state.targetAltitude = GROUND_ALTITUDE;
      state.armed = false;
      state.vy = 0;
    }
  }

  const activeForward = state.armed ? forward : 0;
  const activeRight = state.armed ? right : 0;
  const acceleration = 3;
  const ax = (
    Math.sin(state.yaw) * activeForward +
    Math.cos(state.yaw) * activeRight
  ) * acceleration;
  const az = (
    -Math.cos(state.yaw) * activeForward +
    Math.sin(state.yaw) * activeRight
  ) * acceleration;

  state.vx += ax * dt;
  state.vz += az * dt;

  const drag = Math.exp(
    (activeForward !== 0 || activeRight !== 0 ? -0.35 : -1.1) * dt
  );
  state.vx *= drag;
  state.vz *= drag;

  const horizontalSpeed = Math.hypot(state.vx, state.vz);
  if (horizontalSpeed > MAX_HORIZONTAL_SPEED) {
    const scale = MAX_HORIZONTAL_SPEED / horizontalSpeed;
    state.vx *= scale;
    state.vz *= scale;
  }

  state.x += state.vx * dt;
  state.z += state.vz * dt;
  state.yaw = Math.atan2(
    Math.sin(state.yaw + yawCommand * 1.4 * dt),
    Math.cos(state.yaw + yawCommand * 1.4 * dt)
  );

  const targetPitch = state.manualPitch + (state.armed ? -activeForward * 0.22 : 0);
  const targetRoll = state.armed ? activeRight * 0.22 : 0;
  const attitudeBlend = Math.min(1, 4 * dt);
  state.pitch += (targetPitch - state.pitch) * attitudeBlend;
  state.roll += (targetRoll - state.roll) * attitudeBlend;
  if (state.armed) {
    state.batteryPercent = Math.max(0, state.batteryPercent - 0.03 * dt);
  }

  if (numericFields.some((field) => !Number.isFinite(state[field]))) {
    Object.assign(state, createInitialFlightState());
  }
  return state;
}
