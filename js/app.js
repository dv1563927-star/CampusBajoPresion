/**
 * app.js — Orquestador principal
 * --------------------------------
 * Conecta todos los módulos:
 *   auth → login/logout
 *   orbit3d → Orbit en login y en el centro del mapa
 *   solarmap → mapa solar con planetas/salones
 *   salon3d → modelo 3D del salón en panel lateral
 *   reservas → lógica de negocio
 *   ui → render, modales, toasts
 */

import { HORA_INICIO, HORA_FIN, SALONES } from './data.js';
import { initAuth, onLogin, onLogout, getCurrentUser } from './auth.js';
import {
  verificarDisponibilidad,
  confirmarReservaFinal,
  cancelarReserva,
  sugerirSalon,
  formatHora,
  horasLibres,
} from './reservas.js';
import { getReservas } from './storage.js';
import {
  showToast,
  openModal,
  closeModal,
  initModales,
  mostrarError,
  ocultarError,
  actualizarHint,
  mostrarModalSugerencia,
  mostrarConfirmacion,
  mostrarPanelSalon,
  ocultarPanelSalon,
  renderMisReservas,
  renderHorario,
} from './ui.js';
import { initOrbitLogin, disposeOrbitLogin, initOrbitCenter } from './orbit3d.js';
import { initSolarMap, refreshSolarMap } from './solarmap.js';
import { initSalon3D, disposeSalon3D } from './salon3d.js';

/* ── Estado ─────────────────────────────────────────────────── */
let sugerenciaPendiente = null;
let cancelarPendienteId = null;
let salonSeleccionado   = null;

/* ── Arranque ───────────────────────────────────────────────── */
document.addEventListener('DOMContentLoaded', () => {
  // Fondo de estrellas en el login
  initStarsCanvas();

  // Orbit 3D en el login
  initOrbitLogin(document.getElementById('orbitCanvas'));

  // Módulos base
  initModales();
  initAuth();

  // Callbacks de auth
  onLogin(usuario => {
    disposeOrbitLogin();
    mostrarAppScreen(usuario);
  });

  onLogout(() => {
    mostrarLoginScreen();
    initOrbitLogin(document.getElementById('orbitCanvas'));
  });

  // Formulario reserva
  document.getElementById('resEstudiantes').addEventListener('input', actualizarHint);
  document.getElementById('btnConfirmarReserva').addEventListener('click', handleBuscarSalon);
  document.getElementById('btnAceptarSugerencia').addEventListener('click', handleAceptarSugerencia);

  // Panel lateral
  document.getElementById('btnClosePanel').addEventListener('click', () => {
    ocultarPanelSalon();
    disposeSalon3D(document.getElementById('salon3dCanvas'));
    salonSeleccionado = null;
  });
  window.addEventListener('resize', ajustarPosicionPanelSalon);
  document.getElementById('btnAbrirReserva').addEventListener('click', () => {
    if (salonSeleccionado) abrirModalReserva(salonSeleccionado.id);
  });

  // Manos de Orbit
  document.getElementById('handMisReservas').addEventListener('click', () => {
    renderMisReservas(getCurrentUser());
    openModal('modalMisReservas');
  });
  document.getElementById('handHorario').addEventListener('click', () => {
    renderHorario();
    openModal('modalHorario');
  });

  document.getElementById('modalReserva').addEventListener('click', e => {
    if (e.target.id === 'modalReserva' || e.target.closest?.('[data-close="modalReserva"]')) {
      disposeSalon3D(document.getElementById('bookingSalonCanvas'));
    }
  });

  // Cancelar reserva
  document.getElementById('btnEjecutarCancelar').addEventListener('click', handleEjecutarCancelar);

  // Delegación global de clicks
  document.addEventListener('click', handleDelegatedClick);

  // Restaurar sesión al recargar
  const sesion = getCurrentUser();
  if (sesion) {
    disposeOrbitLogin();
    mostrarAppScreen(sesion);
  }
});

