import test from 'node:test';
import assert from 'node:assert/strict';
import * as THREE from '../vendor/three/three.module.js';
import { buildKitchenScene, syncWorldScene, pickRayFly } from '../src/scene3d.js';

const makeWorld = () => ({
  x: 1.25, y: 2.4, angle: .3, time: 1.5, mass: 1,
  target: { x: -2, y: 3.2 },
  flies: Array.from({ length: 8 }, (_, index) => ({
    index, attachment: -1.4 + index * .4, enabled: index !== 5, fx: index - 3, fy: index + 1,
  })),
});

test('kitchen scene has a real 3D beam, eight flies, and target marker', () => {
  const model = buildKitchenScene();
  assert.equal(model.flies.length, 8);
  assert.equal(model.forceArrows.length, 8);
  assert.equal(model.beam.geometry.type, 'ExtrudeGeometry');
  assert.equal(model.scene.getObjectByName('Cream tiled back wall').isMesh, true);
  assert.equal(model.scene.getObjectByName('Goal plate and target ring').isGroup, true);
});

test('world synchronization preserves exact planar pose and never mutates physics state', () => {
  const model = buildKitchenScene();
  const world = makeWorld();
  const before = structuredClone(world);
  syncWorldScene(model, world, { mission: 'carry', selected: 3 });
  assert.deepEqual(world, before);
  assert.deepEqual(model.beamRig.position.toArray(), [world.x, world.y, 0]);
  assert.equal(model.beamRig.rotation.z, world.angle);
  world.flies.forEach((fly, index) => assert.equal(model.flies[index].position.x, fly.attachment));
  assert.equal(model.highlights[3].visible, true);
  assert.equal(model.pea.visible, true);
  assert.equal(model.stem.visible, true);
  assert.equal(model.flies[5].visible, true);
  assert.equal(model.flies[5].scale.x, .82);
  assert.equal(model.forceArrows[7].visible, true);
  assert.ok(model.forceArrows[7].quaternion.z < 0, 'positive world-X force tilts arrow right from world-Y');
  assert.deepEqual(model.goal.position.toArray(), [world.target.x, world.target.y, .02]);
});

test('balance mission hides the whole pea payload', () => {
  const model = buildKitchenScene();
  syncWorldScene(model, makeWorld(), { mission: 'balance' });
  assert.equal(model.pea.visible, false);
  assert.equal(model.stem.visible, false);
});

test('fly ray picking ignores unindexed decorative lines and selects fly volume', () => {
  const model = buildKitchenScene();
  const world = makeWorld();
  syncWorldScene(model, world);
  model.scene.updateMatrixWorld(true);
  const fly = model.flies[6];
  const point = new THREE.Vector3();
  fly.getWorldPosition(point);
  const raycaster = new THREE.Raycaster(new THREE.Vector3(point.x, point.y, 5), new THREE.Vector3(0, 0, -1));
  assert.equal(pickRayFly(model, raycaster), 6);
  raycaster.set(new THREE.Vector3(10, 10, 5), new THREE.Vector3(0, 0, -1));
  assert.equal(pickRayFly(model, raycaster), null);
});
