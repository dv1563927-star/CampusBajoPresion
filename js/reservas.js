/**
 * reservas.js
 * -----------
 * Lógica de negocio del sistema de reservas.
 *
 * FLUJO DE 2 PASOS (nuevo comportamiento):
 *   1. verificarDisponibilidad() → detecta si hay conflicto en el salón
 *      preferido y busca alternativa, pero NO guarda nada todavía.
 *   2. confirmarReservaFinal()   → recibe los datos ya aprobados por el
 *      usuario y persiste la reserva.
 *
 * Así el usuario siempre sabe qué salón se le va a asignar antes
 * de que se concrete la reserva.
 */

import { SALONES, HORA_INICIO, HORA_FIN, CAPACIDAD_MAX } from './data.js';
import { getReservas, agregarReserva, eliminarReserva } from './storage.js';

// ── Helpers de horas ─────────────────────────────────────────────

/**
 * Formatea una hora numérica en texto legible.
 * @param {number} h   ej: 14 → "2:00 PM"
 * @returns {string}
 */
export function formatHora(h) {
  const suffix = h >= 12 ? 'PM' : 'AM';
  const hr = h > 12 ? h - 12 : h === 0 ? 12 : h;
  return `${hr}:00 ${suffix}`;
}

/**
 * Devuelve true si la hora está ocupada en el salón dado.
 * @param {number} salonId
 * @param {number} hora
 * @returns {boolean}
 */
export function estaOcupado(salonId, hora) {
  return getReservas().some(
    r => r.salonId === salonId && hora >= r.horaInicio && hora < r.horaFin
  );
}

/**
 * Devuelve array de horas libres (enteros) de un salón.
 * @param {number} salonId
 * @returns {number[]}
 */
export function horasLibres(salonId) {
  const libres = [];
  for (let h = HORA_INICIO; h < HORA_FIN; h++) {
    if (!estaOcupado(salonId, h)) libres.push(h);
  }
  return libres;
}

/**
 * Devuelve true si [inicio, fin) colisiona con alguna reserva del salón.
 * @param {number} salonId
 * @param {number} inicio
 * @param {number} fin
 * @param {number} [excludeId]
 * @returns {boolean}
 */
export function hayConflicto(salonId, inicio, fin, excludeId = null) {
  return getReservas().some(r => {
    if (r.id === excludeId) return false;
    if (r.salonId !== salonId) return false;
    return inicio < r.horaFin && fin > r.horaInicio;
  });
}

// ── PASO 1: Verificar disponibilidad (sin guardar) ───────────────

/**
 * Valida los datos del formulario y busca el mejor salón disponible.
 * NO persiste nada — solo devuelve la información para que el usuario
 * pueda confirmar o rechazar la sugerencia.
 *
 * @param {{ materia, estudiantes, inicio, fin }} datos
 * @returns {{
 *   salon: Object,       ← salón encontrado
 *   hayConflictoEnIdeal: boolean,  ← true si el salón más pequeño estaba ocupado
 *   salonIdeal: Object|null        ← el salón ideal aunque esté ocupado
 * } | { error: string }}
 */
