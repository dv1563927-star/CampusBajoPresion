/**
 * salon3d.js
 * ----------
 * Modelos 3D de los salones del campus según el plano de evacuación.
 */

import * as THREE from '../node_modules/three/build/three.module.js';

const renderers = new Map();

export function initSalon3D(canvas, tipo) {
  disposeSalon3D(canvas);

  const W = canvas.parentElement.clientWidth || 360;
  const H = canvas.parentElement.clientHeight || 220;

  const scene  = new THREE.Scene();
  scene.background = new THREE.Color(0x040A18);
  scene.fog = new THREE.Fog(0x040A18, 8, 18);

  const camera = new THREE.PerspectiveCamera(50, W / H, 0.1, 100);

  let renderer;
  try {
    renderer = new THREE.WebGLRenderer({ canvas, antialias: true });
  } catch {
    return;
  }
  renderer.setSize(W, H);
  renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
  renderer.shadowMap.enabled = true;
  renderer.shadowMap.type = THREE.PCFSoftShadowMap;

  scene.add(new THREE.AmbientLight(0x2A4060, 0.85));
  const spot = new THREE.SpotLight(0xC8E8FF, 1.4, 22, Math.PI * 0.35, 0.5, 1);
  spot.position.set(0, 8, 4);
  spot.castShadow = true;
  spot.shadow.mapSize.set(1024, 1024);
  scene.add(spot);

  const fill = new THREE.DirectionalLight(0x4060A0, 0.55);
  fill.position.set(-5, 4, -3);
  scene.add(fill);

  const gold = new THREE.PointLight(0xC8A45A, 0.5, 14);
  gold.position.set(3, 3, 3);
  scene.add(gold);

  if (tipo === 'auditorio')   buildAuditorio(scene);
  else if (tipo === 'lab')    buildLab(scene);
  else                        buildSimple(scene);

  let angle = 0.6;
  const radius = tipo === 'auditorio' ? 11 : tipo === 'lab' ? 9.5 : 7.2;
  const height = tipo === 'auditorio' ? 7.5 : tipo === 'lab' ? 6 : 4.2;
  const instance = { renderer, raf: null };
  renderers.set(canvas, instance);

  const tick = () => {
    instance.raf = requestAnimationFrame(tick);
    angle += 0.0035;
    camera.position.x = Math.sin(angle) * radius;
    camera.position.z = Math.cos(angle) * radius;
    camera.position.y = height;
    camera.lookAt(0, 0.5, 0);
    renderer.render(scene, camera);
  };
  tick();
}

export function disposeSalon3D(canvas = null) {
  const instances = canvas
    ? [renderers.get(canvas)]
    : [...renderers.values()];

  instances.forEach(instance => {
    if (!instance) return;
    cancelAnimationFrame(instance.raf);
    instance.renderer.dispose();
  });

  if (canvas) renderers.delete(canvas);
  else renderers.clear();
}

const MAT = {
  floor:    () => new THREE.MeshPhongMaterial({ color: 0x142033, shininess: 40 }),
  wall:     () => new THREE.MeshPhongMaterial({ color: 0x18273E }),
  wallBack: () => new THREE.MeshPhongMaterial({ color: 0x101C2E }),
  desk:     () => new THREE.MeshPhongMaterial({ color: 0x6A7A8C, shininess: 80 }),
  deskTop:  () => new THREE.MeshPhongMaterial({ color: 0x8A96A4, shininess: 120 }),
  chair:    () => new THREE.MeshPhongMaterial({ color: 0x2A3A50 }),
  chairSeat:() => new THREE.MeshPhongMaterial({ color: 0x3A4A60 }),
  screen:   () => new THREE.MeshPhongMaterial({
    color: 0x001830, emissive: 0x0055AA, emissiveIntensity: 0.9
  }),
  monitor:  () => new THREE.MeshPhongMaterial({ color: 0x0A0F18, shininess: 120 }),
  board:    () => new THREE.MeshPhongMaterial({ color: 0xF0F4FF, emissive: 0x6677AA, emissiveIntensity: 0.15 }),
  metal:    () => new THREE.MeshPhongMaterial({ color: 0x3A4A60, shininess: 140, specular: 0x8899AA }),
  metalDark:() => new THREE.MeshPhongMaterial({ color: 0x2A3A50, shininess: 120 }),
  tv:       () => new THREE.MeshPhongMaterial({
    color: 0x05080F, emissive: 0x1A5FA0, emissiveIntensity: 0.9
  }),
  tvFrame:  () => new THREE.MeshPhongMaterial({ color: 0x0A0F18, shininess: 60 }),
  pcTower:  () => new THREE.MeshPhongMaterial({ color: 0x1A2030, shininess: 80 }),
  pcGlow:   () => new THREE.MeshPhongMaterial({
    color: 0x0A0F18, emissive: 0x00D4FF, emissiveIntensity: 0.7
  }),
  step:     () => new THREE.MeshPhongMaterial({ color: 0x1E2E44 }),
};

