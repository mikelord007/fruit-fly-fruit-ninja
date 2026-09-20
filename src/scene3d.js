import * as THREE from '../vendor/three/three.module.js';
import { OrbitControls } from '../vendor/three/OrbitControls.js';

const BEAM_LENGTH = 2.8;
const COLORS = {
  cream: 0xfff6df, teal: 0x0b7771, darkTeal: 0x174845, terracotta: 0xe9774f,
  wood: 0xa96d43, woodDark: 0x70442f, pea: 0x76a943, brass: 0xd3a144,
};

const matte = (color, roughness = .72, metalness = .02) =>
  new THREE.MeshStandardMaterial({ color, roughness, metalness });

function mesh(geometry, material, name) {
  const value = new THREE.Mesh(geometry, material);
  value.name = name;
  value.castShadow = true;
  value.receiveShadow = true;
  return value;
}

function roundedBox(width, height, depth, radius = .08) {
  const shape = new THREE.Shape();
  const x = -width / 2, y = -height / 2, r = Math.min(radius, width / 2, height / 2);
  shape.moveTo(x + r, y); shape.lineTo(x + width - r, y); shape.quadraticCurveTo(x + width, y, x + width, y + r);
  shape.lineTo(x + width, y + height - r); shape.quadraticCurveTo(x + width, y + height, x + width - r, y + height);
  shape.lineTo(x + r, y + height); shape.quadraticCurveTo(x, y + height, x, y + height - r);
  shape.lineTo(x, y + r); shape.quadraticCurveTo(x, y, x + r, y);
  const geometry = new THREE.ExtrudeGeometry(shape, { depth, bevelEnabled: true, bevelSize: .025, bevelThickness: .025, bevelSegments: 3 });
  geometry.center();
  return geometry;
}

