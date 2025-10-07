# Auditoría Técnica – App Contable Reciclaje

## 1. Estructura de carpetas y archivos
- main.js → arranque de Electron
- index.html → interfaz principal
- renderer.js → lógica de interacción
- db.js → conexión y consultas SQLite
- style.css → estilos visuales
- package.json → configuración del proyecto

## 2. Flujo general de la aplicación
- Inicio → carga de ventana → renderizado de interfaz
- Interacción → ingreso de datos → validación → almacenamiento
- Visualización → renderizado de tabla → edición/eliminación

## 3. Archivo: main.js

- 📥 Entrada: módulos de Electron (`app`, `BrowserWindow`)
- ⚙️ Proceso:
  - Crea ventana principal con `createWindow()`
  - Carga `index.html` como interfaz
  - Maneja eventos de ciclo de vida (`whenReady`, `window-all-closed`, `activate`)
- 📤 Salida: ventana activa con interfaz cargada
- 📌 Observaciones:
  - `nodeIntegration: true` permite usar Node.js en el frontend, pero puede tener riesgos de seguridad si se carga contenido externo.
  - `contextIsolation: false` desactiva el aislamiento entre procesos, útil para apps locales pero no recomendado en producción con fuentes externas.
