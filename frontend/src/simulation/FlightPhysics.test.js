import assert from "node:assert/strict";
import test from "node:test";
import {
  createInitialFlightState,
  GROUND_ALTITUDE,
  MAX_ALTITUDE,
  MAX_HORIZONTAL_SPEED,
  stepFlightPhysics
} from "./FlightPhysics.js";

const idleCommands = { forward: 0, right: 0, vertical: 0, yaw: 0 };

test("ground collision prevents downward movement below the landing surface", () => {
  const state = {
    ...createInitialFlightState(),
    y: GROUND_ALTITUDE,
    vy: -2
  };

  stepFlightPhysics(state, idleCommands, 1 / 60);

  assert.equal(state.y, GROUND_ALTITUDE);
  assert.equal(state.vy, 0);
});

test("horizontal velocity remains within the configured maximum", () => {
  const state = {
    ...createInitialFlightState(),
    y: 1.5,
    targetAltitude: 1.5,
    armed: true
  };

  for (let frame = 0; frame < 600; frame += 1) {
    stepFlightPhysics(state, { ...idleCommands, forward: 1 }, 1 / 60);
  }

  assert.ok(Math.hypot(state.vx, state.vz) <= MAX_HORIZONTAL_SPEED);
});

test("takeoff holds altitude and landing settles at the ground", () => {
  const state = createInitialFlightState();

  for (let frame = 0; frame < 60; frame += 1) {
    stepFlightPhysics(state, { ...idleCommands, vertical: 1 }, 1 / 60);
  }
  for (let frame = 0; frame < 600; frame += 1) {
    stepFlightPhysics(state, idleCommands, 1 / 60);
  }

  assert.ok(state.y > GROUND_ALTITUDE + 0.5);
  assert.ok(Math.abs(state.y - state.targetAltitude) < 0.05);

  state.targetAltitude = GROUND_ALTITUDE;
  state.armed = true;
  for (let frame = 0; frame < 1200; frame += 1) {
    stepFlightPhysics(state, idleCommands, 1 / 60);
  }

  assert.equal(state.y, GROUND_ALTITUDE);
  assert.equal(state.armed, false);
});

test("altitude commands and frame-time are bounded", () => {
  const state = {
    ...createInitialFlightState(),
    y: MAX_ALTITUDE - 0.01,
    vy: 2,
    targetAltitude: MAX_ALTITUDE,
    armed: true
  };

  stepFlightPhysics(state, { ...idleCommands, vertical: 1 }, 1);

  assert.ok(state.y <= MAX_ALTITUDE);
  assert.ok(Object.values(state).filter((value) => typeof value === "number").every(Number.isFinite));
});

test("invalid state values are reset to a safe initial state", () => {
  const state = { ...createInitialFlightState(), x: Number.NaN };

  stepFlightPhysics(state, idleCommands, 1 / 60);

  assert.deepEqual(state, createInitialFlightState());
});
