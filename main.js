const { app, BrowserWindow, ipcMain } = require("electron");
const path = require("path");
const Database = require("better-sqlite3");

// 👉 Inicializar bases de datos con rutas seguras
const dbCompras = new Database(path.join(__dirname, "data/compras.db"));
const dbVentas = new Database(path.join(__dirname, "data/ventas.db"));

// 🟢 Crear tabla de compras
dbCompras.prepare(`
  CREATE TABLE IF NOT EXISTS compras (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    nombre TEXT,
    rut TEXT,
    direccion TEXT,
    fecha TEXT,
    facturada INTEGER,
    materiales TEXT,
    total INTEGER
  );
`).run();

// 🔵 Crear tabla de ventas
dbVentas.prepare(`
  CREATE TABLE IF NOT EXISTS ventas (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    nombre TEXT,
    rut TEXT,
    direccion TEXT,
    fecha TEXT,
    folio TEXT,
    facturada INTEGER,
    materiales TEXT,
    total INTEGER
  );
`).run();

// 💾 Manejador para guardar compras
ipcMain.handle("guardar-compra", async (event, datos) => {
  try {
    const insert = dbCompras.prepare(`
      INSERT INTO compras (nombre, rut, direccion, fecha, materiales, total, facturada)
      VALUES (?, ?, ?, ?, ?, ?, ?)
    `);
    insert.run(
      datos.nombre,
      datos.rut,
      datos.direccion,
      datos.fecha,
      JSON.stringify(datos.materiales),
      datos.total,
      datos.facturada ? 1 : 0
    );
    return { ok: true };
  } catch (err) {
    console.error("❌ Error al guardar en compras.db:", err.message);
    return { ok: false, error: err.message };
  }
});

ipcMain.handle("guardar-venta", (event, venta) => {
  try {
    const stmt = dbVentas.prepare(`
      INSERT INTO ventas (nombre, rut, direccion, fecha, folio, facturada, materiales, total)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?)
    `);

    const result = stmt.run(
      venta.nombre,
      venta.rut,
      venta.direccion,
      venta.fecha,
      venta.folio,
      venta.facturada ? 1 : 0,
      JSON.stringify(venta.materiales),
      venta.total
    );

    return { ok: true, id: result.lastInsertRowid };
  } catch (error) {
    console.error("❌ Error al guardar venta:", error.message);
    return { ok: false, error: error.message };
  }
});

// 🌐 Crear ventana principal
function createWindow() {
  const win = new BrowserWindow({
    width: 1000,
    height: 700,
    webPreferences: {
      preload: path.join(__dirname, "preload.js"),
      contextIsolation: true
    }
  });

  win.loadFile(path.join(__dirname, "renderer/index.html"));
}

// 🚀 Iniciar aplicación
app.whenReady().then(() => {
  createWindow();

  app.on("activate", () => {
    if (BrowserWindow.getAllWindows().length === 0) createWindow();
  });
});

// 🧼 Cerrar completamente en sistemas que no sean Mac
app.on("window-all-closed", () => {
  if (process.platform !== "darwin") app.quit();
});

ipcMain.handle("obtener-compras", async () => {
  try {
    const fila = dbCompras.prepare("SELECT * FROM compras ORDER BY fecha DESC").all();
    return { ok: true, compras: fila };
  } catch (err) {
    console.error("Error al obtener historial:", err.message);
    return { ok: false, error: err.message };
  }
});

const ExcelJS = require("exceljs");
const fs = require("fs");