function box(w, h, d, mat, x = 0, y = 0, z = 0, ry = 0) {
  const m = new THREE.Mesh(new THREE.BoxGeometry(w, h, d), mat);
  m.position.set(x, y, z);
  m.rotation.y = ry;
  m.castShadow = true;
  m.receiveShadow = true;
  return m;
}

function cyl(rt, rb, h, seg, mat, x = 0, y = 0, z = 0) {
  const m = new THREE.Mesh(new THREE.CylinderGeometry(rt, rb, h, seg), mat);
  m.position.set(x, y, z);
  m.castShadow = true;
  m.receiveShadow = true;
  return m;
}

function addRoundTable(parent, x, z, radius = 0.42, chairs = 4) {
  const g = new THREE.Group();
  g.add(cyl(radius, radius, 0.05, 24, MAT.deskTop(), 0, 0.5, 0));
  g.add(cyl(0.05, 0.05, 0.5, 10, MAT.metal(), 0, 0.25, 0));
  g.add(cyl(0.22, 0.24, 0.03, 16, MAT.metalDark(), 0, 0.015, 0));

  for (let i = 0; i < chairs; i++) {
    const a = (i / chairs) * Math.PI * 2 + Math.PI / 4;
    const cx = Math.cos(a) * (radius + 0.35);
    const cz = Math.sin(a) * (radius + 0.35);
    addChair(g, cx, 0, cz, -a + Math.PI / 2);
  }
  g.position.set(x, 0, z);
  parent.add(g);
}

function addChair(parent, x, y, z, ry = 0) {
  const g = new THREE.Group();
  g.add(box(0.30, 0.045, 0.30, MAT.chairSeat(), 0, 0.42, 0));
  g.add(box(0.30, 0.32, 0.035, MAT.chair(), 0, 0.60, -0.13));
  [[-1,-1],[1,-1],[-1,1],[1,1]].forEach(([sx, sz]) => {
    g.add(cyl(0.015, 0.015, 0.42, 6, MAT.metalDark(), sx * 0.12, 0.21, sz * 0.12));
  });
  g.position.set(x, y, z);
  g.rotation.y = ry;
  parent.add(g);
}

function addPCSet(parent, x, y, z, ry = 0) {
  const g = new THREE.Group();
  g.add(box(0.16, 0.30, 0.30, MAT.pcTower(), 0.10, 0.15, 0));
  g.add(box(0.17, 0.02, 0.26, MAT.pcGlow(), 0.10, 0.22, 0));
  g.add(cyl(0.06, 0.08, 0.04, 12, MAT.monitor(), -0.10, 0.02, 0));
  g.add(box(0.04, 0.14, 0.04, MAT.monitor(), -0.10, 0.09, 0));
  g.add(box(0.42, 0.28, 0.02, MAT.monitor(), -0.10, 0.30, 0));
  g.add(box(0.38, 0.24, 0.005, MAT.screen(), -0.10, 0.30, 0.012));
  g.add(box(0.30, 0.015, 0.10, MAT.monitor(), -0.10, 0.013, 0.18));
  g.add(box(0.06, 0.02, 0.10, MAT.monitor(), 0.10, 0.015, 0.20));
  g.position.set(x, y, z);
  g.rotation.y = ry;
  parent.add(g);
}

