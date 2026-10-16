/**
 * storage.js — Capa de persistencia con localStorage.
 * Si en el futuro se conecta a una API, solo cambia este archivo.
 */

const KEYS = {
  RESERVAS: 'cl_reservas_v1',
  SESION:   'cl_sesion_v1',
};

// ── Reservas ────────────────────────────────────────────────────

export function getReservas() {
  try { return JSON.parse(localStorage.getItem(KEYS.RESERVAS) || '[]'); }
  catch { return []; }
}

export function setReservas(reservas) {
  localStorage.setItem(KEYS.RESERVAS, JSON.stringify(reservas));
}

export function agregarReserva(reserva) {
  const todas = getReservas();
  todas.push(reserva);
  setReservas(todas);
}

export function eliminarReserva(id) {
  setReservas(getReservas().filter(r => r.id !== id));
}

// ── Sesión ───────────────────────────────────────────────────────

export function setSesion(usuario) {
  sessionStorage.setItem(KEYS.SESION, JSON.stringify(usuario));
}

export function getSesion() {
  try { return JSON.parse(sessionStorage.getItem(KEYS.SESION) || 'null'); }
  catch { return null; }
}

export function clearSesion() {
  sessionStorage.removeItem(KEYS.SESION);
}
