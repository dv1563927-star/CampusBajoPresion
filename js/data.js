/**
 * data.js — Fuente única de verdad: usuarios y salones.
 */

export const HORA_INICIO = 6;   // 6:00 AM
export const HORA_FIN    = 20;  // 8:00 PM

export const USUARIOS = [
  { user: 'admin',      pass: 'admin123', nombre: 'Admin General',  area: 'Administración', rol: 'admin'   },
  { user: 'ing.pedro',  pass: 'clase456', nombre: 'Pedro Ramírez',  area: 'Ingeniería',     rol: 'docente' },
  { user: 'med.ana',    pass: 'salud789', nombre: 'Ana Martínez',   area: 'Medicina',       rol: 'docente' },
  { user: 'der.luis',   pass: 'ley321',   nombre: 'Luis Herrera',   area: 'Derecho',        rol: 'docente' },
  { user: 'cont.sofia', pass: 'fin654',   nombre: 'Sofía Torres',   area: 'Contaduría',     rol: 'docente' },
  { user: 'psi.clara',  pass: 'mente987', nombre: 'Clara Vega',     area: 'Psicología',     rol: 'docente' },
];

export const SALONES = [
  { id: 1, nombre: 'Auditorio',        capacidad: 100 },
  { id: 2, nombre: 'Cosmos',           capacidad: 25  },
  { id: 3, nombre: 'Skilab',           capacidad: 20  },
  { id: 4, nombre: 'Spooki',           capacidad: 38  },
  { id: 5, nombre: 'Apolo',            capacidad: 34  },
  { id: 6, nombre: 'Blanca',           capacidad: 12  },
  { id: 7, nombre: 'Azul',             capacidad: 10  },
  { id: 8, nombre: 'Amarillas Verdes', capacidad: 6   },
  { id: 9, nombre: 'Artemis',          capacidad: 32  },
];

export const CAPACIDAD_MAX = Math.max(...SALONES.map(s => s.capacidad));
