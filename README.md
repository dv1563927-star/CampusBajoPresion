# CampusLands · Orbit

Aplicación web para consultar la disponibilidad y solicitar reservas de salones del campus. La interfaz presenta los salones como planetas en un mapa orbital e incluye modelos 3D de Orbit y de los espacios.

## Requisitos

- Node.js y npm para instalar Three.js.
- Python 3, o cualquier servidor HTTP estático.
- Navegador moderno con WebGL habilitado para ver los modelos 3D.

## Iniciar el proyecto

Desde la carpeta del proyecto, instala la dependencia y sirve los archivos por HTTP:

```bash
npm install
python3 -m http.server 8000
```

Abre <http://localhost:8000/>. No se necesita un proceso de compilación.

## Funciones

- Inicio de sesión con usuarios de demostración.
- Mapa solar interactivo con disponibilidad por salón.
- Panel con información, horario y vista 3D del salón.
- Formulario de reserva con sugerencia según capacidad y disponibilidad.
- Vistas de agendas personales y horario general.
- Persistencia local de reservas en `localStorage`; sesión temporal en `sessionStorage`.

## Usuarios de demostración

| Usuario | Contraseña | Rol / área |
| --- | --- | --- |
| `admin` | `admin123` | Administración |
| `ing.pedro` | `clase456` | Ingeniería |
| `med.ana` | `salud789` | Medicina |
| `der.luis` | `ley321` | Derecho |
| `cont.sofia` | `fin654` | Contaduría |
| `psi.clara` | `mente987` | Psicología |

Estas credenciales están definidas en `js/data.js` y son únicamente para demostración.

## Estructura

```text
.
├── index.html
├── css/
│   ├── app.css
│   ├── base.css
│   ├── components.css
│   ├── layout.css
│   └── login.css
├── js/
│   ├── app.js       # Orquestación de la aplicación
│   ├── auth.js      # Inicio y cierre de sesión
│   ├── data.js      # Usuarios y salones
│   ├── orbit3d.js   # Personaje Orbit en Three.js
│   ├── reservas.js  # Disponibilidad y reglas de reserva
│   ├── salon3d.js   # Modelos 3D de salones
│   ├── solarmap.js  # Mapa orbital interactivo
│   ├── storage.js   # Persistencia del navegador
│   └── ui.js        # Paneles, modales y vistas
├── package.json
└── package-lock.json
```

Three.js se importa desde la instalación local en `node_modules/three`.
