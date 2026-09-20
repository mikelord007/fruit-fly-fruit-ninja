import test from 'node:test';
import assert from 'node:assert/strict';
import {
  applyGust, baselineForces, BEAM_LENGTH, createWorld, DT, GRAVITY,
  MAX_FORCE, observations, setMass, stepWorld,
} from '../src/physics.js';

const run = (world, seconds, controller = baselineForces) => {
  for (let i = 0; i < seconds / DT; i++) stepWorld(world, controller(world), DT);
  return world;
};

test('gravity accelerates an unpowered beam downward', () => {
  const world = createWorld({ y: 4 });
  stepWorld(world, [], DT);
  assert.ok(world.vy < -GRAVITY * DT * 0.99);
});

test('off-center force creates torque and bounded fly force', () => {
  const world = createWorld({ y: 3 });
  const forces = world.flies.map(() => ({ fx: Infinity, fy: 0 }));
  forces[7] = { fx: 0, fy: 1e6 };
  stepWorld(world, forces);
  assert.ok(world.omega > 0);
  assert.ok(Math.hypot(world.flies[7].fx, world.flies[7].fy) <= MAX_FORCE + 1e-9);
  assert.equal(world.flies[0].fx, 0);
});

test('floor and walls keep the entire rigid beam in bounds', () => {
  const world = createWorld({ x: 5.9, y: 0.05, vx: 20, vy: -20, angle: 0.5 });
  stepWorld(world, [], 1 / 20);
  const ex = Math.abs(Math.cos(world.angle)) * BEAM_LENGTH / 2 + 0.08;
  const ey = Math.abs(Math.sin(world.angle)) * BEAM_LENGTH / 2 + 0.08;
  assert.ok(world.x + ex <= 6 + 1e-9);
  assert.ok(world.y - ey >= -1e-9);
});

test('world reset and gust sequence are deterministic', () => {
  const a = createWorld({ seed: 42, disabled: [2] });
  const b = createWorld({ seed: 42, disabled: [2] });
  applyGust(a, 2); applyGust(b, 2);
  assert.deepEqual(a, b);
  assert.equal(a.flies[2].enabled, false);
});

test('baseline lifts and carries beam to target', () => {
  const world = run(createWorld(), 8);
  assert.ok(world.distance < 0.25, `distance ${world.distance}`);
  assert.ok(Math.abs(world.angle) < 0.12, `angle ${world.angle}`);
  assert.equal(world.success, true);
});

test('baseline handles two disabled flies and a gust', () => {
  const world = createWorld({ seed: 9, disabled: [1, 6] });
  run(world, 2.5);
  applyGust(world, 1.4);
  run(world, 8);
  assert.ok(world.distance < 0.4, `distance ${world.distance}`);
  assert.ok(world.flies[1].fx === 0 && world.flies[1].fy === 0);
});

test('observation contract is finite, stable, and per-fly', () => {
  const world = createWorld();
  const left = observations(world, 0);
  const right = observations(world, 7);
  assert.equal(left.length, 15);
  assert.ok(left.every(Number.isFinite));
  assert.equal(left[7], -1);
  assert.equal(right[7], 1);
});

test('tilt initializes angle and baseline stabilizes toward level', () => {
  const world = createWorld({ tilt: 0.45, y: 2 });
  assert.equal(world.angle, 0.45);
  run(world, 5);
  assert.ok(Math.abs(world.angle) < 0.08, `angle ${world.angle}`);
});

test('mass edits update inertia consistently', () => {
  const world = createWorld({ mass: 1 });
  setMass(world, 2.5);
  assert.equal(world.inertia, 2.5 * BEAM_LENGTH * BEAM_LENGTH / 12);
  world.mass = 1.7;
  stepWorld(world, [], DT);
  assert.equal(world.inertia, 1.7 * BEAM_LENGTH * BEAM_LENGTH / 12);
});

test('integration converges when timestep is halved', () => {
  const coarse = createWorld({ x: -1, y: 2.5, angle: 0.2, vx: 0.5 });
  const fine = createWorld({ x: -1, y: 2.5, angle: 0.2, vx: 0.5 });
  const fixed = world => world.flies.map(() => ({ fx: 0.12, fy: 1.35 }));
  for (let i = 0; i < 120; i++) stepWorld(coarse, fixed(coarse), 1 / 120);
  for (let i = 0; i < 240; i++) stepWorld(fine, fixed(fine), 1 / 240);
  assert.ok(Math.hypot(coarse.x - fine.x, coarse.y - fine.y) < 0.03);
  assert.ok(Math.abs(coarse.angle - fine.angle) < 0.02);
});

test('integrator never writes pose from target directly', () => {
  const a = createWorld({ target: { x: -5, y: 5 }, y: 3 });
  const b = createWorld({ target: { x: 5, y: 1 }, y: 3 });
  stepWorld(a, [], DT); stepWorld(b, [], DT);
  for (const key of ['x', 'y', 'vx', 'vy', 'angle', 'omega']) assert.equal(a[key], b[key]);
});