// ═══════════════════════════════════════════════
//  AUDITORIO
// ═══════════════════════════════════════════════
function buildAuditorio(scene) {
  const shape = new THREE.Shape();
  const radius = 5.2;
  shape.moveTo(-radius, 0);
  shape.absarc(0, 0, radius, Math.PI, 0, true);
  shape.lineTo(-radius, 0);
  shape.closePath();

  const floorGeo = new THREE.ExtrudeGeometry(shape, {
    depth: 0.1, bevelEnabled: false
  });
  const floor = new THREE.Mesh(floorGeo, MAT.floor());
  floor.rotation.x = -Math.PI / 2;
  floor.position.y = -0.1;
  floor.receiveShadow = true;
  scene.add(floor);

  const wallSegments = 32;
  for (let i = 0; i < wallSegments; i++) {
    const a0 = (i / wallSegments) * Math.PI;
    const a1 = ((i + 1) / wallSegments) * Math.PI;
    const x0 = Math.cos(a0) * radius;
    const z0 = -Math.sin(a0) * radius;
    const x1 = Math.cos(a1) * radius;
    const z1 = -Math.sin(a1) * radius;
    const dx = x1 - x0, dz = z1 - z0;
    const len = Math.hypot(dx, dz);
    const mx = (x0 + x1) / 2, mz = (z0 + z1) / 2;
    scene.add(box(len + 0.02, 2.6, 0.12, MAT.wall(),
                  mx, 1.3, mz, -Math.atan2(dz, dx)));
  }

  const rowRadii = [2.1, 2.85, 3.6, 4.35];
  rowRadii.forEach((rowRadius, row) => {
    const y = 0.14 + row * 0.24;
    const seatCount = 8 + row * 2;

    for (let seat = 0; seat < seatCount; seat++) {
      const angle = Math.PI * (seat + 0.5) / seatCount;
      const x = Math.cos(angle) * rowRadius;
      const z = -Math.sin(angle) * rowRadius;
      const facing = Math.atan2(-x, 0.45 - z);
      const tangent = angle - Math.PI / 2;

      scene.add(box(0.58, 0.14, 0.6, MAT.step(), x, y - 0.07, z, -tangent));
      addChair(scene, x, y, z, facing);
    }
  });

  scene.add(box(2.2, 0.36, 0.9, MAT.desk(), 0, 0.18, 0.55));
  scene.add(box(1.1, 0.7, 0.06, MAT.tvFrame(), 0, 1.35, 0.45));
  scene.add(box(1.02, 0.58, 0.02, MAT.tv(), 0, 1.35, 0.49));
}

// ═══════════════════════════════════════════════
//  SALÓN SIMPLE
// ═══════════════════════════════════════════════
function buildSimple(scene) {
  const W = 6, D = 5, H = 2.4;

  scene.add(box(W, 0.1, D, MAT.floor(), 0, -0.05, 0));
  scene.add(box(W, H, 0.1, MAT.wall(), 0, H / 2, -D / 2));
  scene.add(box(W, H, 0.1, MAT.wallBack(), 0, H / 2, D / 2));
  scene.add(box(0.1, H, D, MAT.wall(), -W / 2, H / 2, 0));
  scene.add(box(0.1, H, D, MAT.wall(), W / 2, H / 2, 0));

  scene.add(box(1.6, 0.9, 0.06, MAT.tvFrame(), 0, 1.4, -D / 2 + 0.08));
  scene.add(box(1.5, 0.82, 0.01, MAT.tv(), 0, 1.4, -D / 2 + 0.12));

  buildRollingBoard(scene, 0, 0, -D / 2 + 0.9);

  const positions = [
    [-1.6, -0.8], [1.6, -0.8],
    [-1.6,  1.2], [1.6,  1.2],
  ];
  positions.forEach(([x, z]) => addRoundTable(scene, x, z, 0.42, 4));
}

