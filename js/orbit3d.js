/**
 * orbit3d.js
 * ----------
 * Modelo 3D del astronauta Orbit (CampusLands) fiel a la mascota:
 * blanco, visor negro con cara pixelada, bandera de Colombia,
 * brazos cruzados, jetpack, auriculares.
 */

import * as THREE from '../node_modules/three/build/three.module.js';

const C = {
  suitLight:  0xE8EEF5,
  suitMid:    0xC8D4E0,
  suitDark:   0x8A9AAC,
  helmet:     0xF0F4F8,
  visor:      0x0A0F18,
  accentBlue: 0x2A5A8C,
  accentDark: 0x1A3A5C,
  packGray:   0xB8C2CC,
  boot:       0x3A4A5C,
  faceCyan:   0x00D4FF,
  ringGray:   0x8A96A4,
};

let _visorFaceGroup = null;

// ═══════════════════════════════════════════════
//  CARA PIXELADA
// ═══════════════════════════════════════════════
function buildPixelFace(name) {
  const g = new THREE.Group();
  const px = 0.028;
  const mat = new THREE.MeshBasicMaterial({
    color: C.faceCyan, transparent: true, opacity: 1
  });

  const pixel = (x, y, m = mat) => {
    const p = new THREE.Mesh(new THREE.BoxGeometry(px, px, 0.008), m);
    p.position.set(x * px, y * px, 0);
    g.add(p);
  };

  if (name === 'cool') {
    pixel(-3, 1); pixel(-2, 1); pixel(-3, 0); pixel(-2, 0); pixel(-4, 0);
    pixel( 2, 1); pixel( 3, 1); pixel( 2, 0); pixel( 3, 0); pixel( 4, 0);
    pixel(-2,-2); pixel(-1,-3); pixel(0,-3); pixel(1,-3); pixel(2,-2);
  } else if (name === 'happy') {
    pixel(-3, 1); pixel(-2, 1); pixel(-3, 0); pixel(-2, 0);
    pixel( 2, 1); pixel( 3, 1); pixel( 2, 0); pixel( 3, 0);
    pixel(-2,-2); pixel(-1,-3); pixel(0,-3); pixel(1,-3); pixel(2,-2);
  } else if (name === 'wow') {
    pixel(-4, 1); pixel(-3, 1); pixel(-2, 1);
    pixel(-4, 0); pixel(-3, 0); pixel(-2, 0);
    pixel( 2, 1); pixel( 3, 1); pixel( 4, 1);
    pixel( 2, 0); pixel( 3, 0); pixel( 4, 0);
    pixel(-1,-3); pixel(0,-3); pixel(1,-3);
    pixel(-1,-2); pixel(1,-2);
    pixel(-1,-1); pixel(0,-1); pixel(1,-1);
  } else if (name === 'sleepy') {
    pixel(-4, 1); pixel(-3, 1); pixel(-2, 1);
    pixel( 2, 1); pixel( 3, 1); pixel( 4, 1);
    pixel(-1,-2); pixel(0,-2); pixel(1,-2);
  } else if (name === 'angry') {
    pixel(-4, 1); pixel(-3, 1); pixel(-3, 0); pixel(-2, 0);
    pixel( 4, 1); pixel( 3, 1); pixel( 3, 0); pixel( 2, 0);
    pixel(-2,-2); pixel(-1,-2); pixel(0,-2); pixel(1,-2); pixel(2,-2);
  } else if (name === 'love') {
    pixel(-1, 1); pixel(1, 1);
    pixel(-2, 0); pixel(-1, 0); pixel(0, 0); pixel(1, 0); pixel(2, 0);
    pixel(-2,-1); pixel(-1,-1); pixel(0,-1); pixel(1,-1); pixel(2,-1);
    pixel(-1,-2); pixel(0,-2); pixel(1,-2);
    pixel(0,-3);
  }
  return g;
}

export function setOrbitExpression(name) {
  if (!_visorFaceGroup) return;
  while (_visorFaceGroup.children.length) {
    const c = _visorFaceGroup.children.pop();
    c.geometry?.dispose();
    c.material?.dispose();
  }
  _visorFaceGroup.add(buildPixelFace(name));
}

