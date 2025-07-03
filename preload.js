const { contextBridge, ipcRenderer } = require("electron");

contextBridge.exposeInMainWorld("api", {
  // 👇 Compras (si ya los tienes)
  guardarCompra: (compra) => ipcRenderer.invoke("guardar-compra", compra),
  obtenerCompras: () => ipcRenderer.invoke("obtener-compras"),
  eliminarCompra: (id) => ipcRenderer.invoke("eliminar-compra", id),
  exportarExcel: () => ipcRenderer.invoke("exportar-compras"),

  // 👇 Ventas
  guardarVenta: (venta) => ipcRenderer.invoke("guardar-venta", venta),
  obtenerVentas: () => ipcRenderer.invoke("obtener-ventas"),
  eliminarVenta: (id) => ipcRenderer.invoke("eliminar-venta", id),
  exportarVentas: () => ipcRenderer.invoke("exportar-ventas")
});