function buildRollingBoard(scene, x, y, z) {
  const g = new THREE.Group();

  [[-1,-1],[1,-1],[-1,1],[1,1]].forEach(([sx, sz]) => {
    const wheel = cyl(0.06, 0.06, 0.05, 12, MAT.metalDark(),
                      sx * 0.55, 0.06, sz * 0.28);
    wheel.rotation.x = Math.PI / 2;
    g.add(wheel);
  });

  [-1, 1].forEach(s => {
    g.add(cyl(0.025, 0.025, 1.4, 8, MAT.metal(), s * 0.55, 0.75, 0));
    const diag = cyl(0.02, 0.02, 0.9, 8, MAT.metal(), s * 0.5, 0.4, 0.15);
    diag.rotation.x = Math.PI / 3;
    g.add(diag);
  });

  g.add(cyl(0.02, 0.02, 1.1, 8, MAT.metal(), 0, 0.15, 0).rotateZ(Math.PI / 2));

  const board = box(1.3, 0.95, 0.04, MAT.board(), 0, 0.95, 0);
  board.rotation.x = -0.08;
  g.add(board);

  g.add(box(1.34, 0.03, 0.05, MAT.metal(), 0, 1.44, 0.01));

  g.position.set(x, y, z);
  scene.add(g);
}

// ═══════════════════════════════════════════════
//  LAB (Apolo / Artemis)
// ═══════════════════════════════════════════════
function buildLab(scene) {
  const W = 8.5, D = 6, H = 2.4;

  scene.add(box(W, 0.1, D, MAT.floor(), 0, -0.05, 0));
  scene.add(box(W, H, 0.1, MAT.wall(), 0, H / 2, -D / 2));
  scene.add(box(W, H, 0.1, MAT.wallBack(), 0, H / 2, D / 2));
  scene.add(box(0.1, H, D, MAT.wall(), -W / 2, H / 2, 0));
  scene.add(box(0.1, H, D, MAT.wall(), W / 2, H / 2, 0));

  const tvW = 2.0, tvH = 1.1;
  scene.add(box(tvW + 0.08, tvH + 0.08, 0.06, MAT.tvFrame(),
                0, 1.5, -D / 2 + 0.12));
  scene.add(box(tvW, tvH, 0.01, MAT.tv(),
                0, 1.5, -D / 2 + 0.16));

  const rowZ = [-1.8, 0, 1.8];
  rowZ.forEach((z, i) => buildBananaRow(scene, z, i));
}

function buildBananaRow(scene, z, rowIndex) {
  const N = 12;
  const halfW = 2.4;
  const curveDepth = 0.6;
  const yAt = x => curveDepth * (x * x) / (halfW * halfW);

  const g = new THREE.Group();

  const SEG = 32;
  for (let i = 0; i < SEG; i++) {
    const t0 = i / SEG, t1 = (i + 1) / SEG;
    const x0 = -halfW + t0 * halfW * 2;
    const x1 = -halfW + t1 * halfW * 2;
    const y0 = yAt(x0), y1 = yAt(x1);
    const mx = (x0 + x1) / 2, my = (y0 + y1) / 2;
    const ang = Math.atan2(y1 - y0, x1 - x0);
    const segLen = Math.hypot(x1 - x0, y1 - y0) * 1.1;
    const seg = box(segLen, 0.06, 0.7, MAT.deskTop(), mx, 0.74, -my, -ang);
    g.add(seg);
  }

  [-halfW + 0.4, halfW - 0.4].forEach(px => {
    const py = yAt(px);
    g.add(cyl(0.05, 0.05, 0.74, 10, MAT.metal(), px, 0.37, -py));
    g.add(cyl(0.18, 0.20, 0.03, 14, MAT.metalDark(), px, 0.015, -py));
  });

  for (let i = 0; i < N; i++) {
    const t = (i + 0.5) / N;
    const x = -halfW + t * halfW * 2;
    const y = yAt(x);
    const dx = 2 * curveDepth * x / (halfW * halfW);
    const ang = Math.atan2(dx, 1);

    addPCSet(g, x, 0.77, -y, -ang);

    const offDist = 0.62;
    const offX = Math.sin(ang) * offDist;
    const offZ = Math.cos(ang) * offDist;
    addChair(g, x + offX, 0, -y + offZ, -ang + Math.PI);
  }

  g.position.set(0, 0, z);
  scene.add(g);
}