// ═══════════════════════════════════════════════
//  BANDERA DE COLOMBIA
// ═══════════════════════════════════════════════
function makeColFlagTexture() {
  const c = document.createElement('canvas');
  c.width = 64; c.height = 48;
  const ctx = c.getContext('2d');
  ctx.fillStyle = '#FCD116'; ctx.fillRect(0, 0, 64, 24);
  ctx.fillStyle = '#003893'; ctx.fillRect(0, 24, 64, 12);
  ctx.fillStyle = '#CE1126'; ctx.fillRect(0, 36, 64, 12);
  const tex = new THREE.CanvasTexture(c);
  tex.magFilter = THREE.NearestFilter;
  return tex;
}

// ═══════════════════════════════════════════════
//  CONSTRUCCIÓN DEL ASTRONAUTA
// ═══════════════════════════════════════════════
function buildOrbit() {
  const g = new THREE.Group();
  const mat = (c, opts = {}) => new THREE.MeshPhongMaterial({
    color: c, shininess: 40, ...opts
  });

  // ── PIERNAS ──
  [-1, 1].forEach(s => {
    const leg = new THREE.Mesh(
      new THREE.CapsuleGeometry(0.13, 0.30, 6, 12),
      mat(C.suitLight)
    );
    leg.position.set(s * 0.15, -0.55, 0);
    g.add(leg);

    const boot = new THREE.Mesh(
      new THREE.BoxGeometry(0.22, 0.14, 0.30),
      mat(C.boot)
    );
    boot.position.set(s * 0.15, -0.82, 0.05);
    g.add(boot);

    const knee = new THREE.Mesh(
      new THREE.TorusGeometry(0.11, 0.018, 6, 14),
      mat(C.suitDark)
    );
    knee.position.set(s * 0.15, -0.45, 0);
    knee.rotation.x = Math.PI / 2;
    g.add(knee);
  });

  // ── TORSO ──
  const torso = new THREE.Mesh(
    new THREE.CapsuleGeometry(0.34, 0.28, 8, 16),
    mat(C.suitLight)
  );
  torso.position.y = 0.02;
  g.add(torso);

  const chest = new THREE.Mesh(
    new THREE.BoxGeometry(0.18, 0.22, 0.06),
    mat(C.suitDark)
  );
  chest.position.set(0, 0.05, 0.32);
  g.add(chest);

  const chestBtn = new THREE.Mesh(
    new THREE.BoxGeometry(0.08, 0.06, 0.02),
    new THREE.MeshPhongMaterial({
      color: C.accentDark, emissive: C.accentBlue, emissiveIntensity: 0.6
    })
  );
  chestBtn.position.set(0, 0.05, 0.36);
  g.add(chestBtn);

  const belt = new THREE.Mesh(
    new THREE.TorusGeometry(0.34, 0.045, 8, 24),
    mat(C.suitMid)
  );
  belt.position.y = -0.22;
  belt.rotation.x = Math.PI / 2;
  g.add(belt);

  // ── BRAZOS EXTENDIDOS ──
  const armL = new THREE.Mesh(
    new THREE.CapsuleGeometry(0.10, 0.32, 6, 12),
    mat(C.suitLight)
  );
  armL.position.set(-0.55, 0.12, 0.13);
  armL.rotation.z = Math.PI / 2;
  g.add(armL);

  const gloveL = new THREE.Mesh(
    new THREE.SphereGeometry(0.13, 12, 10),
    mat(C.suitMid)
  );
  gloveL.position.set(-0.86, 0.12, 0.15);
  g.add(gloveL);

  const armR = new THREE.Mesh(
    new THREE.CapsuleGeometry(0.10, 0.32, 6, 12),
    mat(C.suitLight)
  );
  armR.position.set(0.55, 0.12, 0.13);
  armR.rotation.z = -Math.PI / 2;
  g.add(armR);

  const gloveR = new THREE.Mesh(
    new THREE.SphereGeometry(0.13, 12, 10),
    mat(C.suitMid)
  );
  gloveR.position.set(0.86, 0.12, 0.15);
  g.add(gloveR);

  // Hombros + bandera
  [-1, 1].forEach(s => {
    const sh = new THREE.Mesh(
      new THREE.SphereGeometry(0.14, 12, 10),
      mat(C.suitMid)
    );
    sh.position.set(s * 0.34, 0.16, 0.02);
    g.add(sh);

    const flagMat = new THREE.MeshPhongMaterial({
      map: makeColFlagTexture(), shininess: 30
    });
    const flag = new THREE.Mesh(
      new THREE.BoxGeometry(0.10, 0.075, 0.01),
      flagMat
    );
    flag.position.set(s * 0.36, 0.16, 0.16);
    flag.rotation.y = s * 0.2;
    g.add(flag);
  });

  // ── CASCO ──
  const helmet = new THREE.Mesh(
    new THREE.SphereGeometry(0.36, 28, 22),
    mat(C.helmet, { shininess: 60 })
  );
  helmet.position.y = 0.62;
  helmet.scale.set(1, 1.05, 1);
  g.add(helmet);

  const visorShell = new THREE.Mesh(
    new THREE.SphereGeometry(0.30, 28, 22, 0, Math.PI * 2, 0, Math.PI * 0.55),
    new THREE.MeshPhongMaterial({
      color: C.visor, shininess: 250, specular: 0xFFFFFF,
      transparent: true, opacity: 0.98
    })
  );
  visorShell.position.set(0, 0.62, 0.06);
  visorShell.rotation.x = -0.25;
  g.add(visorShell);

  _visorFaceGroup = new THREE.Group();
  _visorFaceGroup.position.set(0, 0.60, 0.30);
  _visorFaceGroup.rotation.x = -0.1;
  _visorFaceGroup.add(buildPixelFace('cool'));
  g.add(_visorFaceGroup);

  const visorRing = new THREE.Mesh(
    new THREE.TorusGeometry(0.31, 0.022, 8, 30),
    mat(C.ringGray)
  );
  visorRing.position.set(0, 0.62, 0.08);
  visorRing.rotation.x = Math.PI / 2 - 0.25;
  g.add(visorRing);

  // Auriculares
  [-1, 1].forEach(s => {
    const ear = new THREE.Mesh(
      new THREE.CylinderGeometry(0.10, 0.10, 0.06, 18),
      mat(C.suitMid)
    );
    ear.position.set(s * 0.36, 0.60, 0);
    ear.rotation.z = Math.PI / 2;
    g.add(ear);

    const earInner = new THREE.Mesh(
      new THREE.CylinderGeometry(0.055, 0.055, 0.075, 16),
      mat(C.accentDark)
    );
    earInner.position.set(s * 0.375, 0.60, 0);
    earInner.rotation.z = Math.PI / 2;
    g.add(earInner);
  });

  // Antena
  const ant = new THREE.Mesh(
    new THREE.CylinderGeometry(0.012, 0.012, 0.18, 6),
    mat(C.ringGray)
  );
  ant.position.set(0.28, 0.88, 0);
  ant.rotation.z = 0.4;
  g.add(ant);

  const antBall = new THREE.Mesh(
    new THREE.SphereGeometry(0.032, 10, 10),
    new THREE.MeshPhongMaterial({
      color: C.faceCyan, emissive: C.faceCyan, emissiveIntensity: 0.9
    })
  );
  antBall.position.set(0.36, 0.96, 0);
  g.add(antBall);

  // ── JETPACK ──
  const pack = new THREE.Mesh(
    new THREE.BoxGeometry(0.42, 0.48, 0.16),
    mat(C.packGray)
  );
  pack.position.set(0, 0.04, -0.30);
  g.add(pack);

  for (let i = 0; i < 3; i++) {
    const line = new THREE.Mesh(
      new THREE.BoxGeometry(0.38, 0.02, 0.005),
      mat(C.suitDark)
    );
    line.position.set(0, 0.16 - i * 0.14, -0.385);
    g.add(line);
  }

  const packTop = new THREE.Mesh(
    new THREE.CylinderGeometry(0.06, 0.06, 0.10, 12),
    mat(C.suitMid)
  );
  packTop.position.set(0, 0.32, -0.30);
  g.add(packTop);

  return g;
}