function addKitchen(scene) {
  const kitchen = new THREE.Group();
  kitchen.name = 'Kitchen diorama';
  scene.add(kitchen);

  const wall = mesh(new THREE.PlaneGeometry(15, 8), matte(0xfff2d2), 'Cream tiled back wall');
  wall.position.set(0, 3, -3.5); kitchen.add(wall);
  const grout = new THREE.LineBasicMaterial({ color: 0xd5cbb6, transparent: true, opacity: .46 });
  const groutPositions = [];
  for (let x = -7; x <= 7; x += 1) groutPositions.push(x, -.4, -3.46, x, 7, -3.46);
  for (let y = 0; y <= 7; y += 1) groutPositions.push(-7, y, -3.46, 7, y, -3.46);
  const groutGeometry = new THREE.BufferGeometry(); groutGeometry.setAttribute('position', new THREE.Float32BufferAttribute(groutPositions, 3));
  kitchen.add(new THREE.LineSegments(groutGeometry, grout));

  const counter = mesh(roundedBox(14, .55, 3.8, .14), matte(COLORS.wood, .52), 'Wooden countertop');
  counter.position.set(0, -.38, -1.4); kitchen.add(counter);
  const edge = mesh(roundedBox(14.15, .2, 3.92, .08), matte(COLORS.woodDark, .5), 'Countertop beveled edge');
  edge.position.set(0, -.14, -1.38); kitchen.add(edge);
  const cabinetMat = matte(0x176c68, .75);
  for (let x = -5.4; x <= 5.4; x += 2.7) {
    const cabinet = mesh(roundedBox(2.52, 2.4, .22, .09), cabinetMat, 'Teal cabinet');
    cabinet.position.set(x, -1.75, -2.95); kitchen.add(cabinet);
    const pull = mesh(new THREE.CapsuleGeometry(.045, .3, 4, 8), matte(COLORS.brass, .3, .6), 'Cabinet pull');
    pull.rotation.z = Math.PI / 2; pull.position.set(x, -.95, -2.8); kitchen.add(pull);
  }

  const windowFrame = mesh(roundedBox(3.5, 2.25, .14, .08), matte(0xf9e5b7), 'Sunny window frame');
  windowFrame.position.set(-3.8, 4.25, -3.25); kitchen.add(windowFrame);
  const glass = mesh(new THREE.PlaneGeometry(3.08, 1.84), new THREE.MeshBasicMaterial({ color: 0xaedee0 }), 'Window sky');
  glass.position.set(-3.8, 4.25, -3.15); kitchen.add(glass);
  for (const [sx, sy] of [[-3.8, 4.25], [-3.8, 3.34], [-3.8, 5.16]]) {
    const bar = mesh(new THREE.BoxGeometry(sy === 4.25 ? .1 : 3.12, sy === 4.25 ? 1.88 : .09, .12), matte(0xffedc7), 'Window muntin');
    bar.position.set(sx, sy, -3.02); kitchen.add(bar);
  }

  const shelf = mesh(roundedBox(4.3, .16, .72, .05), matte(COLORS.woodDark), 'Kitchen shelf');
  shelf.position.set(3.45, 4.6, -2.98); kitchen.add(shelf);
  [-1.2, 1.2].forEach(dx => {
    const bracket = mesh(new THREE.BoxGeometry(.1, .65, .1), matte(COLORS.brass, .3, .5), 'Shelf bracket');
    bracket.position.set(3.45 + dx, 4.28, -3.05); kitchen.add(bracket);
  });
  const accentColors = [COLORS.terracotta, 0xf3c767, COLORS.teal];
  for (let i = 0; i < 3; i++) {
    const jar = mesh(new THREE.CylinderGeometry(.25, .28, .62, 18), matte(accentColors[i]), `Shelf jar ${i + 1}`);
    jar.position.set(2.2 + i * .75, 5, -2.88); kitchen.add(jar);
    const lid = mesh(new THREE.CylinderGeometry(.23, .23, .07, 18), matte(COLORS.brass, .35, .4), 'Jar lid');
    lid.position.set(jar.position.x, 5.34, -2.88); kitchen.add(lid);
  }
  const mug = mesh(new THREE.CylinderGeometry(.27, .23, .55, 18), matte(0xf5d3c1), 'Shelf mug');
  mug.position.set(4.65, 4.95, -2.88); kitchen.add(mug);
  const handle = mesh(new THREE.TorusGeometry(.22, .045, 8, 18, Math.PI * 1.55), matte(0xf5d3c1), 'Mug handle');
  handle.rotation.y = Math.PI / 2; handle.position.set(4.92, 5, -2.88); kitchen.add(handle);
  const pot = mesh(new THREE.CylinderGeometry(.34, .27, .38, 18), matte(COLORS.terracotta), 'Plant pot');
  pot.position.set(5.65, .22, -2.7); kitchen.add(pot);
  for (let i = 0; i < 6; i++) {
    const leaf = mesh(new THREE.SphereGeometry(.18, 10, 8), matte(0x5c944f), 'Plant leaf');
    leaf.scale.set(.7, 1.8, .45); leaf.rotation.z = (i - 2.5) * .25; leaf.position.set(5.65 + (i - 2.5) * .1, .75 + (i % 2) * .2, -2.7); kitchen.add(leaf);
  }
  return kitchen;
}

