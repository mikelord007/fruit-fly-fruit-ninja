export const DT = 1 / 120;
export const MAX_FORCE = 8;
export const FLY_COUNT = 8;
export const BEAM_LENGTH = 2.8;
export const GRAVITY = 9.81;
export const WORLD_BOUNDS = Object.freeze({ minX: -6, maxX: 6, minY: 0, maxY: 6 });

const HALF_BEAM = BEAM_LENGTH / 2;
const BEAM_RADIUS = 0.08;
const LINEAR_DAMPING = 0.32;
const ANGULAR_DAMPING = 0.5;
const RESTITUTION = 0.18;
const EPSILON = 1e-9;

const finite = (value, fallback = 0) => Number.isFinite(value) ? value : fallback;
const clamp = (value, low, high) => Math.max(low, Math.min(high, value));
const wrapAngle = angle => Math.atan2(Math.sin(angle), Math.cos(angle));

function attachments() {
  return Array.from({ length: FLY_COUNT }, (_, index) =>
    -HALF_BEAM + (BEAM_LENGTH * index) / (FLY_COUNT - 1));
}

export function createWorld(options = {}) {
  const seed = (finite(options.seed, 1) | 0) || 1;
  const mass = Math.max(0.1, finite(options.mass, 1));
  const target = options.target || { x: 3, y: 2 };
  const disabled = new Set(Array.isArray(options.disabled) ? options.disabled : []);
  const flies = attachments().map((attachment, index) => ({
    id: `fly-${index + 1}`,
    index,
    attachment,
    enabled: !disabled.has(index) && !disabled.has(`fly-${index + 1}`),
    fx: 0,
    fy: 0,
  }));

  const x = finite(options.x, 0);
  const y = Math.max(BEAM_RADIUS, finite(options.y, 1));
  const initialDistance = Math.hypot(finite(target.x, 3) - x, finite(target.y, 2) - y);
  return {
    seed,
    x,
    y,
    vx: finite(options.vx, 0),
    vy: finite(options.vy, 0),
    // `tilt` is the initial beam angle; `angle` is retained as an explicit alias.
    angle: wrapAngle(finite(options.angle, finite(options.tilt, 0))),
    omega: finite(options.omega, 0),
    time: 0,
    mass,
    inertia: mass * BEAM_LENGTH * BEAM_LENGTH / 12,
    target: { x: finite(target.x, 3), y: finite(target.y, 2) },
    tilt: wrapAngle(finite(options.angle, finite(options.tilt, 0))),
    flies,
    distance: initialDistance,
    bestDistance: initialDistance,
    stableTime: 0,
    success: false,
    gusts: 0,
  };
}

export function setMass(world, mass) {
  world.mass = Math.max(0.1, finite(mass, world.mass));
  world.inertia = world.mass * BEAM_LENGTH * BEAM_LENGTH / 12;
  return world;
}

function forceFor(forces, index) {
  const input = Array.isArray(forces) ? forces[index] : undefined;
  let fx = finite(input?.fx, 0);
  let fy = finite(input?.fy, 0);
  const magnitude = Math.hypot(fx, fy);
  if (magnitude > MAX_FORCE) {
    const scale = MAX_FORCE / magnitude;
    fx *= scale;
    fy *= scale;
  }
  return { fx, fy };
}

export function stepWorld(world, forces = [], dt = DT) {
  dt = clamp(finite(dt, DT), 1 / 1000, 1 / 20);
  // Keep rotational dynamics consistent if an evaluator changes the payload live.
  setMass(world, world.mass);
  const c = Math.cos(world.angle);
  const s = Math.sin(world.angle);
  let totalFx = 0;
  let totalFy = -world.mass * GRAVITY;
  let torque = 0;

  for (const fly of world.flies) {
    const force = fly.enabled ? forceFor(forces, fly.index) : { fx: 0, fy: 0 };
    fly.fx = force.fx;
    fly.fy = force.fy;
    totalFx += force.fx;
    totalFy += force.fy;
    const rx = fly.attachment * c;
    const ry = fly.attachment * s;
    torque += rx * force.fy - ry * force.fx;
  }

  totalFx -= LINEAR_DAMPING * world.mass * world.vx;
  totalFy -= LINEAR_DAMPING * world.mass * world.vy;
  torque -= ANGULAR_DAMPING * world.inertia * world.omega;

  world.vx += (totalFx / world.mass) * dt;
  world.vy += (totalFy / world.mass) * dt;
  world.omega += (torque / world.inertia) * dt;
  world.x += world.vx * dt;
  world.y += world.vy * dt;
  world.angle = wrapAngle(world.angle + world.omega * dt);

  const extentX = Math.abs(Math.cos(world.angle)) * HALF_BEAM + BEAM_RADIUS;
  const extentY = Math.abs(Math.sin(world.angle)) * HALF_BEAM + BEAM_RADIUS;
  const minX = WORLD_BOUNDS.minX + extentX;
  const maxX = WORLD_BOUNDS.maxX - extentX;
  const minY = WORLD_BOUNDS.minY + extentY;
  const maxY = WORLD_BOUNDS.maxY - extentY;
  // Simplified positional correction and restitution, not a contact-impulse solver.
  if (world.x < minX) { world.x = minX; world.vx = Math.abs(world.vx) * RESTITUTION; world.omega *= 0.65; }
  if (world.x > maxX) { world.x = maxX; world.vx = -Math.abs(world.vx) * RESTITUTION; world.omega *= 0.65; }
  if (world.y < minY) { world.y = minY; world.vy = Math.abs(world.vy) * RESTITUTION; world.omega *= 0.6; }
  if (world.y > maxY) { world.y = maxY; world.vy = -Math.abs(world.vy) * RESTITUTION; world.omega *= 0.65; }

  world.time += dt;
  world.distance = Math.hypot(world.target.x - world.x, world.target.y - world.y);
  world.bestDistance = Math.min(world.bestDistance, world.distance);
  const settled = world.distance < 0.16 && Math.hypot(world.vx, world.vy) < 0.22 &&
    Math.abs(world.angle) < 0.12 && Math.abs(world.omega) < 0.25;
  world.stableTime = settled ? world.stableTime + dt : 0;
  world.success = world.stableTime >= 0.75;
  return world;
}