export function verificarDisponibilidad({ materia, estudiantes, inicio, fin }) {
  // ── Validaciones de formulario ──
  if (!materia || !materia.trim()) {
    return { error: '⚠️ Ingresa el nombre de la materia o actividad.' };
  }
  if (!estudiantes || isNaN(estudiantes) || Number(estudiantes) < 1) {
    return { error: '⚠️ Ingresa un número válido de estudiantes (mínimo 1).' };
  }
  if (fin <= inicio) {
    return { error: '⚠️ La hora de fin debe ser mayor a la hora de inicio.' };
  }
  if (inicio < HORA_INICIO || fin > HORA_FIN) {
    return {
      error: `⚠️ El horario debe estar entre ${formatHora(HORA_INICIO)} y ${formatHora(HORA_FIN)}.`,
    };
  }

  const n = Number(estudiantes);

  // ── Validar capacidad máxima del sistema ──
  if (n > CAPACIDAD_MAX) {
    return {
      error: `❌ Con ${n} estudiantes superas la capacidad máxima del sistema (${CAPACIDAD_MAX} en el Auditorio). No es posible asignar ningún salón.`,
    };
  }

  // ── Salones con capacidad suficiente (menor a mayor) ──
  const aptos = SALONES
    .filter(s => s.capacidad >= n)
    .sort((a, b) => a.capacidad - b.capacidad);

  if (aptos.length === 0) {
    return { error: `❌ Ningún salón tiene capacidad para ${n} estudiantes.` };
  }

  // ── El salón "ideal" es el más pequeño que cabe la cantidad ──
  const salonIdeal = aptos[0];

  // ── Buscar el primero que no tenga conflicto en el horario ──
  const salonDisponible = aptos.find(s => !hayConflicto(s.id, inicio, fin));

  if (!salonDisponible) {
    return {
      error: `⚠️ Todos los salones con capacidad ≥ ${n} están ocupados de ${formatHora(inicio)} a ${formatHora(fin)}. Prueba otro horario.`,
    };
  }

  return {
    salon:               salonDisponible,
    hayConflictoEnIdeal: hayConflicto(salonIdeal.id, inicio, fin),
    salonIdeal:          salonIdeal,
  };
}

// ── PASO 2: Confirmar y guardar la reserva ───────────────────────

/**
 * Persiste la reserva con los datos ya aprobados por el usuario.
 * Solo debe llamarse después de que el usuario aceptó la sugerencia.
 *
 * @param {{ materia, estudiantes, inicio, fin, salon, usuario }} datos
 * @returns {Object}  la reserva creada
 */
export function confirmarReservaFinal({ materia, estudiantes, inicio, fin, salon, usuario }) {
  const nueva = {
    id:            Date.now(),
    salonId:       salon.id,
    salonNombre:   salon.nombre,
    capacidad:     salon.capacidad,
    userId:        usuario.user,
    userName:      usuario.nombre,
    area:          usuario.area,
    materia:       materia.trim(),
    estudiantes:   Number(estudiantes),
    horaInicio:    inicio,
    horaFin:       fin,
    fechaCreacion: new Date().toISOString(),
  };

  agregarReserva(nueva);
  return nueva;
}

// ── Cancelar ─────────────────────────────────────────────────────

/**
 * Elimina una reserva por id.
 * @param {number} id
 */
export function cancelarReserva(id) {
  eliminarReserva(id);
}

// ── Sugerencia en tiempo real (hint del formulario) ──────────────

/**
 * Para una cantidad de estudiantes, sugiere el salón más pequeño
 * con espacio libre (sin considerar el horario exacto todavía).
 * Usado para el hint en tiempo real mientras el usuario escribe.
 *
 * @param {number} estudiantes
 * @returns {{ salon: Object }|{ error: string }|null}
 */
export function sugerirSalon(estudiantes) {
  if (!estudiantes || estudiantes < 1) return null;

  if (estudiantes > CAPACIDAD_MAX) {
    return {
      error: `❌ Con ${estudiantes} estudiantes superas la capacidad máxima (${CAPACIDAD_MAX}). Ningún salón puede albergarlos.`,
    };
  }

  const apto = SALONES
    .filter(s => s.capacidad >= estudiantes && horasLibres(s.id).length > 0)
    .sort((a, b) => a.capacidad - b.capacidad)[0];

  if (!apto) {
    return { error: `⚠️ No hay salones con capacidad ≥ ${estudiantes} con horas disponibles.` };
  }

  return { salon: apto };
}

// ── Getters ──────────────────────────────────────────────────────

export function todasLasReservas()        { return getReservas(); }
export function reservasDeUsuario(userId) { return getReservas().filter(r => r.userId === userId); }
export function reservasDeSalon(salonId)  { return getReservas().filter(r => r.salonId === salonId); }