function buildFly(index) {
  const fly = new THREE.Group(); fly.name = `Fly ${index + 1}`; fly.userData.flyIndex = index;
  const bodyMat = matte(index % 2 ? 0x32302d : 0x3d3833, .45);
  const abdomen = mesh(new THREE.SphereGeometry(.105, 16, 12), bodyMat, 'Abdomen'); abdomen.scale.set(1.35, .75, .72); fly.add(abdomen);
  const thorax = mesh(new THREE.SphereGeometry(.09, 14, 10), matte(0x211f1d, .4), 'Thorax'); thorax.position.x = -.13; fly.add(thorax);
  const head = mesh(new THREE.SphereGeometry(.072, 14, 10), matte(0x37322d, .5), 'Head'); head.position.x = -.23; fly.add(head);
  const eyeMat = new THREE.MeshStandardMaterial({ color: 0xb51f2d, emissive: 0x4a0409, emissiveIntensity: .5, roughness: .3 });
  for (const z of [-.055, .055]) { const eye = mesh(new THREE.SphereGeometry(.035, 10, 8), eyeMat, 'Red compound eye'); eye.position.set(-.27, .018, z); fly.add(eye); }
  const wingMat = new THREE.MeshPhysicalMaterial({ color: 0xd9f5ed, transparent: true, opacity: .48, roughness: .18, transmission: .12, side: THREE.DoubleSide, depthWrite: false });
  const wings = [];
  for (const [side, z] of [[-1, -.06], [1, .06]]) {
    const pivot = new THREE.Group(); pivot.position.set(-.03, .03, z); fly.add(pivot);
    const wing = mesh(new THREE.CircleGeometry(.13, 18), wingMat, 'Translucent wing'); wing.scale.set(1.8, .58, 1); wing.position.x = .11; wing.rotation.y = Math.PI / 2; pivot.rotation.x = side * .45; pivot.add(wing); wings.push(pivot);
  }
  const legMat = new THREE.LineBasicMaterial({ color: 0x29221d, transparent: true, opacity: .9 });
  for (let i = 0; i < 3; i++) {
    const positions = new Float32Array([-.08 + i * .07, -.04, -.05, -.1 + i * .07, -.13, -.12, -.02 + i * .08, -.2, -.18]);
    const geometry = new THREE.BufferGeometry(); geometry.setAttribute('position', new THREE.BufferAttribute(positions, 3));
    const legs = new THREE.Line(geometry, legMat); fly.add(legs);
    const mirror = legs.clone(); mirror.scale.z = -1; fly.add(mirror);
  }
  fly.traverse(child => {
    if (child.isMesh) child.userData.flyIndex = index;
    if (child.material) child.material.transparent = true;
  });
  fly.userData.wings = wings; return fly;
}

function targetMarker() {
  const target = new THREE.Group(); target.name = 'Goal plate and target ring';
  const stand = mesh(new THREE.CylinderGeometry(.08, .13, .32, 16), matte(COLORS.brass, .38, .45), 'Goal stand'); stand.position.y = -.2; target.add(stand);
  const plate = mesh(new THREE.CylinderGeometry(.44, .38, .055, 32), matte(0xfffdf4, .42), 'Goal plate'); plate.position.set(0, -.18, 0); target.add(plate);
  const ring = mesh(new THREE.TorusGeometry(.34, .027, 10, 40), new THREE.MeshStandardMaterial({ color: COLORS.teal, emissive: COLORS.teal, emissiveIntensity: .18 }), 'Target ring'); target.add(ring);
  const halo = mesh(new THREE.TorusGeometry(.48, .012, 8, 48), new THREE.MeshBasicMaterial({ color: COLORS.terracotta, transparent: true, opacity: .48 }), 'Target halo'); target.add(halo);
  return target;
}

