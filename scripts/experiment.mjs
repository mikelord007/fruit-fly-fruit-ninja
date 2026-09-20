import fs from 'node:fs';
import { fileURLToPath } from 'node:url';
import { createWorld, stepWorld, baselineForces, observations, applyGust, MAX_FORCE } from '../src/physics.js';
import { createSwarm, trainSwarm, swarmForces, serializeSwarm } from '../src/neural.js';

const root = fileURLToPath(new URL('..', import.meta.url));
const circuit = JSON.parse(fs.readFileSync(`${root}/data/circuit.json`));
const progress = [], trainStart = performance.now();
const swarm = trainSwarm(circuit, { seed: 7401 }, p => progress.push(p));
const trainingMilliseconds = performance.now() - trainStart;

// Deliberately simpler comparator: direct affine readout from the 15 observations.
function trainLinear() {
  const weights = Array.from({ length: 8 }, () => [new Array(16).fill(0), new Array(16).fill(0)]);
  let state = 991;
  const random = () => ((state = Math.imul(state, 1664525) + 1013904223 >>> 0) / 4294967296);
  for (let t = 0; t < 5000; t++) {
    const w = createWorld({ seed: 3000 + t, mass: .55 + random() * 2.2, x: (random() - .5) * 7, y: .4 + random() * 4.8,
      vx: (random() - .5) * 5, vy: (random() - .5) * 4, tilt: (random() - .5) * 1.4, omega: (random() - .5) * 4,
      target: { x: (random() - .5) * 7, y: .8 + random() * 4.2 }, disabled: random() < .35 ? [Math.floor(random() * 8)] : [] });
    const target = baselineForces(w);
    for (let i = 0; i < 8; i++) { const x = [...observations(w, i), 1]; for (let d = 0; d < 2; d++) {
      const y = (d ? target[i].fy : target[i].fx) / MAX_FORCE, row = weights[i][d];
      const err = row.reduce((s, q, j) => s + q * x[j], 0) - y;
      for (let j = 0; j < row.length; j++) row[j] -= .018 * (err * x[j] + .0002 * row[j]);
    }}
  }
  return weights;
}
const linearWeights = trainLinear();
const linearForces = world => world.flies.map((_, i) => { const x = [...observations(world, i), 1]; return {
  fx: MAX_FORCE * Math.max(-1, Math.min(1, linearWeights[i][0].reduce((s, q, j) => s + q * x[j], 0))),
  fy: MAX_FORCE * Math.max(-1, Math.min(1, linearWeights[i][1].reduce((s, q, j) => s + q * x[j], 0))) } });

const seeds = Array.from({ length: 20 }, (_, i) => 19001 + i); // frozen after model selection on 9001-series
const scenarios = seeds.map((seed, i) => ({ group: 'held-out interpolation', seed, mass: .65 + (i % 6) * .34, tilt: ((i % 7) - 3) * .12,
  target: { x: i % 2 ? 3 : -3, y: 1.4 + (i % 5) * .55 }, disabled: i % 4 === 0 ? [i % 8] : [] }));
scenarios.push(...Array.from({ length: 4 }, (_, i) => ({ group: 'stress extrapolation', seed: 19101 + i, mass: 3 + i * .35,
  tilt: i % 2 ? .9 : -.9, target: { x: i % 2 ? 3.5 : -3.5, y: 3.1 }, disabled: [i, 7 - i] })));
const variants = ['learned', 'untrained', 'reset', 'clamped', 'scrambled', 'pd', 'linear'];
const raw = Object.fromEntries(variants.map(v => [v, []]));

