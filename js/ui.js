/**
 * ui.js
 * -----
 * Toasts, modales, render de panel lateral, mis reservas,
 * horario general y confirmación de reserva.
 * Estilo Warframe/CampusLands espacial.
 */

import { SALONES, HORA_INICIO, HORA_FIN } from './data.js';
import {
  formatHora,
  estaOcupado,
  horasLibres,
  reservasDeSalon,
  todasLasReservas,
  reservasDeUsuario,
  sugerirSalon,
} from './reservas.js';

/* ══════════════════════════════════════════
   TOASTS
══════════════════════════════════════════ */
const ICONS = { success:'✔', error:'✖', warning:'⚠', info:'◆' };

export function showToast(msg, tipo = 'info', dur = 3800) {
  const c  = document.getElementById('toastContainer');
  const el = document.createElement('div');
  el.className = `toast toast-${tipo}`;
  el.innerHTML = `<span>${ICONS[tipo]}</span><span>${msg}</span>`;
  c.appendChild(el);
  setTimeout(() => { el.style.opacity = '0'; }, dur);
  setTimeout(() => el.remove(), dur + 400);
}

/* ══════════════════════════════════════════
   MODALES
══════════════════════════════════════════ */
export function openModal(id)  { document.getElementById(id).classList.remove('hidden'); }
export function closeModal(id) { document.getElementById(id).classList.add('hidden'); }

export function initModales() {
  // Cerrar al click en overlay
  document.querySelectorAll('.modal-overlay').forEach(o => {
    o.addEventListener('click', e => { if (e.target === o) closeModal(o.id); });
  });
  // Botones data-close
  document.addEventListener('click', e => {
    const id = e.target.closest('[data-close]')?.dataset.close;
    if (id) closeModal(id);
  });
}

export function mostrarError(elId, msg) {
  const el = document.getElementById(elId);
  el.textContent = msg;
  el.classList.remove('hidden');
}
export function ocultarError(elId) {
  document.getElementById(elId).classList.add('hidden');
}

/* ══════════════════════════════════════════
   PANEL LATERAL DE SALÓN
══════════════════════════════════════════ */

/**
 * Rellena y muestra el panel lateral con info del salón.
 * @param {Object} salon
 * @param {Object} usuario
 */
export function mostrarPanelSalon(salon, usuario) {
  const libres   = horasLibres(salon.id);
  const ocupadas = (HORA_FIN - HORA_INICIO) - libres.length;
  const resSalon = reservasDeSalon(salon.id);

  // Nombre
  document.getElementById('panelNombre').textContent = salon.nombre.toUpperCase();

  // Badges
  const disponible = libres.length > 0;
  document.getElementById('panelBadges').innerHTML = `
    <span class="badge-wf ${disponible ? 'badge-wf-ok' : 'badge-wf-busy'}">
      ${disponible ? '✔ DISPONIBLE' : '✖ OCUPADO'}
    </span>
    <span class="badge-wf badge-wf-cap">👥 CAP. ${salon.capacidad}</span>
    <span class="badge-wf badge-wf-area">${usuario.area}</span>
  `;

  // Timeline
  const horas = [];
  for (let h = HORA_INICIO; h < HORA_FIN; h++) horas.push(h);

  const tlSlots = horas.map(h => {
    const ocp = estaOcupado(salon.id, h);
    return `<div class="ptl-slot ${ocp ? 'ptl-taken' : 'ptl-free'}"
                 title="${formatHora(h)}">${h}</div>`;
  }).join('');

  const tlLabels = horas.map(h =>
    `<div class="ptl-label">${h}</div>`
  ).join('');

  document.getElementById('panelTimeline').innerHTML = `
    <div class="ptl-labels">${tlLabels}</div>
    <div class="panel-timeline">${tlSlots}</div>
    <div style="font-size:.65rem;color:var(--text-muted);margin-top:.3rem;">
      🟢 ${libres.length} libres &nbsp; 🔴 ${ocupadas} ocupadas
    </div>
  `;

  // Reservas actuales del salón
  if (resSalon.length > 0) {
    document.getElementById('panelReservas').innerHTML = `
      <p class="panel-tl-label" style="margin-top:.8rem;">RESERVAS ACTIVAS</p>
      ${resSalon.map(r => `
        <div class="panel-reserva-item">
          <div>
            <span class="pri-name">${r.userName}</span>
            <div style="font-size:.68rem;color:var(--text-muted);">${r.materia}</div>
          </div>
          <div class="pri-time">${formatHora(r.horaInicio)}–${formatHora(r.horaFin)}</div>
        </div>
      `).join('')}
    `;
  } else {
    document.getElementById('panelReservas').innerHTML = '';
  }

  // Mostrar panel
  document.getElementById('salonPanel').classList.remove('hidden');
}

export function ocultarPanelSalon() {
  document.getElementById('salonPanel').classList.add('hidden');
}

/* ══════════════════════════════════════════
   HINT EN TIEMPO REAL (formulario reserva)
══════════════════════════════════════════ */
export function actualizarHint() {
  const est  = parseInt(document.getElementById('resEstudiantes').value);
  const wrap = document.getElementById('sugerenciaWrap');

  if (!est || est < 1) { wrap.classList.add('hidden'); return; }

  const res = sugerirSalon(est);
  if (!res) { wrap.classList.add('hidden'); return; }

  if (res.error) {
    wrap.style.borderLeftColor = '#EF4444';
    wrap.textContent = res.error;
  } else {
    wrap.style.borderLeftColor = 'var(--wf-blue)';
    wrap.textContent =
      `◆ Salón sugerido para ${est} estudiantes: "${res.salon.nombre}" (cap. ${res.salon.capacidad})`;
  }
  wrap.classList.remove('hidden');
}