function makeParticles(count, radius) {
  const geo = new THREE.BufferGeometry();
  const pos = new Float32Array(count * 3);
  for (let i = 0; i < count; i++) {
    const theta = Math.random() * Math.PI * 2;
    const phi   = Math.acos(2 * Math.random() - 1);
    const r     = radius * (0.5 + Math.random() * 0.5);
    pos[i * 3]     = r * Math.sin(phi) * Math.cos(theta);
    pos[i * 3 + 1] = r * Math.sin(phi) * Math.sin(theta);
    pos[i * 3 + 2] = r * Math.cos(phi);
  }
  geo.setAttribute('position', new THREE.BufferAttribute(pos, 3));
  return new THREE.Points(geo, new THREE.PointsMaterial({
    color: 0xAABBFF, size: 0.015, transparent: true, opacity: 0.6
  }));
}

// ═══════════════════════════════════════════════
//  LOGIN
// ═══════════════════════════════════════════════
let _loginRaf, _loginRenderer, _loginExprTimer;

export function initOrbitLogin(canvas) {
  const W = canvas.parentElement.clientWidth  || 600;
  const H = canvas.parentElement.clientHeight || 700;

  const scene  = new THREE.Scene();
  const camera = new THREE.PerspectiveCamera(45, W / H, 0.1, 100);
  camera.position.set(0, 0.3, 3.2);
  camera.lookAt(0, 0.15, 0);

  try {
    _loginRenderer = new THREE.WebGLRenderer({ canvas, antialias: true, alpha: true });
  } catch {
    return;
  }
  _loginRenderer.setSize(W, H);
  _loginRenderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
  _loginRenderer.setClearColor(0x000000, 0);

  scene.add(new THREE.AmbientLight(0x6688AA, 0.7));
  const key = new THREE.DirectionalLight(0xFFFFFF, 1.4);
  key.position.set(3, 4, 5); scene.add(key);
  const rim = new THREE.DirectionalLight(0x00D4FF, 0.6);
  rim.position.set(-4, 2, -3); scene.add(rim);
  const fill = new THREE.DirectionalLight(0xAACCFF, 0.4);
  fill.position.set(0, -3, 2); scene.add(fill);

  scene.add(makeParticles(220, 3.5));

  const orbit = buildOrbit();
  orbit.scale.setScalar(1.35);
  orbit.position.y = -0.1;
  scene.add(orbit);

  const EXPR = ['cool', 'happy', 'wow', 'sleepy', 'love'];
  let exprIdx = 0;
  _loginExprTimer = setInterval(() => {
    exprIdx = (exprIdx + 1) % EXPR.length;
    setOrbitExpression(EXPR[exprIdx]);
  }, 4000);

  let t = 0;
  const tick = () => {
    _loginRaf = requestAnimationFrame(tick);
    t += 0.008;
    orbit.rotation.y = Math.sin(t * 0.4) * 0.35;
    orbit.position.y = -0.1 + Math.sin(t * 0.7) * 0.05;
    _loginRenderer.render(scene, camera);
  };
  tick();
}