function run(config, variant) {
  const world = createWorld(config), blank = createSwarm(circuit, { seed: 7401 });
  let invalid = false;
  for (let t = 0; t < 1440; t++) {
    if (t === 300 || t === 780) applyGust(world, .65 + (config.seed % 4) * .2);
    let forces;
    if (variant === 'pd') forces = baselineForces(world);
    else if (variant === 'linear') forces = linearForces(world);
    else forces = swarmForces(variant === 'untrained' || variant === 'reset' ? blank : swarm, world,
      variant === 'clamped' || variant === 'scrambled' ? { ablation: variant } : {});
    stepWorld(world, forces);
    invalid ||= ![world.x, world.y, world.vx, world.vy, world.angle, world.omega].every(Number.isFinite);
  }
  return { group: config.group, seed: config.seed, success: world.success, finalDistance: world.distance, bestDistance: world.bestDistance,
    finalTiltAbs: Math.abs(world.angle), invalid, groundContact: world.y < .12 };
}
const inferenceStart = performance.now();
for (const scenario of scenarios) for (const variant of variants) raw[variant].push(run(scenario, variant));
const evaluationMilliseconds = performance.now() - inferenceStart;
const summarize = rows => ({ trials: rows.length, successes: rows.filter(x => x.success).length,
  failures: rows.filter(x => !x.success).length, invalidRuns: rows.filter(x => x.invalid).length,
  groundContacts: rows.filter(x => x.groundContact).length,
  finalDistance: distribution(rows.map(x => x.finalDistance)), bestDistance: distribution(rows.map(x => x.bestDistance)),
  finalTiltAbs: distribution(rows.map(x => x.finalTiltAbs)) });
function distribution(a) { const s = [...a].sort((x, y) => x - y), mean = a.reduce((x, y) => x + y, 0) / a.length;
  const mid = Math.floor(s.length / 2), median = s.length % 2 ? s[mid] : (s[mid - 1] + s[mid]) / 2;
  return { mean, median, min: s[0], max: s.at(-1), values: a }; }

const result = { schemaVersion: 1, generatedAt: new Date().toISOString(), frozenEvaluation: true,
  disclosure: 'The PN→KC layer uses normalized raw anatomical contact counts without changing strengths. Observation encoding, signed activations, nonlinearity, and action readouts are engineered. Only readouts are trained by supervised imitation; this is not anatomical plasticity or evidence that this wiring is superior.',
  modelSelection: { tuningSeeds: '9001-9020', exploratoryAdam: { successes: 0, trials: 20, meanFinalDistance: 3.1315454234975073, trainingMSE: 0.08280653751974652 },
    decision: 'Replaced Adam with ridge regression and strengthened deterministic encoder hash mixing before freezing final evaluation.' },
  training: { ...swarm.training, elapsedMilliseconds: trainingMilliseconds }, evaluation: { seeds, stressSeeds: [19101, 19102, 19103, 19104], durationSeconds: 12, steps: 1440,
    gustSteps: [300, 780], scenarioCount: scenarios.length, elapsedMilliseconds: evaluationMilliseconds, scenarios,
    note: 'Twenty scenarios are held-out samples within training ranges; four are explicit mass/tilt/two-disabled-agent stress extrapolations.' },
  comparatorDisclosure: 'The linear comparator used 5,000 independent random-state samples, while the connectome readout used 1,200 random states plus 1,200 teacher roll-out states per agent. Training protocols are unmatched, so their difference does not establish wiring superiority.',
  summary: Object.fromEntries(variants.map(v => [v, summarize(raw[v])])),
  summaryByGroup: Object.fromEntries(variants.map(v => [v, {
    heldOutInterpolation: summarize(raw[v].filter(x => x.group === 'held-out interpolation')),
    stressExtrapolation: summarize(raw[v].filter(x => x.group === 'stress extrapolation'))
  }])), trials: raw };
fs.mkdirSync(`${root}/evidence`, { recursive: true });
fs.writeFileSync(`${root}/evidence/trained-session.json`, JSON.stringify(serializeSwarm(swarm)));
fs.writeFileSync(`${root}/evidence/experiment-results.json`, JSON.stringify(result, null, 2));
console.log(JSON.stringify({ trainingMSE: swarm.training.finalTrainingMSE, summary: result.summary }, null, 2));
