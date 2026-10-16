/**
 * solarmap.js
 * -----------
 * Mapa solar interactivo renderizado en un <canvas> 2D.
 */

import { SALONES, HORA_INICIO, HORA_FIN } from './data.js';
import { horasLibres } from './reservas.js';

const PLANET_COLORS = [
  { base:'#286F9E', mid:'#16466D', dark:'#091D32', glow:'#83B8D1', cloud:'#D6E4E8', ring:false, bands:true  },
  { base:'#A35C42', mid:'#673A34', dark:'#281B25', glow:'#D39773', cloud:'#E6C3A4', ring:false, bands:false },
  { base:'#527A75', mid:'#315450', dark:'#132D32', glow:'#8FB4A5', cloud:'#D4D6B7', ring:false, bands:false },
  { base:'#BB9860', mid:'#786044', dark:'#302838', glow:'#E5C88C', cloud:'#F1DFB7', ring:true,  bands:true  },
  { base:'#A94F43', mid:'#6E3034', dark:'#2B1B2D', glow:'#D38A70', cloud:'#E8C5A2', ring:false, bands:false },
  { base:'#69777C', mid:'#45535B', dark:'#202D37', glow:'#A4B6B8', cloud:'#D9D8C9', ring:false, bands:false },
  { base:'#416F9A', mid:'#294B70', dark:'#13283F', glow:'#91B9D0', cloud:'#D7E0DC', ring:false, bands:true  },
  { base:'#758052', mid:'#4C573D', dark:'#222D2A', glow:'#B3B18A', cloud:'#DFD4AD', ring:false, bands:false },
  { base:'#86725F', mid:'#574A45', dark:'#28242A', glow:'#C2A98B', cloud:'#E5D3B6', ring:true,  bands:true  },
];

let canvas, ctx, W, H, cx, cy;
let planets = [];
let stars   = [];
let animId;
let hoveredPlanet  = null;
let onSelectSalon  = () => {};

const PLANET_SIZES = [52, 46, 43, 55, 48, 42, 45, 43, 51];

export function initSolarMap(c, onSelect) {
  canvas = c;
  onSelectSalon = onSelect;

  resize();
  buildPlanets();
  buildStars(280);

  canvas.addEventListener('mousemove', onMouseMove);
  canvas.addEventListener('click',     onMouseClick);
  canvas.addEventListener('mouseleave', () => { hoveredPlanet = null; hidePlanetTooltip(); });
  window.addEventListener('resize', () => { resize(); buildPlanets(); });

  loop();
}

export function destroySolarMap() {
  if (animId) cancelAnimationFrame(animId);
}

export function refreshSolarMap() {
  buildPlanets();
}

function resize() {
  W = canvas.parentElement.clientWidth  || 900;
  H = canvas.parentElement.clientHeight || 600;
  canvas.width  = W;
  canvas.height = H;
  ctx = canvas.getContext('2d');
  cx  = W / 2;
  cy  = H / 2;
}

function buildPlanets() {
  const orbitR = Math.min(W, H) * 0.36;
  const sizeScale = Math.min(1, Math.max(0.62, Math.min(W / 900, H / 650)));

  planets = SALONES.map((salon, i) => {
    const angle    = (i / SALONES.length) * Math.PI * 2 - Math.PI / 2;
    const size     = PLANET_SIZES[i] * sizeScale;
    const color    = PLANET_COLORS[i];
    const speed    = .000035;
    const libre    = horasLibres(salon.id).length;
    const occupied = (HORA_FIN - HORA_INICIO) - libre;
    const details = Array.from({ length: 30 }, () => {
      const a = Math.random() * Math.PI * 2;
      const r = Math.sqrt(Math.random()) * 0.82;
      return {
        x: Math.cos(a) * r,
        y: Math.sin(a) * r,
        rx: 0.025 + Math.random() * 0.085,
        ry: 0.018 + Math.random() * 0.055,
        alpha: 0.06 + Math.random() * 0.18,
        light: Math.random() > 0.5,
      };
    });

    return { salon, angle, orbitR, size, color, speed, libre, occupied, details, x: 0, y: 0, hovered: false };
  });
}

function buildStars(count) {
  stars = Array.from({ length: count }, () => ({
    x:       Math.random() * 1400 - 200,
    y:       Math.random() * 900  - 100,
    r:       Math.random() * 1.2 + .2,
    alpha:   Math.random() * .7 + .15,
    twinkle: Math.random() * Math.PI * 2,
    speed:   .008 + Math.random() * .015,
  }));
}

function loop() {
  animId = requestAnimationFrame(loop);
  draw();
}

