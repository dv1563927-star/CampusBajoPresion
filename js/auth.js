/**
 * auth.js — Login, logout y gestión de sesión activa.
 */

import { USUARIOS } from './data.js';
import { setSesion, getSesion, clearSesion } from './storage.js';
import { showToast } from './ui.js';

let _currentUser = getSesion();

let _onLogin  = () => {};
let _onLogout = () => {};

export function getCurrentUser() { return _currentUser; }
export function onLogin(fn)      { _onLogin  = fn; }
export function onLogout(fn)     { _onLogout = fn; }

// ── Login ────────────────────────────────────────────────────────

export function login(usuario, contrasena) {
  const errEl = document.getElementById('loginError');

  if (!usuario || !contrasena) {
    mostrarErr(errEl, '⚠️ Completa todos los campos.');
    return false;
  }

  const encontrado = USUARIOS.find(u => u.user === usuario && u.pass === contrasena);

  if (!encontrado) {
    mostrarErr(errEl, '❌ Usuario o contraseña incorrectos.');
    document.getElementById('loginPass').value = '';
    return false;
  }

  _currentUser = encontrado;
  setSesion(encontrado);
  errEl.classList.add('hidden');
  _onLogin(encontrado);
  showToast(`¡Bienvenido/a, ${encontrado.nombre}! 🚀`, 'success');
  return true;
}

// ── Logout ───────────────────────────────────────────────────────

export function logout() {
  _currentUser = null;
  clearSesion();
  _onLogout();
  showToast('Sesión cerrada. ¡Hasta pronto! 👋', 'info');
}

// ── Helpers privados ─────────────────────────────────────────────

function mostrarErr(el, msg) {
  el.textContent = msg;
  el.classList.remove('hidden');
}

// ── Init: conectar el DOM ────────────────────────────────────────

export function initAuth() {
  document.getElementById('btnLogin').addEventListener('click', () => {
    login(
      document.getElementById('loginUser').value.trim(),
      document.getElementById('loginPass').value
    );
  });

  ['loginUser', 'loginPass'].forEach(id => {
    document.getElementById(id).addEventListener('keydown', e => {
      if (e.key === 'Enter') {
        login(
          document.getElementById('loginUser').value.trim(),
          document.getElementById('loginPass').value
        );
      }
    });
  });

  document.getElementById('btnLogout').addEventListener('click', logout);
}