export function buildKitchenScene() {
  const scene = new THREE.Scene(); scene.name = 'Fly Swarm Kitchen 3D'; scene.background = new THREE.Color(0xf9ecd0); scene.fog = new THREE.Fog(0xf9ecd0, 12, 23);
  addKitchen(scene);
  const hemi = new THREE.HemisphereLight(0xfff7df, 0x164c4a, 2.15); hemi.name = 'Warm hemisphere light'; scene.add(hemi);
  const sun = new THREE.DirectionalLight(0xffe2aa, 3.2); sun.name = 'Window sunlight'; sun.position.set(-5, 8, 7); sun.castShadow = true;
  sun.shadow.mapSize.set(1024, 1024); sun.shadow.camera.left = -7; sun.shadow.camera.right = 7; sun.shadow.camera.top = 7; sun.shadow.camera.bottom = -2; scene.add(sun);

  const dynamic = new THREE.Group(); dynamic.name = 'Planar physics objects'; scene.add(dynamic);
  const beamRig = new THREE.Group(); beamRig.name = 'Beam rig'; dynamic.add(beamRig);
  const beam = mesh(roundedBox(BEAM_LENGTH, .16, .24, .07), matte(COLORS.wood, .48), '2.8-unit carrying beam'); beamRig.add(beam);
  const grainMat = new THREE.LineBasicMaterial({ color: 0x71442e, transparent: true, opacity: .33 });
  for (let i = -5; i <= 5; i++) { const grainGeo = new THREE.BufferGeometry().setFromPoints([new THREE.Vector3(i * .22, -.04, .125), new THREE.Vector3(i * .22 + .14, .035, .125)]); beamRig.add(new THREE.Line(grainGeo, grainMat)); }
  const pea = mesh(new THREE.SphereGeometry(.2, 24, 16), matte(COLORS.pea, .58), 'Pea payload'); pea.position.set(0, .26, 0); beamRig.add(pea);
  const stem = mesh(new THREE.CylinderGeometry(.018, .025, .13, 8), matte(0x426d2f), 'Pea stem'); stem.position.set(.02, .45, 0); stem.rotation.z = -.25; beamRig.add(stem);
  const flies = [], tethers = [], forceArrows = [], highlights = [];
  for (let i = 0; i < 8; i++) {
    const tetherGeometry = new THREE.BufferGeometry().setFromPoints([new THREE.Vector3(), new THREE.Vector3(0, .37, 0)]);
    const tether = new THREE.Line(tetherGeometry, new THREE.LineBasicMaterial({ color: COLORS.darkTeal, transparent: true, opacity: .46 })); tether.name = `Fly ${i + 1} tether`; beamRig.add(tether); tethers.push(tether);
    const fly = buildFly(i); beamRig.add(fly); flies.push(fly);
    const arrow = new THREE.ArrowHelper(new THREE.Vector3(0, 1, 0), new THREE.Vector3(), .3, i % 2 ? COLORS.teal : COLORS.terracotta, .12, .07); arrow.name = `Fly ${i + 1} world force`; dynamic.add(arrow); forceArrows.push(arrow);
    const highlight = mesh(new THREE.TorusGeometry(.2, .018, 8, 28), new THREE.MeshBasicMaterial({ color: 0xffc648, transparent: true, opacity: .92 }), `Fly ${i + 1} selection`); highlight.visible = false; fly.add(highlight); highlights.push(highlight);
  }
  const goal = targetMarker(); dynamic.add(goal);
  const model = { scene, dynamic, beamRig, beam, pea, stem, flies, tethers, forceArrows, highlights, goal };
  scene.userData.kitchenModel = model;
  return model;
}