ipcMain.handle("exportar-excel", async () => {
  try {
    const registros = dbCompras.prepare("SELECT * FROM compras").all();

    const workbook = new ExcelJS.Workbook();
    const hoja = workbook.addWorksheet("Compras");

    // 👉 Cabecera base
    const columnasBase = [
      { header: "ID", key: "id" },
      { header: "Nombre", key: "nombre" },
      { header: "RUT", key: "rut" },
      { header: "Dirección", key: "direccion" },
      { header: "Fecha", key: "fecha" },
      { header: "Total", key: "total" },
      { header: "Facturada", key: "facturada" }
    ];

    // 🔍 Detectar la cantidad máxima de materiales en una compra
    let maxMateriales = 0;
    registros.forEach(c => {
      const materiales = JSON.parse(c.materiales);
      if (materiales.length > maxMateriales) {
        maxMateriales = materiales.length;
      }
    });

    // 📌 Generar cabeceras dinámicas para materiales
    const columnasMateriales = [];
    for (let i = 1; i <= maxMateriales; i++) {
      columnasMateriales.push({ header: `Material ${i}`, key: `mat${i}` });
      columnasMateriales.push({ header: `Peso ${i} (kg)`, key: `peso${i}` });
      columnasMateriales.push({ header: `Precio ${i}`, key: `precio${i}` });
    }

    // 🧱 Unir todo
    hoja.columns = [...columnasBase, ...columnasMateriales];

    // 🧾 Agregar cada compra como una fila con sus materiales
    registros.forEach(c => {
      const materiales = JSON.parse(c.materiales);
      const row = {
        id: c.id,
        nombre: c.nombre,
        rut: c.rut,
        direccion: c.direccion,
        fecha: c.fecha,
        total: c.total,
        facturada: c.facturada ? "Sí" : "No"
      };

      materiales.forEach((m, i) => {
        row[`mat${i + 1}`] = m.material;
        row[`peso${i + 1}`] = m.peso;
        row[`precio${i + 1}`] = m.precio;
      });

      hoja.addRow(row);
    });

    const ruta = path.join(app.getPath("documents"), "compras_exportadas.xlsx");
    await workbook.xlsx.writeFile(ruta);

    return { ok: true, path: ruta };
  } catch (err) {
    console.error("❌ Error al exportar Excel:", err.message);
    return { ok: false, error: err.message };
  }
});

ipcMain.handle("eliminar-compra", async (event, id) => {
  try {
    dbCompras.prepare("DELETE FROM compras WHERE id = ?").run(id);
    return { ok: true };
  } catch (err) {
    console.error("❌ Error al eliminar compra:", err.message);
    return { ok: false, error: err.message };
  }
});

ipcMain.handle("obtener-ventas", () => {
  try {
    const ventas = dbVentas.prepare("SELECT * FROM ventas ORDER BY fecha DESC").all();
    return { ok: true, ventas };
  } catch (error) {
    console.error("❌ Error al obtener historial:", error.message);
    return { ok: false, error: error.message };
  }
});

ipcMain.handle("exportar-ventas", async () => {
  try {
    const ventas = dbVentas.prepare("SELECT * FROM ventas ORDER BY fecha DESC").all();
    const workbook = new ExcelJS.Workbook();
    const sheet = workbook.addWorksheet("Ventas");

    // Determinar el máximo de materiales por venta
    let maxMateriales = 0;
    const ventasConMateriales = ventas.map(v => {
      const mats = JSON.parse(v.materiales || "[]");
      maxMateriales = Math.max(maxMateriales, mats.length);
      return { ...v, materiales: mats };
    });

    // Cabecera base
    const baseHeaders = ["ID", "Folio", "Fecha", "Cliente", "RUT", "Dirección", "Facturada", "Total"];
    
    // Cabeceras dinámicas para materiales
    const headerMateriales = [];
    for (let i = 1; i <= maxMateriales; i++) {
      headerMateriales.push(
        `Material ${i}`,
        `Peso ${i}`,
        `Precio ${i}`,
        `Subtotal ${i}`
      );
    }

    sheet.addRow([...baseHeaders, ...headerMateriales]);

    // Agregar cada venta en una fila
    ventasConMateriales.forEach(v => {
      const row = [
        v.id,
        v.folio,
        v.fecha,
        v.nombre,
        v.rut,
        v.direccion,
        v.facturada ? "Sí" : "No",
        v.total
      ];

      v.materiales.forEach(m => {
        row.push(
          m.material || "",
          m.peso || "",
          m.precio || "",
          m.subtotal || ""
        );
      });

      // Si tiene menos materiales, completa con celdas vacías
      const celdasFaltantes = (maxMateriales - v.materiales.length) * 4;
      row.push(...Array(celdasFaltantes).fill(""));

      sheet.addRow(row);
    });

    const exportDir = path.join(__dirname, "exportaciones");
    if (!fs.existsSync(exportDir)) fs.mkdirSync(exportDir);

    const filePath = path.join(exportDir, "ventas.xlsx");
    await workbook.xlsx.writeFile(filePath);
    return { ok: true, path: filePath };

  } catch (error) {
    console.error("❌ Error al exportar ventas:", error.message);
    return { ok: false, error: error.message };
  }
});

ipcMain.handle("eliminar-venta", (event, id) => {
  try {
    const result = dbVentas.prepare("DELETE FROM ventas WHERE id = ?").run(id);

    if (result.changes > 0) {
      return { ok: true };
    } else {
      return { ok: false, error: "ID no encontrado" };
    }
  } catch (error) {
    console.error("❌ Error al eliminar venta:", error.message);
    return { ok: false, error: error.message };
  }
});