function solve3(matrix, values) {
  const a = matrix.map((row, i) => [...row, values[i]]);
  for (let col = 0; col < 3; col++) {
    let pivot = col;
    for (let row = col + 1; row < 3; row++) if (Math.abs(a[row][col]) > Math.abs(a[pivot][col])) pivot = row;
    if (Math.abs(a[pivot][col]) < EPSILON) return [0, 0, 0];
    [a[col], a[pivot]] = [a[pivot], a[col]];
    const divisor = a[col][col];
    for (let j = col; j < 4; j++) a[col][j] /= divisor;
    for (let row = 0; row < 3; row++) if (row !== col) {
      const scale = a[row][col];
      for (let j = col; j < 4; j++) a[row][j] -= scale * a[col][j];
    }
  }
  return a.map(row => row[3]);
}

export function baselineForces(world) {
  const enabled = world.flies.filter(fly => fly.enabled);
  const output = world.flies.map(() => ({ fx: 0, fy: 0 }));
  if (!enabled.length) return output;

  const ex = clamp(world.target.x - world.x, -3, 3);
  const ey = clamp(world.target.y - world.y, -3, 3);
  const desiredFx = world.mass * clamp(4.2 * ex - 3.2 * world.vx, -18, 18);
  const desiredFy = world.mass * clamp(GRAVITY + 5.5 * ey - 3.8 * world.vy, -4, 24);
  const angleError = wrapAngle(-world.angle);
  const desiredTorque = world.inertia * clamp(16 * angleError - 6 * world.omega, -18, 18);
  const c = Math.cos(world.angle);
  const s = Math.sin(world.angle);

  // Minimum-norm allocation satisfying total Fx, total Fy, and beam torque.
  let sumRx = 0, sumRy = 0, sumR2 = 0;
  for (const fly of enabled) {
    const rx = fly.attachment * c;
    const ry = fly.attachment * s;
    sumRx += rx; sumRy += ry; sumR2 += rx * rx + ry * ry;
  }
  const n = enabled.length;
  const gram = [[n, 0, -sumRy], [0, n, sumRx], [-sumRy, sumRx, sumR2]];
  const lambda = solve3(gram, [desiredFx, desiredFy, desiredTorque]);
  for (const fly of enabled) {
    const rx = fly.attachment * c;
    const ry = fly.attachment * s;
    output[fly.index] = forceFor([{ fx: lambda[0] - ry * lambda[2], fy: lambda[1] + rx * lambda[2] }], 0);
  }
  return output;
}

export function applyGust(world, strength = 1) {
  // Deterministic impulse from the world's seed and gust counter.
  let state = (world.seed + Math.imul(world.gusts + 1, 0x9e3779b9)) | 0;
  state ^= state << 13; state ^= state >>> 17; state ^= state << 5;
  const unit = (state >>> 0) / 0xffffffff;
  const angle = (unit * 1.5 - 0.25) * Math.PI;
  const impulse = clamp(finite(strength, 1), -20, 20);
  world.vx += Math.cos(angle) * impulse / world.mass;
  world.vy += Math.sin(angle) * impulse / world.mass;
  world.omega += Math.sin(angle * 1.7) * impulse * 0.22 / world.inertia;
  world.gusts += 1;
  return world;
}

// Contract shared with controllers: 15 finite normalized-ish scalar inputs.
export function observations(world, index) {
  const fly = world.flies[index];
  if (!fly) throw new RangeError(`Unknown fly index: ${index}`);
  const enabledCount = world.flies.reduce((sum, item) => sum + Number(item.enabled), 0);
  const activeAttachmentSum = world.flies.reduce((sum, item) => sum + (item.enabled ? item.attachment : 0), 0);
  const activeAttachment2Sum = world.flies.reduce((sum, item) =>
    sum + (item.enabled ? item.attachment * item.attachment : 0), 0);
  return [
    clamp((world.target.x - world.x) / 6, -1, 1),
    clamp((world.target.y - world.y) / 6, -1, 1),
    clamp(world.vx / 8, -1, 1),
    clamp(world.vy / 8, -1, 1),
    Math.sin(world.angle),
    Math.cos(world.angle),
    clamp(world.omega / 8, -1, 1),
    fly.attachment / HALF_BEAM,
    Number(fly.enabled),
    clamp(fly.fx / MAX_FORCE, -1, 1),
    clamp(fly.fy / MAX_FORCE, -1, 1),
    enabledCount / FLY_COUNT,
    clamp(world.mass / 4, 0, 2),
    clamp(activeAttachmentSum / (FLY_COUNT * HALF_BEAM), -1, 1),
    clamp(activeAttachment2Sum / (FLY_COUNT * HALF_BEAM * HALF_BEAM), 0, 1),
  ];
}