/* ── Pantallas ──────────────────────────────────────────────── */
function mostrarAppScreen(usuario) {
  // Ocultar login, mostrar app
  document.getElementById('loginScreen').style.display = 'none';
  document.getElementById('appScreen').classList.remove('hidden');

  // HUD
  document.getElementById('hudAvatar').textContent = usuario.nombre[0].toUpperCase();
  document.getElementById('hudName').textContent   = usuario.nombre;
  document.getElementById('hudArea').textContent   = `${usuario.area} · ${usuario.rol}`;

  // Iniciar mapa solar
  initSolarMap(
    document.getElementById('solarCanvas'),
    salon => seleccionarSalon(salon)
  );

  // Orbit flotando en el centro
  initOrbitCenter(document.getElementById('orbitCenterCanvas'));

  showToast(`BIENVENIDO/A, ${usuario.nombre.toUpperCase()} 🚀`, 'success');
}

function mostrarLoginScreen() {
  document.getElementById('appScreen').classList.add('hidden');
  document.getElementById('loginScreen').style.display = 'flex';
  ocultarPanelSalon();
  disposeSalon3D();
}

/* ── Seleccionar salón en el mapa ───────────────────────────── */
function seleccionarSalon(salon) {
  salonSeleccionado = salon;
  const usuario = getCurrentUser();

  // Determinar tipo para el 3D
  const tipo = getTipo(salon.id);

  // Iniciar modelo 3D en el panel
  initSalon3D(document.getElementById('salon3dCanvas'), tipo);

  // Mostrar info en el panel
  mostrarPanelSalon(salon, usuario);
  ajustarPosicionPanelSalon();
}

function ajustarPosicionPanelSalon() {
  const panel = document.getElementById('salonPanel');
  if (panel.classList.contains('hidden')) return;
  const hud = document.querySelector('.hud-header');
  panel.style.top = `${hud.getBoundingClientRect().height}px`;
}

function getTipo(salonId) {
  if (salonId === 1) return 'auditorio';
  if (salonId === 5 || salonId === 9) return 'lab';
  return 'simple';
}

/* ── Modal de reserva ───────────────────────────────────────── */
function abrirModalReserva(salonId = null) {
  sugerenciaPendiente = null;

  // Limpiar
  document.getElementById('resMateria').value     = '';
  document.getElementById('resEstudiantes').value = '';
  document.getElementById('sugerenciaWrap').classList.add('hidden');
  ocultarError('conflictoMsg');

  // Selects de hora
  const selIni = document.getElementById('resInicio');
  const selFin = document.getElementById('resFin');
  selIni.innerHTML = '';
  selFin.innerHTML = '';

  for (let h = HORA_INICIO; h < HORA_FIN; h++) {
    selIni.innerHTML += `<option value="${h}">${formatHora(h)}</option>`;
  }
  for (let h = HORA_INICIO + 1; h <= HORA_FIN; h++) {
    selFin.innerHTML += `<option value="${h}">${formatHora(h)}</option>`;
  }

  // Pre-seleccionar primera hora libre si se conoce el salón
  if (salonId !== null) {
    const libres = horasLibres(salonId);
    if (libres.length > 0) {
      selIni.value = libres[0];
      selFin.value = Math.min(libres[0] + 1, HORA_FIN);
    }
  }

  openModal('modalReserva');
  const salonVista = SALONES.find(salon => salon.id === salonId) ?? salonSeleccionado;
  const previewName = document.getElementById('bookingPreviewName');
  const previewCanvas = document.getElementById('bookingSalonCanvas');

  if (salonVista) {
    previewName.textContent = salonVista.nombre;
    initSalon3D(previewCanvas, getTipo(salonVista.id));
  } else {
    previewName.textContent = 'SALÓN POR ASIGNAR';
    disposeSalon3D(previewCanvas);
  }
}

/* ── PASO 1: Buscar salón ───────────────────────────────────── */
function handleBuscarSalon() {
  ocultarError('conflictoMsg');

  const datos = {
    materia:     document.getElementById('resMateria').value,
    estudiantes: parseInt(document.getElementById('resEstudiantes').value),
    inicio:      parseInt(document.getElementById('resInicio').value),
    fin:         parseInt(document.getElementById('resFin').value),
  };

  const resultado = verificarDisponibilidad(datos);

  if (resultado.error) {
    mostrarError('conflictoMsg', resultado.error);
    return;
  }

  sugerenciaPendiente = { ...resultado, datosFormulario: datos };

  disposeSalon3D(document.getElementById('bookingSalonCanvas'));
  closeModal('modalReserva');
  mostrarModalSugerencia(sugerenciaPendiente);
}

