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