/* ══════════════════════════════════════════
   MODAL SUGERENCIA (paso 2)
══════════════════════════════════════════ */
export function mostrarModalSugerencia({ salon, hayConflictoEnIdeal, salonIdeal, datosFormulario }) {
  const { materia, estudiantes, inicio, fin } = datosFormulario;

  let nota = '';
  if (hayConflictoEnIdeal && salon.id !== salonIdeal?.id) {
    nota = `<div class="suggest-note">
      ◆ El salón ideal "<strong>${salonIdeal.nombre}</strong>" (cap.${salonIdeal.capacidad})
      está ocupado en ese horario. Se asignó el siguiente disponible.
    </div>`;
  }

  document.getElementById('sugerenciaDetalle').innerHTML = `
    <div class="suggest-salon-name">🏫 ${salon.nombre}</div>
    <div class="suggest-details">
      <span>👥 Capacidad: <strong>${salon.capacidad}</strong></span>
      <span>📚 Estudiantes: <strong>${estudiantes}</strong></span>
    </div>
    ${nota}
  `;

  document.getElementById('sugerenciaResumen').innerHTML = crRows([
    ['Materia', materia],
    ['Horario', `${formatHora(inicio)} – ${formatHora(fin)}`],
    ['Estudiantes', estudiantes],
  ]);

  openModal('modalSugerencia');
}

/* ══════════════════════════════════════════
   CONFIRMACIÓN EXITOSA
══════════════════════════════════════════ */
export function mostrarConfirmacion(r) {
  document.getElementById('confirmCardContent').innerHTML = crRows([
    ['Salón asignado',  `🏫 ${r.salonNombre}`],
    ['Capacidad',       `👥 ${r.capacidad}`],
    ['Estudiantes',     r.estudiantes],
    ['Materia',         r.materia],
    ['Horario',         `${formatHora(r.horaInicio)} – ${formatHora(r.horaFin)}`],
    ['Reservado por',   r.userName],
    ['Área',            r.area],
  ]);
  openModal('modalConfirm');
}

/* ══════════════════════════════════════════
   MIS RESERVAS
══════════════════════════════════════════ */
export function renderMisReservas(usuario) {
  const mis = reservasDeUsuario(usuario.user);
  const el  = document.getElementById('misReservasContent');

  if (mis.length === 0) {
    el.innerHTML = `
      <div style="text-align:center;padding:3rem;color:var(--text-muted);">
        <div style="font-size:2.5rem;margin-bottom:.75rem;">◇</div>
        <p style="letter-spacing:.08em;font-size:.85rem;">SIN RESERVAS ACTIVAS</p>
      </div>`;
    return;
  }

  el.innerHTML = `
    <div class="reservas-table-wrap">
      <table>
        <thead>
          <tr>
            <th>SALÓN</th><th>CAP.</th><th>MATERIA</th>
            <th>ESTUDIANTES</th><th>HORARIO</th><th>ACCIÓN</th>
          </tr>
        </thead>
        <tbody>
          ${mis.map(r => `
            <tr>
              <td><strong>${r.salonNombre}</strong></td>
              <td>👥 ${r.capacidad}</td>
              <td>${r.materia}</td>
              <td>${r.estudiantes}</td>
              <td style="white-space:nowrap">${formatHora(r.horaInicio)}–${formatHora(r.horaFin)}</td>
              <td>
                <button class="btn-wf-ghost" style="font-size:.7rem;padding:.3rem .7rem;"
                        data-action="cancelar" data-id="${r.id}">
                  ✖ CANCELAR
                </button>
              </td>
            </tr>
          `).join('')}
        </tbody>
      </table>
    </div>`;
}

/* ══════════════════════════════════════════
   HORARIO GENERAL
══════════════════════════════════════════ */
export function renderHorario() {
  const horas = [];
  for (let h = HORA_INICIO; h < HORA_FIN; h++) horas.push(h);

  const headerCols = horas.map(h => `<th>${formatHora(h)}</th>`).join('');

  const filas = SALONES.map(salon => {
    const celdas = horas.map(h => {
      const r = todasLasReservas().find(
        rv => rv.salonId === salon.id && h >= rv.horaInicio && h < rv.horaFin
      );
      return r
        ? `<td class="htbl-taken" title="${r.userName} · ${r.materia}">${r.area.split(' ')[0]}</td>`
        : `<td class="htbl-free" title="Libre">✔</td>`;
    }).join('');

    return `<tr>
      <td>${salon.nombre}</td>
      <td>👥 ${salon.capacidad}</td>
      ${celdas}
    </tr>`;
  }).join('');

  document.getElementById('horarioContent').innerHTML = `
    <div class="horario-table-wrap">
      <table class="horario-tbl">
        <thead>
          <tr>
            <th>SALÓN</th><th>CAP.</th>${headerCols}
          </tr>
        </thead>
        <tbody>${filas}</tbody>
      </table>
    </div>
    <div style="display:flex;gap:1rem;margin-top:.6rem;font-size:.72rem;color:var(--text-muted);">
      <span><span style="display:inline-block;width:12px;height:12px;background:rgba(26,143,227,.3);border-radius:2px;margin-right:.3rem;vertical-align:middle;"></span>Libre</span>
      <span><span style="display:inline-block;width:12px;height:12px;background:rgba(123,47,190,.3);border-radius:2px;margin-right:.3rem;vertical-align:middle;"></span>Ocupado</span>
    </div>`;
}

/* ══════════════════════════════════════════
   HELPER
══════════════════════════════════════════ */
function crRows(pairs) {
  return pairs.map(([label, val]) => `
    <div class="cr-row">
      <span class="cr-label">${label}</span>
      <span class="cr-value">${val}</span>
    </div>`).join('');
}