function draw() {
  ctx.clearRect(0, 0, W, H);

  const bg = ctx.createRadialGradient(cx, cy, 0, cx, cy, Math.max(W, H) * .75);
  bg.addColorStop(0,   'rgba(6,12,24,1)');
  bg.addColorStop(.5,  'rgba(4,8,18,1)');
  bg.addColorStop(1,   'rgba(2,4,10,1)');
  ctx.fillStyle = bg;
  ctx.fillRect(0, 0, W, H);

  const neb = ctx.createRadialGradient(cx, cy, 0, cx, cy, 280);
  neb.addColorStop(0,   'rgba(26,60,120,.18)');
  neb.addColorStop(.5,  'rgba(80,30,150,.08)');
  neb.addColorStop(1,   'transparent');
  ctx.fillStyle = neb;
  ctx.fillRect(0, 0, W, H);

  const now = performance.now() * .001;
  stars.forEach(s => {
    s.twinkle += s.speed;
    const a = s.alpha * (.6 + .4 * Math.sin(s.twinkle));
    ctx.beginPath();
    ctx.arc(s.x, s.y, s.r, 0, Math.PI * 2);
    ctx.fillStyle = `rgba(200,220,255,${a})`;
    ctx.fill();
  });

  // Estrella central DETRÁS de todo
  drawCentralStar();

  // Anillos de órbita
  planets.forEach(p => {
    ctx.beginPath();
    ctx.arc(cx, cy, p.orbitR, 0, Math.PI * 2);
    ctx.strokeStyle = p.hovered ? 'rgba(200,164,90,.25)' : 'rgba(30,60,120,.2)';
    ctx.lineWidth = p.hovered ? 1.5 : .8;
    ctx.stroke();
  });

  // Planetas
  planets.forEach(p => {
    p.angle += p.speed;
    p.x = cx + Math.cos(p.angle) * p.orbitR;
    p.y = cy + Math.sin(p.angle) * p.orbitR;

    const isHovered = p === hoveredPlanet;
    const pulse = 1 + 0.03 * Math.sin(now * 2 + p.angle);
    const R = p.size * pulse;

    ctx.save();
    ctx.shadowColor = p.color.glow;
    ctx.shadowBlur  = isHovered ? 28 : 12;

    if (p.color.ring) {
      ctx.save();
      ctx.translate(p.x, p.y);
      ctx.rotate(-0.35 + p.angle * 0.12);
      ctx.scale(1, 0.26);
      ctx.beginPath();
      ctx.arc(0, 0, R * 2.0, 0, Math.PI * 2);
      ctx.strokeStyle = p.color.glow + 'BB';
      ctx.lineWidth = R * 0.16;
      ctx.stroke();
      ctx.beginPath();
      ctx.arc(0, 0, R * 1.65, 0, Math.PI * 2);
      ctx.strokeStyle = p.color.cloud + '77';
      ctx.lineWidth = R * 0.06;
      ctx.stroke();
      ctx.restore();
    }

    const grd = ctx.createRadialGradient(
      p.x - R * 0.35, p.y - R * 0.4, R * 0.05,
      p.x, p.y, R * 1.05
    );
    grd.addColorStop(0.00, p.color.cloud);
    grd.addColorStop(0.15, p.color.glow);
    grd.addColorStop(0.48, p.color.base);
    grd.addColorStop(0.82, p.color.mid);
    grd.addColorStop(1.00, p.color.dark);

    ctx.beginPath();
    ctx.arc(p.x, p.y, R, 0, Math.PI * 2);
    ctx.fillStyle = grd;
    ctx.fill();

    if (p.color.bands) {
      ctx.save();
      ctx.beginPath();
      ctx.arc(p.x, p.y, R, 0, Math.PI * 2);
      ctx.clip();
      ctx.globalAlpha = 0.15;
      for (let b = -3; b <= 3; b++) {
        const by = p.y + b * R * 0.20;
        ctx.fillStyle = (b % 2 === 0) ? p.color.cloud : p.color.dark;
        ctx.beginPath();
        ctx.ellipse(p.x, by, R * 1.05, R * 0.085, 0, 0, Math.PI * 2);
        ctx.fill();
      }
      ctx.restore();
    }

    ctx.save();
    ctx.beginPath();
    ctx.arc(p.x, p.y, R, 0, Math.PI * 2);
    ctx.clip();
    p.details.forEach(detail => {
      ctx.beginPath();
      ctx.ellipse(p.x + detail.x * R, p.y + detail.y * R,
                  detail.rx * R, detail.ry * R,
                  detail.y * 0.35, 0, Math.PI * 2);
      ctx.fillStyle = detail.light
        ? `rgba(220,232,220,${detail.alpha})`
        : `rgba(10,18,28,${detail.alpha + 0.05})`;
      ctx.fill();
    });
    ctx.restore();

    const spec = ctx.createRadialGradient(
      p.x - R * 0.42, p.y - R * 0.48, 0,
      p.x - R * 0.42, p.y - R * 0.48, R * 0.55
    );
    spec.addColorStop(0, 'rgba(255,255,255,0.28)');
    spec.addColorStop(1, 'rgba(255,255,255,0)');
    ctx.beginPath();
    ctx.arc(p.x, p.y, R, 0, Math.PI * 2);
    ctx.fillStyle = spec;
    ctx.fill();

    const term = ctx.createRadialGradient(
      p.x - R * 0.45, p.y - R * 0.38, R * 0.05,
      p.x + R * 0.2, p.y + R * 0.1, R * 1.35
    );
    term.addColorStop(0, 'rgba(0,0,0,0)');
    term.addColorStop(0.62, 'rgba(0,0,0,0.08)');
    term.addColorStop(1, 'rgba(0,0,0,0.68)');
    ctx.beginPath();
    ctx.arc(p.x, p.y, R, 0, Math.PI * 2);
    ctx.fillStyle = term;
    ctx.fill();

    ctx.restore();

    const dotColor = p.libre > 0 ? '#22c55e' : '#ef4444';
    ctx.beginPath();
    ctx.arc(p.x + R * 0.72, p.y - R * 0.72, 5.5, 0, Math.PI * 2);
    ctx.fillStyle = dotColor;
    ctx.shadowColor = dotColor;
    ctx.shadowBlur = 12;
    ctx.fill();
    ctx.shadowBlur = 0;

    ctx.fillStyle = isHovered ? '#E8C97A' : 'rgba(200,220,255,.8)';
    ctx.font = isHovered ? 'bold 13px "Segoe UI"' : '11px "Segoe UI"';
    ctx.textAlign = 'center';
    ctx.fillText(p.salon.nombre, p.x, p.y + R + 16);

    if (isHovered) {
      ctx.beginPath();
      ctx.arc(p.x, p.y, R + 8, 0, Math.PI * 2);
      ctx.strokeStyle = '#C8A45A';
      ctx.lineWidth = 1.5;
      ctx.setLineDash([5, 5]);
      ctx.stroke();
      ctx.setLineDash([]);
    }
  });
}