export function syncWorldScene(sceneModel, world, { mission = 'balance', selected = -1, paused = false } = {}) {
  if (!sceneModel || !world) return sceneModel;
  const { beamRig, pea, stem, flies, tethers, forceArrows, highlights, goal } = sceneModel;
  beamRig.position.set(Number(world.x) || 0, Number(world.y) || 0, 0);
  beamRig.rotation.set(0, 0, Number(world.angle) || 0);
  pea.visible = mission === 'carry'; stem.visible = mission === 'carry'; goal.position.set(Number(world.target?.x) || 0, Number(world.target?.y) || 0, .02);
  goal.children[1].visible = mission === 'carry';
  goal.children[3].rotation.z = (Number(world.time) || 0) * .6;
  const c = Math.cos(Number(world.angle) || 0), s = Math.sin(Number(world.angle) || 0);
  flies.forEach((fly, index) => {
    const state = world.flies?.[index] || {};
    const attachment = Number.isFinite(state.attachment) ? state.attachment : -1.4 + index * .4;
    const bob = Math.sin((Number(world.time) || 0) * 9 + index * 1.7) * .035;
    fly.position.set(attachment, .45 + bob, (index % 2 ? 1 : -1) * .075);
    fly.rotation.z = -.08 * Math.sin((Number(world.time) || 0) * 5 + index);
    fly.visible = true; fly.scale.setScalar(state.enabled === false ? .82 : 1);
    fly.traverse(child => { if (child.material && 'opacity' in child.material) child.material.opacity = state.enabled === false ? .24 : (child.name === 'Translucent wing' ? .48 : 1); });
    const wingPhase = Math.sin((Number(world.time) || 0) * 46 + index * 2.1);
    fly.userData.wings.forEach((wing, side) => { wing.rotation.x = (side ? 1 : -1) * (.28 + wingPhase * .48); });
    const tetherPos = tethers[index].geometry.attributes.position;
    tetherPos.setXYZ(0, attachment, .08, 0); tetherPos.setXYZ(1, attachment, .39 + bob, (index % 2 ? 1 : -1) * .075); tetherPos.needsUpdate = true;
    highlights[index].visible = index === selected;
    highlights[index].rotation.z = -(Number(world.time) || 0) * 1.4;
    const fx = state.enabled === false ? 0 : Number(state.fx) || 0, fy = state.enabled === false ? 0 : Number(state.fy) || 0;
    const magnitude = Math.hypot(fx, fy);
    const localX = attachment, localY = .52 + bob;
    forceArrows[index].position.set((Number(world.x) || 0) + c * localX - s * localY, (Number(world.y) || 0) + s * localX + c * localY, fly.position.z);
    forceArrows[index].visible = magnitude > .05;
    if (magnitude > .05) { forceArrows[index].setDirection(new THREE.Vector3(fx / magnitude, fy / magnitude, 0)); forceArrows[index].setLength(Math.min(.78, .12 + magnitude * .075), .13, .075); forceArrows[index].setColor(new THREE.Color(fx < 0 ? COLORS.teal : COLORS.terracotta)); }
  });
  return sceneModel;
}

export function pickRayFly(sceneModel, raycaster) {
  if (!sceneModel?.flies || !raycaster?.intersectObjects) return null;
  const hit = raycaster.intersectObjects(sceneModel.flies, true)
    .find(candidate => Number.isInteger(candidate.object?.userData?.flyIndex));
  return hit ? hit.object.userData.flyIndex : null;
}

function presetCamera(camera, controls, name = 'angled') {
  const front = name === 'front';
  camera.position.set(front ? 0 : 5.9, front ? 2.6 : 3.7, front ? 10.8 : 9.7);
  controls.target.set(0, 2.25, 0); controls.update();
}