export function disposeOrbitLogin() {
  if (_loginRaf) cancelAnimationFrame(_loginRaf);
  if (_loginExprTimer) clearInterval(_loginExprTimer);
  if (_loginRenderer) _loginRenderer.dispose();
}

// ═══════════════════════════════════════════════
//  CENTRO DEL MAPA
// ═══════════════════════════════════════════════
let _centerRaf, _centerRenderer, _centerExprTimer;

export function initOrbitCenter(canvas) {
  const scene  = new THREE.Scene();
  const camera = new THREE.PerspectiveCamera(50, 180 / 220, 0.1, 100);
  camera.position.set(0, 0.3, 2.9);
  camera.lookAt(0, 0.1, 0);

  try {
    _centerRenderer = new THREE.WebGLRenderer({ canvas, antialias: true, alpha: true });
  } catch {
    return;
  }
  _centerRenderer.setSize(180, 220);
  _centerRenderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
  _centerRenderer.setClearColor(0x000000, 0);

  scene.add(new THREE.AmbientLight(0x6688AA, 0.65));
  const key = new THREE.DirectionalLight(0xFFFFFF, 1.5);
  key.position.set(2, 3, 4); scene.add(key);
  const rim = new THREE.DirectionalLight(0x00D4FF, 0.7);
  rim.position.set(-3, 1, -2); scene.add(rim);

  const orbit = buildOrbit();
  scene.add(orbit);

  const EXPR = ['cool', 'happy', 'wow', 'love', 'sleepy'];
  let exprIdx = 0;
  _centerExprTimer = setInterval(() => {
    exprIdx = (exprIdx + 1) % EXPR.length;
    setOrbitExpression(EXPR[exprIdx]);
  }, 3500);

  let t = 0;
  const tick = () => {
    _centerRaf = requestAnimationFrame(tick);
    t += 0.012;
    orbit.rotation.y += 0.008;
    orbit.position.y  = Math.sin(t) * 0.05;
    _centerRenderer.render(scene, camera);
  };
  tick();
}

export function disposeOrbitCenter() {
  if (_centerRaf) cancelAnimationFrame(_centerRaf);
  if (_centerExprTimer) clearInterval(_centerExprTimer);
  if (_centerRenderer) _centerRenderer.dispose();
}