function drawCentralStar() {
  const r   = 18;
  const now = performance.now() * .001;
  const pulse = 1 + .1 * Math.sin(now * 1.5);

  const outerGlow = ctx.createRadialGradient(cx, cy, 0, cx, cy, r * 4 * pulse);
  outerGlow.addColorStop(0,   'rgba(0,212,255,.15)');
  outerGlow.addColorStop(.4,  'rgba(26,143,227,.08)');
  outerGlow.addColorStop(1,   'transparent');
  ctx.fillStyle = outerGlow;
  ctx.beginPath();
  ctx.arc(cx, cy, r * 4 * pulse, 0, Math.PI * 2);
  ctx.fill();

  const grad = ctx.createRadialGradient(cx - r*.3, cy - r*.3, 1, cx, cy, r * pulse);
  grad.addColorStop(0, '#FFFFFF');
  grad.addColorStop(.3, '#00D4FF');
  grad.addColorStop(1, '#0055AA');
  ctx.beginPath();
  ctx.arc(cx, cy, r * pulse, 0, Math.PI * 2);
  ctx.fillStyle = grad;
  ctx.shadowColor = '#00D4FF';
  ctx.shadowBlur  = 30;
  ctx.fill();
  ctx.shadowBlur = 0;
}

function getPlanetAt(mx, my) {
  return planets.find(p => {
    const dx = p.x - mx;
    const dy = p.y - my;
    return Math.sqrt(dx*dx + dy*dy) < p.size + 8;
  }) ?? null;
}

function onMouseMove(e) {
  const rect  = canvas.getBoundingClientRect();
  const mx    = e.clientX - rect.left;
  const my    = e.clientY - rect.top;
  const found = getPlanetAt(mx, my);

  planets.forEach(p => { p.hovered = p === found; });
  hoveredPlanet = found;

  if (found) {
    canvas.style.cursor = 'pointer';
    showPlanetTooltip(found, e.clientX, e.clientY);
  } else {
    canvas.style.cursor = 'crosshair';
    hidePlanetTooltip();
  }
}

function onMouseClick(e) {
  const rect  = canvas.getBoundingClientRect();
  const mx    = e.clientX - rect.left;
  const my    = e.clientY - rect.top;
  const found = getPlanetAt(mx, my);
  if (found) onSelectSalon(found.salon);
}

function showPlanetTooltip(planet, cx, cy) {
  const tip = document.getElementById('planetTooltip');
  if (!tip) return;
  tip.querySelector('.pt-name').textContent   = planet.salon.nombre;
  tip.querySelector('.pt-cap').textContent    = `👥 Capacidad: ${planet.salon.capacidad}`;
  const statusEl = tip.querySelector('.pt-status');
  if (planet.libre > 0) {
    statusEl.textContent  = `✅ ${planet.libre} horas libres`;
    statusEl.className    = 'pt-status free';
  } else {
    statusEl.textContent  = '🔴 Sin disponibilidad';
    statusEl.className    = 'pt-status busy';
  }
  tip.style.left = (cx + 14) + 'px';
  tip.style.top  = (cy - 10) + 'px';
  tip.classList.remove('hidden');
}

function hidePlanetTooltip() {
  const tip = document.getElementById('planetTooltip');
  if (tip) tip.classList.add('hidden');
}