export function createKitchenView(canvas, { onTarget, onSelectFly, onError } = {}) {
  if (!canvas || typeof canvas.getContext !== 'function') throw new TypeError('createKitchenView requires a canvas element');
  let renderer;
  try {
    renderer = new THREE.WebGLRenderer({ canvas, antialias: true, alpha: false, powerPreference: 'high-performance' });
  } catch (error) {
    onError?.(new Error(`The 3D kitchen could not start: ${error?.message || 'WebGL is unavailable'}`));
    throw error;
  }
  renderer.setPixelRatio(Math.min(globalThis.devicePixelRatio || 1, 2)); renderer.shadowMap.enabled = true; renderer.shadowMap.type = THREE.PCFShadowMap;
  renderer.outputColorSpace = THREE.SRGBColorSpace; renderer.toneMapping = THREE.ACESFilmicToneMapping; renderer.toneMappingExposure = 1.08;
  const model = buildKitchenScene(), scene = model.scene;
  const camera = new THREE.PerspectiveCamera(38, 1, .1, 50);
  const controls = new OrbitControls(camera, canvas); controls.enableDamping = true; controls.dampingFactor = .075; controls.minDistance = 6; controls.maxDistance = 17;
  controls.minDistance = 3.5; controls.minPolarAngle = .55; controls.maxPolarAngle = 1.62; controls.minAzimuthAngle = -1.4; controls.maxAzimuthAngle = 1.4; controls.target.set(0, 2.25, 0); presetCamera(camera, controls, 'angled');
  const raycaster = new THREE.Raycaster(), pointer = new THREE.Vector2(), targetPlane = new THREE.Plane(new THREE.Vector3(0, 0, 1), 0);
  let currentWorld, currentOptions = {}, disposed = false, pointerStart;
  const eventPoint = (clientX, clientY) => { const r = canvas.getBoundingClientRect(); pointer.set(((clientX - r.left) / r.width) * 2 - 1, -((clientY - r.top) / r.height) * 2 + 1); raycaster.setFromCamera(pointer, camera); };
  const pickTarget = (clientX, clientY) => { eventPoint(clientX, clientY); const point = new THREE.Vector3(); return raycaster.ray.intersectPlane(targetPlane, point) ? { x: THREE.MathUtils.clamp(point.x, -4.4, 4.4), y: THREE.MathUtils.clamp(point.y, .2, 4.5) } : null; };
  const pickFly = (clientX, clientY) => { eventPoint(clientX, clientY); return pickRayFly(model, raycaster); };
  const click = event => { if (pointerStart && Math.hypot(event.clientX - pointerStart.x, event.clientY - pointerStart.y) > 5) return; const index = pickFly(event.clientX, event.clientY); if (index != null) onSelectFly?.(index); else if (canvas.dataset.targetMode === 'true') { const target = pickTarget(event.clientX, event.clientY); if (target) onTarget?.(target); } };
  const dblclick = event => { const target = pickTarget(event.clientX, event.clientY); if (target) onTarget?.(target); };
  const lost = event => { event.preventDefault(); onError?.(new Error('The WebGL context was lost. Reload the page or use the preserved 2D view.')); };
  const pointerdown = event => { pointerStart = { x: event.clientX, y: event.clientY }; };
  canvas.addEventListener('pointerdown', pointerdown); canvas.addEventListener('click', click); canvas.addEventListener('dblclick', dblclick); canvas.addEventListener('webglcontextlost', lost);
  const resize = () => { const width = Math.max(1, canvas.clientWidth), height = Math.max(1, canvas.clientHeight); const ratio = Math.min(globalThis.devicePixelRatio || 1, 2); if (canvas.width !== Math.floor(width * ratio) || canvas.height !== Math.floor(height * ratio)) { renderer.setPixelRatio(ratio); renderer.setSize(width, height, false); camera.aspect = width / height; camera.fov = Math.min(75, 2 * Math.atan(Math.tan(THREE.MathUtils.degToRad(38 / 2)) / Math.min(1, camera.aspect)) * 180 / Math.PI); camera.updateProjectionMatrix(); } };
  const observer = typeof ResizeObserver === 'function' ? new ResizeObserver(resize) : null; observer?.observe(canvas); resize();
  const render = (world, options = {}) => { if (disposed) return; currentWorld = world || currentWorld; currentOptions = { ...currentOptions, ...options }; if (!currentWorld) return; resize(); syncWorldScene(model, currentWorld, currentOptions); controls.update(); renderer.render(scene, camera); };
  const dispose = () => { if (disposed) return; disposed = true; observer?.disconnect(); controls.dispose(); canvas.removeEventListener('pointerdown', pointerdown); canvas.removeEventListener('click', click); canvas.removeEventListener('dblclick', dblclick); canvas.removeEventListener('webglcontextlost', lost); scene.traverse(object => { object.geometry?.dispose?.(); if (Array.isArray(object.material)) object.material.forEach(m => m.dispose()); else object.material?.dispose?.(); }); renderer.dispose(); };
  const setCameraPreset = name => {
    if (name !== 'crew') return presetCamera(camera, controls, name === 'front' ? 'front' : 'angled');
    const x = Number(currentWorld?.x) || 0, y = Number(currentWorld?.y) || 2.25;
    controls.target.set(x, y + .18, 0); camera.position.set(x + 2.55, y + 1.28, 5.25); controls.update();
  };
  return { render, resetCamera: () => presetCamera(camera, controls, 'angled'), setCameraPreset, pickTarget, dispose, scene, camera, renderer };
}


