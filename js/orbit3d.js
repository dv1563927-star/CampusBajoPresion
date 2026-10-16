/**
 * orbit3d.js
 * ----------
 * Modelo 3D del astronauta Orbit (CampusLands) fiel a la mascota:
 * blanco, visor negro con cara pixelada, bandera de Colombia,
 * manos abiertas, jetpack y auriculares.
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
let _loginFallback = null;
let _centerFallback = null;

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
  _loginFallback?.setExpression(name);
  _centerFallback?.setExpression(name);
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

function addOpenHand(parent, side) {
  const hand = new THREE.Group();
  hand.position.set(side * 0.8, 0.13, 0.14);
  hand.scale.x = side;

  const glove = new THREE.MeshPhongMaterial({ color: C.suitMid, shininess: 28 });
  const palm = new THREE.Mesh(new THREE.SphereGeometry(0.11, 14, 12), glove);
  palm.scale.set(1.05, 0.7, 0.72);
  palm.position.set(0.04, 0, 0);
  hand.add(palm);

  for (let finger = 0; finger < 4; finger++) {
    const segment = new THREE.Mesh(
      new THREE.CapsuleGeometry(0.022, 0.085, 4, 8), glove
    );
    segment.position.set(0.16, (finger - 1.5) * 0.045, 0.01);
    segment.rotation.z = -Math.PI / 2;
    hand.add(segment);
  }

  const thumb = new THREE.Mesh(
    new THREE.CapsuleGeometry(0.024, 0.07, 4, 8), glove
  );
  thumb.position.set(0.03, -0.1, 0.02);
  thumb.rotation.z = Math.PI / 3;
  hand.add(thumb);
  parent.add(hand);
}

// ═══════════════════════════════════════════════
//  CONSTRUCCIÓN DEL ASTRONAUTA
// ═══════════════════════════════════════════════
function buildOrbit(pose = 'offer') {
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
    new THREE.BoxGeometry(0.24, 0.28, 0.07),
    mat(C.suitDark)
  );
  chest.position.set(0, 0.05, 0.32);
  g.add(chest);

  const chestScreen = new THREE.Mesh(
    new THREE.BoxGeometry(0.12, 0.09, 0.015),
    new THREE.MeshPhongMaterial({
      color: 0x142536, emissive: C.accentBlue, emissiveIntensity: 0.45
    })
  );
  chestScreen.position.set(0, 0.12, 0.365);
  g.add(chestScreen);

  [-1, 1].forEach(side => {
    const indicator = new THREE.Mesh(
      new THREE.SphereGeometry(0.025, 10, 8),
      new THREE.MeshBasicMaterial({ color: side < 0 ? 0x63B5D4 : 0xD6C995 })
    );
    indicator.position.set(side * 0.075, -0.08, 0.37);
    g.add(indicator);
  });

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

  const collar = new THREE.Mesh(
    new THREE.TorusGeometry(0.25, 0.045, 8, 24),
    mat(C.suitMid)
  );
  collar.position.set(0, 0.32, 0.02);
  collar.rotation.x = Math.PI / 2;
  g.add(collar);

  // ── BRAZOS EXTENDIDOS ──
  const armL = new THREE.Mesh(
    new THREE.CapsuleGeometry(0.10, 0.32, 6, 12),
    mat(C.suitLight)
  );
  armL.position.set(-0.55, 0.12, 0.13);
  armL.rotation.z = Math.PI / 2;
  g.add(armL);

  const armR = new THREE.Mesh(
    new THREE.CapsuleGeometry(0.10, 0.32, 6, 12),
    mat(C.suitLight)
  );
  armR.position.set(0.55, 0.12, 0.13);
  armR.rotation.z = -Math.PI / 2;
  g.add(armR);

  if (pose === 'crossed') {
    armL.position.set(-0.22, 0.02, 0.20);
    armL.rotation.set(0.5, 0, 0.9);
    armR.position.set(0.22, 0.05, 0.20);
    armR.rotation.set(0.6, 0, -0.9);

    const gloveL = new THREE.Mesh(new THREE.SphereGeometry(0.13, 12, 10), mat(C.suitMid));
    gloveL.position.set(0.10, -0.06, 0.42);
    g.add(gloveL);
    const gloveR = new THREE.Mesh(new THREE.SphereGeometry(0.13, 12, 10), mat(C.suitMid));
    gloveR.position.set(-0.10, -0.02, 0.40);
    g.add(gloveR);
  } else {
    [-1, 1].forEach(side => {
      const cuff = new THREE.Mesh(
        new THREE.TorusGeometry(0.105, 0.022, 6, 16),
        mat(C.suitDark)
      );
      cuff.position.set(side * 0.78, 0.12, 0.13);
      cuff.rotation.y = Math.PI / 2;
      g.add(cuff);
      addOpenHand(g, side);
    });
  }

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

function buildOrbitHead() {
  const g = new THREE.Group();
  const mat = (color, options = {}) => new THREE.MeshPhongMaterial({
    color, shininess: 50, ...options
  });

  const helmet = new THREE.Mesh(
    new THREE.SphereGeometry(0.36, 32, 24),
    mat(C.helmet, { shininess: 75 })
  );
  helmet.position.y = 0.04;
  helmet.scale.set(1, 1.05, 1);
  g.add(helmet);

  [-1, 1].forEach(side => {
    const ear = new THREE.Mesh(
      new THREE.CylinderGeometry(0.12, 0.12, 0.08, 24), mat(C.suitMid)
    );
    ear.position.set(side * 0.35, 0.02, 0);
    ear.rotation.z = Math.PI / 2;
    g.add(ear);

    const inset = new THREE.Mesh(
      new THREE.CylinderGeometry(0.075, 0.075, 0.09, 20), mat(C.accentDark)
    );
    inset.position.set(side * 0.38, 0.02, 0);
    inset.rotation.z = Math.PI / 2;
    g.add(inset);
  });

  const visor = new THREE.Mesh(
    new THREE.SphereGeometry(0.30, 32, 24, 0, Math.PI * 2, 0, Math.PI * 0.55),
    mat(C.visor, { shininess: 250, specular: 0xFFFFFF, transparent: true, opacity: 0.98 })
  );
  visor.position.set(0, 0.04, 0.06);
  visor.rotation.x = -0.25;
  g.add(visor);

  _visorFaceGroup = new THREE.Group();
  _visorFaceGroup.position.set(0, 0.02, 0.30);
  _visorFaceGroup.rotation.x = -0.1;
  _visorFaceGroup.add(buildPixelFace('cool'));
  g.add(_visorFaceGroup);

  const ring = new THREE.Mesh(new THREE.TorusGeometry(0.31, 0.022, 8, 32), mat(C.ringGray));
  ring.position.set(0, 0.04, 0.08);
  ring.rotation.x = Math.PI / 2 - 0.25;
  g.add(ring);

  const antenna = new THREE.Mesh(
    new THREE.CylinderGeometry(0.012, 0.012, 0.18, 8), mat(C.ringGray)
  );
  antenna.position.set(0.28, 0.31, 0);
  antenna.rotation.z = 0.4;
  g.add(antenna);

  const light = new THREE.Mesh(
    new THREE.SphereGeometry(0.035, 12, 10),
    new THREE.MeshPhongMaterial({
      color: C.faceCyan, emissive: C.faceCyan, emissiveIntensity: 0.9
    })
  );
  light.position.set(0.36, 0.39, 0);
  g.add(light);

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

function drawOrbitFallback(canvas, expression, pose, time) {
  const width = canvas.clientWidth || canvas.parentElement.clientWidth || 600;
  const height = canvas.clientHeight || canvas.parentElement.clientHeight || 700;
  const pixelRatio = Math.min(window.devicePixelRatio || 1, 2);
  canvas.width = Math.round(width * pixelRatio);
  canvas.height = Math.round(height * pixelRatio);

  const ctx = canvas.getContext('2d');
  if (!ctx) return;
  ctx.setTransform(pixelRatio, 0, 0, pixelRatio, 0, 0);
  ctx.clearRect(0, 0, width, height);

  if (pose === 'head') {
    drawOrbitHeadFallback(ctx, expression, width, height, time);
    return;
  }

  const scale = Math.min(width / 320, height / 430) * 0.9;
  ctx.translate(width / 2, height / 2 + Math.sin(time) * 4);
  ctx.scale(scale, scale);

  const glow = ctx.createRadialGradient(0, -12, 10, 0, -12, 190);
  glow.addColorStop(0, 'rgba(60,130,180,.19)');
  glow.addColorStop(1, 'rgba(20,50,80,0)');
  ctx.fillStyle = glow;
  ctx.beginPath();
  ctx.arc(0, -12, 190, 0, Math.PI * 2);
  ctx.fill();

  const rounded = (x, y, w, h, r, fill) => {
    ctx.fillStyle = fill;
    ctx.beginPath();
    ctx.roundRect(x, y, w, h, r);
    ctx.fill();
  };
  const suit = ctx.createLinearGradient(-90, 0, 90, 110);
  suit.addColorStop(0, '#FFFFFF');
  suit.addColorStop(0.48, '#DCE5EC');
  suit.addColorStop(1, '#AABAC8');

  ctx.fillStyle = 'rgba(0,0,0,.5)';
  ctx.beginPath();
  ctx.ellipse(0, 188, 82, 15, 0, 0, Math.PI * 2);
  ctx.fill();

  const pack = ctx.createLinearGradient(-45, 0, 45, 0);
  pack.addColorStop(0, '#63778A');
  pack.addColorStop(0.5, '#D2DCE3');
  pack.addColorStop(1, '#708497');
  rounded(-51, -1, 102, 148, 25, pack);
  rounded(-38, 16, 76, 113, 18, '#9BAAB6');
  for (let line = 0; line < 3; line++) {
    rounded(-31, 33 + line * 27, 62, 5, 3, '#526577');
  }

  rounded(-59, 116, 48, 73, 21, suit);
  rounded(11, 116, 48, 73, 21, suit);
  rounded(-64, 171, 54, 25, 8, '#344453');
  rounded(10, 171, 54, 25, 8, '#344453');
  rounded(-56, 177, 41, 7, 3, '#8093A3');
  rounded(15, 177, 41, 7, 3, '#8093A3');

  rounded(-78, -8, 156, 153, 45, suit);
  rounded(-75, 79, 150, 45, 18, '#607689');
  rounded(-43, 91, 86, 34, 9, '#263A4D');
  rounded(-34, 98, 68, 18, 4, '#172A3A');
  rounded(-27, 101, 15, 5, 2, '#5BB3D2');
  rounded(-7, 101, 15, 5, 2, '#D5BD72');
  rounded(13, 101, 15, 5, 2, '#C65A55');

  if (pose === 'crossed') {
    ctx.lineCap = 'round';
    ctx.lineJoin = 'round';
    const drawArmShape = () => {
      ctx.beginPath();
      ctx.moveTo(-59, 15);
      ctx.bezierCurveTo(-47, 63, 16, 67, 55, 36);
      ctx.moveTo(59, 15);
      ctx.bezierCurveTo(44, 41, -13, 35, -54, 57);
    };
    ctx.lineWidth = 44;
    ctx.strokeStyle = '#93A4B1';
    drawArmShape();
    ctx.stroke();
    ctx.lineWidth = 36;
    ctx.strokeStyle = suit;
    drawArmShape();
    ctx.lineWidth = 6;
    ctx.strokeStyle = '#70869A';
    ctx.beginPath();
    ctx.moveTo(37, 48);
    ctx.lineTo(53, 35);
    ctx.moveTo(-35, 48);
    ctx.lineTo(-52, 57);
    ctx.stroke();
    rounded(20, 38, 22, 13, 5, '#C5D0D9');
    rounded(-43, 44, 22, 13, 5, '#C5D0D9');
  } else {
    ctx.lineCap = 'round';
    ctx.lineWidth = 33;
    ctx.strokeStyle = suit;
    ctx.beginPath();
    ctx.moveTo(-57, 4);
    ctx.lineTo(-98, -5);
    ctx.lineTo(-132, -3);
    ctx.moveTo(57, 4);
    ctx.lineTo(98, -5);
    ctx.lineTo(132, -3);
    ctx.stroke();
    [-1, 1].forEach(side => {
      ctx.fillStyle = '#C5D0D9';
      ctx.beginPath();
      ctx.ellipse(side * 140, -2, 18, 14, 0, 0, Math.PI * 2);
      ctx.fill();
      for (let finger = 0; finger < 4; finger++) {
        rounded(side * (145 + finger * 2), -17 + finger * 8, 8, 17, 4, '#DCE5EC');
      }
    });
  }

  [-1, 1].forEach(side => {
    const x = side * 67;
    rounded(x - 11, 2, 22, 7, 2, '#FCD116');
    rounded(x - 11, 9, 22, 6, 2, '#24518B');
    rounded(x - 11, 15, 22, 6, 2, '#C94143');
  });

  const helmet = ctx.createLinearGradient(-68, -190, 70, -35);
  helmet.addColorStop(0, '#FFFFFF');
  helmet.addColorStop(0.65, '#D8E0E7');
  helmet.addColorStop(1, '#92A3B3');
  ctx.fillStyle = helmet;
  ctx.beginPath();
  ctx.ellipse(0, -102, 86, 82, 0, 0, Math.PI * 2);
  ctx.fill();

  ctx.fillStyle = '#8396A8';
  ctx.beginPath();
  ctx.ellipse(-83, -96, 15, 29, -0.12, 0, Math.PI * 2);
  ctx.ellipse(83, -96, 15, 29, 0.12, 0, Math.PI * 2);
  ctx.fill();
  ctx.fillStyle = '#526B82';
  ctx.beginPath();
  ctx.ellipse(-84, -96, 8, 18, 0, 0, Math.PI * 2);
  ctx.ellipse(84, -96, 8, 18, 0, 0, Math.PI * 2);
  ctx.fill();

  const visor = ctx.createRadialGradient(-23, -132, 4, 10, -98, 84);
  visor.addColorStop(0, '#39434D');
  visor.addColorStop(0.52, '#101820');
  visor.addColorStop(1, '#03070B');
  ctx.fillStyle = visor;
  ctx.beginPath();
  ctx.ellipse(0, -101, 68, 59, 0, 0, Math.PI * 2);
  ctx.fill();
  ctx.strokeStyle = '#73889B';
  ctx.lineWidth = 5;
  ctx.stroke();

  const pixel = (x, y, w = 6, h = 6) => {
    ctx.fillStyle = '#24B9F0';
    ctx.fillRect(x, y, w, h);
  };
  if (expression === 'sleepy') {
    pixel(-35, -112, 22, 5);
    pixel(13, -112, 22, 5);
  } else if (expression === 'wow') {
    pixel(-34, -118, 17, 17);
    pixel(17, -118, 17, 17);
  } else if (expression === 'love') {
    [[-32, -119], [-26, -125], [-20, -119], [-26, -113],
      [17, -119], [23, -125], [29, -119], [23, -113]].forEach(([x, y]) => pixel(x, y));
  } else {
    pixel(-34, -116, 8, 14);
    pixel(-26, -108, 8, 8);
    pixel(18, -108, 8, 8);
    pixel(26, -116, 8, 14);
  }

  ctx.fillStyle = '#24B9F0';
  ctx.beginPath();
  if (expression === 'wow') {
    ctx.ellipse(0, -83, 8, 10, 0, 0, Math.PI * 2);
  } else if (expression === 'sleepy') {
    ctx.roundRect(-13, -84, 26, 5, 2);
  } else {
    ctx.moveTo(-15, -86);
    ctx.quadraticCurveTo(0, -72, 15, -86);
    ctx.lineWidth = 5;
    ctx.strokeStyle = '#24B9F0';
    ctx.stroke();
  }
  ctx.fill();

  ctx.strokeStyle = '#8D9EAA';
  ctx.lineWidth = 4;
  ctx.beginPath();
  ctx.moveTo(50, -168);
  ctx.lineTo(64, -190);
  ctx.stroke();
  ctx.fillStyle = '#44C4EA';
  ctx.beginPath();
  ctx.arc(65, -192, 5, 0, Math.PI * 2);
  ctx.fill();
}

function drawOrbitHeadFallback(ctx, expression, width, height, time) {
  const scale = Math.min(width / 170, height / 190) * 0.9;
  ctx.save();
  ctx.translate(width / 2, height / 2 + Math.sin(time) * 2);
  ctx.scale(scale, scale);

  const glow = ctx.createRadialGradient(0, 0, 8, 0, 0, 105);
  glow.addColorStop(0, 'rgba(60,145,195,.22)');
  glow.addColorStop(1, 'rgba(20,50,80,0)');
  ctx.fillStyle = glow;
  ctx.beginPath();
  ctx.arc(0, 0, 105, 0, Math.PI * 2);
  ctx.fill();

  ctx.fillStyle = '#73889B';
  ctx.beginPath();
  ctx.ellipse(-72, 4, 15, 28, -0.1, 0, Math.PI * 2);
  ctx.ellipse(72, 4, 15, 28, 0.1, 0, Math.PI * 2);
  ctx.fill();
  ctx.fillStyle = '#3C566D';
  ctx.beginPath();
  ctx.ellipse(-73, 4, 8, 17, 0, 0, Math.PI * 2);
  ctx.ellipse(73, 4, 8, 17, 0, 0, Math.PI * 2);
  ctx.fill();

  const helmet = ctx.createLinearGradient(-65, -72, 65, 75);
  helmet.addColorStop(0, '#FFFFFF');
  helmet.addColorStop(0.62, '#DCE5EC');
  helmet.addColorStop(1, '#899CAC');
  ctx.fillStyle = helmet;
  ctx.beginPath();
  ctx.ellipse(0, 0, 69, 76, 0, 0, Math.PI * 2);
  ctx.fill();

  const visor = ctx.createRadialGradient(-21, -35, 3, 8, 6, 66);
  visor.addColorStop(0, '#3A4650');
  visor.addColorStop(0.5, '#111A22');
  visor.addColorStop(1, '#03070B');
  ctx.fillStyle = visor;
  ctx.beginPath();
  ctx.ellipse(0, 1, 55, 57, 0, 0, Math.PI * 2);
  ctx.fill();
  ctx.strokeStyle = '#899CAC';
  ctx.lineWidth = 4;
  ctx.stroke();

  const pixel = (x, y, w = 7, h = 7) => {
    ctx.fillStyle = '#24B9F0';
    ctx.fillRect(x, y, w, h);
  };
  if (expression === 'sleepy') {
    pixel(-29, -12, 18, 5);
    pixel(11, -12, 18, 5);
  } else if (expression === 'wow') {
    pixel(-28, -19, 15, 15);
    pixel(13, -19, 15, 15);
  } else if (expression === 'love') {
    [[-27, -18], [-21, -24], [-15, -18], [-21, -12],
      [14, -18], [20, -24], [26, -18], [20, -12]].forEach(([x, y]) => pixel(x, y));
  } else {
    pixel(-28, -17, 7, 13);
    pixel(-21, -10, 7, 7);
    pixel(14, -10, 7, 7);
    pixel(21, -17, 7, 13);
  }

  ctx.strokeStyle = '#24B9F0';
  ctx.lineWidth = 5;
  ctx.lineCap = 'round';
  ctx.beginPath();
  if (expression === 'wow') {
    ctx.ellipse(0, 23, 7, 9, 0, 0, Math.PI * 2);
    ctx.stroke();
  } else if (expression === 'sleepy') {
    ctx.moveTo(-11, 24);
    ctx.lineTo(11, 24);
    ctx.stroke();
  } else {
    ctx.moveTo(-13, 21);
    ctx.quadraticCurveTo(0, 34, 13, 21);
    ctx.stroke();
  }

  ctx.strokeStyle = '#8D9EAA';
  ctx.lineWidth = 4;
  ctx.beginPath();
  ctx.moveTo(43, -48);
  ctx.lineTo(57, -72);
  ctx.stroke();
  ctx.fillStyle = '#44C4EA';
  ctx.beginPath();
  ctx.arc(59, -75, 5, 0, Math.PI * 2);
  ctx.fill();
  ctx.restore();
}

function createOrbitFallback(canvas, pose) {
  let expression = 'cool';
  let time = 0;
  let raf;
  const render = () => {
    time += 0.025;
    drawOrbitFallback(canvas, expression, pose, time);
    raf = requestAnimationFrame(render);
  };
  const resize = () => drawOrbitFallback(canvas, expression, pose, time);
  window.addEventListener('resize', resize);
  render();

  return {
    setExpression(name) { expression = name; },
    dispose() {
      cancelAnimationFrame(raf);
      window.removeEventListener('resize', resize);
    },
  };
}

function cycleExpressions(expressions, interval) {
  let index = 0;
  return setInterval(() => {
    index = (index + 1) % expressions.length;
    setOrbitExpression(expressions[index]);
  }, interval);
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
  camera.position.set(0, 0.25, 3.8);
  camera.lookAt(0, 0.15, 0);

  try {
    _loginRenderer = new THREE.WebGLRenderer({ canvas, antialias: true, alpha: true });
  } catch {
    _loginFallback = createOrbitFallback(canvas, 'crossed');
    _loginExprTimer = cycleExpressions(['cool', 'happy', 'wow', 'sleepy', 'love'], 4000);
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

  const orbit = buildOrbit('crossed');
  orbit.scale.setScalar(1.12);
  orbit.position.y = -0.1;
  scene.add(orbit);

  _loginExprTimer = cycleExpressions(['cool', 'happy', 'wow', 'sleepy', 'love'], 4000);

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
  if (_loginFallback) { _loginFallback.dispose(); _loginFallback = null; }
}

// ═══════════════════════════════════════════════
//  CENTRO DEL MAPA
// ═══════════════════════════════════════════════
let _centerRaf, _centerRenderer, _centerExprTimer;

export function initOrbitCenter(canvas) {
  const scene  = new THREE.Scene();
  const camera = new THREE.PerspectiveCamera(50, 180 / 220, 0.1, 100);
  camera.position.set(0, 0.1, 2.6);
  camera.lookAt(0, 0.02, 0);

  try {
    _centerRenderer = new THREE.WebGLRenderer({ canvas, antialias: true, alpha: true });
  } catch {
    _centerFallback = createOrbitFallback(canvas, 'head');
    _centerExprTimer = cycleExpressions(['cool', 'happy', 'wow', 'love', 'sleepy'], 3500);
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

  const orbit = buildOrbitHead();
  orbit.scale.setScalar(1.8);
  scene.add(orbit);

  _centerExprTimer = cycleExpressions(['cool', 'happy', 'wow', 'love', 'sleepy'], 3500);

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
  if (_centerFallback) { _centerFallback.dispose(); _centerFallback = null; }
}