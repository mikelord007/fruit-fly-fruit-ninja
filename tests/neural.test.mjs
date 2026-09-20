import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import { createWorld, observations } from '../src/physics.js';
import { createSwarm, trainSwarm, controllerAction, serializeSwarm, deserializeSwarm } from '../src/neural.js';

const circuit = JSON.parse(fs.readFileSync(new URL('../data/circuit.json', import.meta.url)));

test('uses unchanged PN-to-KC contacts as a normalized fixed layer', () => {
  const swarm = createSwarm(circuit);
  assert.equal(swarm.topo.pn.length, 124); assert.equal(swarm.topo.kc.length, 192);
  for (const incoming of swarm.topo.incoming) assert.ok(Math.abs(incoming.reduce((s, x) => s + x[1], 0) - 1) < 1e-12);
});

test('agents keep separate activity and readout state', () => {
  const swarm = createSwarm(circuit), obs = observations(createWorld(), 0);
  controllerAction(swarm, obs, 0); controllerAction(swarm, obs, 1);
  assert.notDeepEqual(swarm.agents[0].lastActivity, swarm.agents[1].lastActivity);
  assert.notStrictEqual(swarm.agents[0].readout, swarm.agents[1].readout);
});

test('training is deterministic, finite, serializable, and topology dependent', () => {
  const a = trainSwarm(circuit, { samples: 160, epochs: 2, seed: 22 });
  const b = trainSwarm(circuit, { samples: 160, epochs: 2, seed: 22 });
  assert.deepEqual(serializeSwarm(a).readouts, serializeSwarm(b).readouts);
  assert.ok(Number.isFinite(a.training.finalTrainingMSE));
  const obs = observations(createWorld({ mass: 1.4, tilt: .2 }), 3);
  assert.notDeepEqual(controllerAction(a, obs, 3), controllerAction(a, obs, 3, { ablation: 'clamped' }));
  assert.deepEqual(controllerAction(a, obs, 3), controllerAction(deserializeSwarm(circuit, serializeSwarm(a)), obs, 3));
  const malformed = serializeSwarm(a); malformed.readouts[0][0][0] = NaN;
  assert.throws(() => deserializeSwarm(circuit, malformed), /malformed/);
});
