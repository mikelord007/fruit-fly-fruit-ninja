import * as THREE from '../vendor/three/three.module.js';

// Whole fruit and sliced halves share the same surface, including decorations.
// All dimensions remain close to the game's existing 0.43 collision radius.
const skins = new Map(), faces = new Map();
function surface(index, theta, phi) {
  const c = Math.cos(theta), s = Math.sin(theta);
  let r = .43 * s, y = .43 * c;
  if (index === 0) {
    r *= (1 + .065 * Math.cos(5 * phi) * s) * (1 + .05 * c);
    y -= .065 * Math.max(0, c) ** 10 - .025 * Math.max(0, -c) ** 10;
  } else if (index === 2) {
    r = .46 * s * (.73 + .34 * c);
    y = .45 * c;
  } else if (index === 3) {
    r = .42 * s;
    y = .43 * c;
  }
  return new THREE.Vector3(r * Math.cos(phi) * (index === 3 ? 1.22 : 1), y, r * Math.sin(phi) * (index === 3 ? 1.03 : 1));
}
function rng(seed) {
  return () => {seed = (Math.imul(seed, 1664525) + 1013904223) >>> 0; return seed / 4294967296;};
}
function canvasTexture(draw) {
  const canvas = document.createElement('canvas');
  canvas.width = canvas.height = 256;
  draw(canvas.getContext('2d'));
  const texture = new THREE.CanvasTexture(canvas);
  texture.colorSpace = THREE.SRGBColorSpace;
  return texture;
}
function skinMaterial(index) {
  if (skins.has(index)) return skins.get(index);
  const map = canvasTexture(ctx => {
    const rand = rng(671 + index);
    ctx.fillStyle = ['#c92e2d', '#ee790b', '#db273c', '#89603a'][index];
    ctx.fillRect(0, 0, 256, 256);
    for (let i = 0; i < 3400; i++) {
      const x = rand() * 256, y = rand() * 256;
      ctx.fillStyle = index === 3 ? (i % 2 ? '#ba9559' : '#543d28') : (i % 2 ? '#fff1b7' : '#743321');
      ctx.globalAlpha = index === 3 ? .34 : index === 1 ? .2 : .08;
      ctx.beginPath();ctx.ellipse(x, y, index === 3 ? .45 : .7, index === 3 ? 2.2 : .7, -.35, 0, Math.PI * 2);ctx.fill();
    }
    ctx.globalAlpha = 1;
  });
  const mat = new THREE.MeshStandardMaterial({map, bumpMap: map, bumpScale: index === 3 ? .018 : .006, roughness: index === 3 ? .95 : index === 1 ? .72 : .36});
  skins.set(index, mat);
  return mat;
}
function cutMaterial(index) {
  if (faces.has(index)) return faces.get(index);
  const map = canvasTexture(ctx => {
    const rand = rng(450 + index), center = 128;
    ctx.fillStyle = ['#c9382c', '#f68e16', '#c91e35', '#88633b'][index];ctx.fillRect(0, 0, 256, 256);
    const disk = (r, color) => {ctx.fillStyle = color;ctx.beginPath();ctx.arc(center, center, r, 0, Math.PI * 2);ctx.fill();};
    disk(119, ['#fff0c8', '#fff0bd', '#f45d65', '#93c83e'][index]);
    if (index === 1) {
      for (let n = 0; n < 10; n++) {
        const a = n * Math.PI / 5;
        ctx.beginPath();ctx.moveTo(128 + 13 * Math.cos(a + .045), 128 + 13 * Math.sin(a + .045));
        ctx.arc(128, 128, 112, a + .035, a + Math.PI / 5 - .035);ctx.closePath();
        ctx.fillStyle = n % 2 ? '#ffb52e' : '#ffa21c';ctx.fill();
      }
      disk(11, '#fff2ce');
    } else if (index === 3) {
      for (let n = 0; n < 70; n++) {
        const a = n * Math.PI * 2 / 70;
        ctx.strokeStyle = n % 2 ? '#c1e26c' : '#6da832';ctx.lineWidth = 1.4;
        ctx.beginPath();ctx.moveTo(128 + 32 * Math.cos(a), 128 + 32 * Math.sin(a));ctx.lineTo(128 + 112 * Math.cos(a), 128 + 112 * Math.sin(a));ctx.stroke();
      }
      ctx.fillStyle = '#f3efb5';ctx.beginPath();ctx.ellipse(128, 128, 28, 39, 0, 0, Math.PI * 2);ctx.fill();
      for (let n = 0; n < 28; n++) {
        const a = n * Math.PI * 2 / 28, r = 53 + rand() * 9;
        ctx.fillStyle = '#292819';ctx.beginPath();ctx.ellipse(128 + r * Math.cos(a), 128 + r * Math.sin(a), 2.8, 5, a - Math.PI / 2, 0, Math.PI * 2);ctx.fill();
      }
    } else if (index === 0) {
      disk(28, '#eed9a8');
      for (let n = 0; n < 5; n++) {
        const a = n * Math.PI * 2 / 5;
        ctx.fillStyle = '#683a25';ctx.beginPath();ctx.ellipse(128 + 24 * Math.cos(a), 128 + 24 * Math.sin(a), 4, 9, a - Math.PI / 2, 0, Math.PI * 2);ctx.fill();
      }
    } else {
      const gradient = ctx.createRadialGradient(128, 128, 7, 128, 128, 102);
      gradient.addColorStop(0, '#ffe3c0');gradient.addColorStop(.3, '#ffbaa1');gradient.addColorStop(1, '#ed4356');disk(113, gradient);
      for (let n = 0; n < 25; n++) {
        const a = n * Math.PI * 2 / 25;
        ctx.strokeStyle = '#ff9a8d';ctx.lineWidth = 1;
        ctx.beginPath();ctx.moveTo(128 + 38 * Math.cos(a), 128 + 38 * Math.sin(a));ctx.lineTo(128 + 107 * Math.cos(a), 128 + 107 * Math.sin(a));ctx.stroke();
      }
    }
  });
  const material = new THREE.MeshStandardMaterial({map, roughness: .65, side: THREE.DoubleSide});
  faces.set(index, material);return material;
}
function mesh(geometry, material) {
  const m = new THREE.Mesh(geometry, material);m.castShadow = m.receiveShadow = true;return m;
}
const green = new THREE.MeshStandardMaterial({color: 0x397b27, roughness: .7, side: THREE.DoubleSide});
const stemMaterial = new THREE.MeshStandardMaterial({color: 0x624228, roughness: .9});
function leaf(length, width) {
  const shape = new THREE.Shape();shape.moveTo(0, 0);
  shape.quadraticCurveTo(width, length * .5, 0, length);
  shape.quadraticCurveTo(-width, length * .5, 0, 0);
  const geometry = new THREE.ShapeGeometry(shape, 8), positions = geometry.attributes.position;
  for (let i = 0; i < positions.count; i++) positions.setZ(i, Math.sin(positions.getY(i) / length * Math.PI) * length * .13);
  geometry.computeVertexNormals();return mesh(geometry, green);
}
export function createFruitModel(index, half = null) {
  const group = new THREE.Group();group.name = ['Apple', 'Orange', 'Strawberry', 'Kiwi'][index];
  const rows = half ? 20 : 40, columns = 64, positions = [], uvs = [], indices = [];
  const start = half === 'bottom' ? Math.PI / 2 : 0, span = half ? Math.PI / 2 : Math.PI;
  for (let row = 0; row <= rows; row++) for (let col = 0; col <= columns; col++) {
    const theta = start + row / rows * span, phi = col / columns * Math.PI * 2;
    positions.push(...surface(index, theta, phi).toArray());uvs.push(col / columns, theta / Math.PI);
    if (row < rows && col < columns) {
      const a = row * (columns + 1) + col, b = a + columns + 1;
      indices.push(a, a + 1, b, a + 1, b + 1, b);
    }
  }
  const geometry = new THREE.BufferGeometry();geometry.setAttribute('position', new THREE.Float32BufferAttribute(positions, 3));geometry.setAttribute('uv', new THREE.Float32BufferAttribute(uvs, 2));geometry.setIndex(indices);geometry.computeVertexNormals();
  group.add(mesh(geometry, skinMaterial(index)));
  if (half) {
    // Use the exact equator silhouette so apple lobes and kiwi rind meet the flesh.
    const vertices = [0, 0, 0], coords = [.5, .5], triangles = [];
    for (let i = 0; i <= columns; i++) {
      const phi = i / columns * Math.PI * 2, p = surface(index, Math.PI / 2, phi);
      vertices.push(p.x, 0, p.z);coords.push(.5 + .5 * Math.cos(phi), .5 + .5 * Math.sin(phi));
      if (i < columns) triangles.push(0, i + 1, i + 2);
    }
    const face = new THREE.BufferGeometry();face.setAttribute('position', new THREE.Float32BufferAttribute(vertices, 3));face.setAttribute('uv', new THREE.Float32BufferAttribute(coords, 2));face.setIndex(triangles);face.computeVertexNormals();
    group.add(mesh(face, cutMaterial(index)));
  }
  if (half !== 'bottom') {
    if (index === 0) {
      const stem = mesh(new THREE.CylinderGeometry(.023, .033, .19, 9), stemMaterial);stem.position.set(0, .45, 0);stem.rotation.z = -.18;group.add(stem);
      const l = leaf(.27, .105);l.position.set(.015, .48, 0);l.rotation.set(-.8, .3, -1);group.add(l);
    } else if (index === 2) {
      for (let n = 0; n < 7; n++) {
        const rig = new THREE.Group();rig.position.y = .435;rig.rotation.y = n * Math.PI * 2 / 7;
        const l = leaf(.31, .095);l.rotation.x = 1.45;rig.add(l);group.add(rig);
      }
      const stem = mesh(new THREE.CylinderGeometry(.025, .036, .085, 8), green);stem.position.y = .47;stem.rotation.z = -.2;group.add(stem);
    } else if (index === 1) {
      const scar = mesh(new THREE.SphereGeometry(.055, 12, 8), green);scar.scale.y = .22;scar.position.y = .429;group.add(scar);
    }
  }
  if (index === 2) {
    const seedGeometry = new THREE.SphereGeometry(1, 7, 5), seedMaterial = new THREE.MeshStandardMaterial({color: 0xffd474, roughness: .6});
    const seeds = [];
    for (let row = 0; row < 8; row++) {
      const theta = .43 + row * .30, count = Math.round(17 * Math.sin(theta));
      if (half === 'top' && theta > Math.PI / 2 || half === 'bottom' && theta < Math.PI / 2) continue;
      for (let n = 0; n < count; n++) seeds.push([theta, (n + row * .5) / count * Math.PI * 2]);
    }
    const instanced = new THREE.InstancedMesh(seedGeometry, seedMaterial, seeds.length), dummy = new THREE.Object3D();
    seeds.forEach(([theta, phi], i) => {
      const p = surface(index, theta, phi), tangent = surface(index, theta + .001, phi).sub(p), around = surface(index, theta, phi + .001).sub(p);
      const normal = new THREE.Vector3().crossVectors(around, tangent).normalize();
      dummy.position.copy(p).addScaledVector(normal, .004);dummy.quaternion.setFromUnitVectors(new THREE.Vector3(0, 0, 1), normal);dummy.scale.set(.012, .022, .007);dummy.updateMatrix();instanced.setMatrixAt(i, dummy.matrix);
    });
    instanced.castShadow = true;group.add(instanced);
  }
  return group;
}