/* ── PASO 2: Aceptar sugerencia ─────────────────────────────── */
function handleAceptarSugerencia() {
  if (!sugerenciaPendiente) return;
  const usuario = getCurrentUser();
  if (!usuario) return;

  const { salon, datosFormulario } = sugerenciaPendiente;
  const { materia, estudiantes, inicio, fin } = datosFormulario;

  const reserva = confirmarReservaFinal({ materia, estudiantes, inicio, fin, salon, usuario });
  sugerenciaPendiente = null;

  closeModal('modalSugerencia');

  // Refrescar mapa y panel
  refreshSolarMap();
  if (salonSeleccionado) mostrarPanelSalon(salonSeleccionado, usuario);

  mostrarConfirmacion(reserva);
  showToast(`✔ "${reserva.salonNombre}" RESERVADO`, 'success');
}

/* ── Cancelar reserva ───────────────────────────────────────── */
function handleEjecutarCancelar() {
  if (cancelarPendienteId === null) return;
  cancelarReserva(cancelarPendienteId);
  cancelarPendienteId = null;
  closeModal('modalCancelar');

  const usuario = getCurrentUser();
  renderMisReservas(usuario);
  refreshSolarMap();
  if (salonSeleccionado) mostrarPanelSalon(salonSeleccionado, usuario);
  showToast('RESERVA CANCELADA', 'warning');
}

/* ── Delegación de eventos ──────────────────────────────────── */
function handleDelegatedClick(e) {
  const btn = e.target.closest('[data-action]');
  if (!btn) return;

  if (btn.dataset.action === 'cancelar') {
    const id      = parseInt(btn.dataset.id);
    const reserva = getReservas().find(r => r.id === id);
    if (!reserva) return;

    cancelarPendienteId = id;
    document.getElementById('cancelarMsg').innerHTML =
      `¿Cancelar la reserva del salón <strong>${reserva.salonNombre}</strong> ` +
      `de ${formatHora(reserva.horaInicio)} a ${formatHora(reserva.horaFin)}?`;
    openModal('modalCancelar');
  }
}

/* ── Canvas de estrellas del login ──────────────────────────── */
function initStarsCanvas() {
  const canvas = document.getElementById('starsCanvas');
  const ctx    = canvas.getContext('2d');

  const resize = () => {
    canvas.width  = window.innerWidth;
    canvas.height = window.innerHeight;
  };
  resize();
  window.addEventListener('resize', resize);

  // Generar estrellas
  const STARS = Array.from({ length: 350 }, () => ({
    x: Math.random(),
    y: Math.random(),
    r: Math.random() * 1.3 + .2,
    a: Math.random() * .8 + .1,
    t: Math.random() * Math.PI * 2,
    s: .004 + Math.random() * .008,
  }));

  // Algunas nebulosas de color
  const NEBS = [
    { x:.2, y:.3, r:300, c:'rgba(26,60,120,' },
    { x:.8, y:.7, r:250, c:'rgba(80,20,140,' },
    { x:.5, y:.9, r:200, c:'rgba(0,80,120,'  },
  ];

  const draw = () => {
    requestAnimationFrame(draw);
    ctx.clearRect(0, 0, canvas.width, canvas.height);

    // Fondo negro espacio
    ctx.fillStyle = '#020408';
    ctx.fillRect(0, 0, canvas.width, canvas.height);

    // Nebulosas
    NEBS.forEach(n => {
      const grd = ctx.createRadialGradient(
        n.x * canvas.width, n.y * canvas.height, 0,
        n.x * canvas.width, n.y * canvas.height, n.r
      );
      grd.addColorStop(0,   n.c + '.12)');
      grd.addColorStop(.5,  n.c + '.05)');
      grd.addColorStop(1,   'transparent');
      ctx.fillStyle = grd;
      ctx.fillRect(0, 0, canvas.width, canvas.height);
    });

    // Estrellas
    STARS.forEach(s => {
      s.t += s.s;
      const a = s.a * (.5 + .5 * Math.sin(s.t));
      ctx.beginPath();
      ctx.arc(s.x * canvas.width, s.y * canvas.height, s.r, 0, Math.PI * 2);
      ctx.fillStyle = `rgba(200,220,255,${a})`;
      ctx.fill();
    });
  };
  draw();
}
