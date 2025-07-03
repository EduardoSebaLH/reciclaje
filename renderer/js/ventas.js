import { materialesVenta } from "./materialesVenta.js"; // Catálogo exclusivo para ventas

document.addEventListener("DOMContentLoaded", () => {
  const tabla = document.getElementById("tbody-materiales-venta");
  const btnAgregar = document.getElementById("btn-agregar-material-venta");
  const totalVenta = document.getElementById("totalVenta");

  btnAgregar.addEventListener("click", () => {
    const fila = document.createElement("tr");

    const select = document.createElement("select");
    materialesVenta.forEach(m => {
      const option = document.createElement("option");
      option.value = m.precio;
      option.textContent = m.nombre;
      select.appendChild(option);
    });

    const pesoInput = document.createElement("input");
    pesoInput.type = "number";
    pesoInput.min = "0";
    pesoInput.step = "0.01";

    const precioInput = document.createElement("input");
    precioInput.type = "number";
    precioInput.min = "0";
    precioInput.step = "1";

    const subtotal = document.createElement("td");
    subtotal.textContent = "$0";

    const btnEliminar = document.createElement("button");
    btnEliminar.textContent = "❌";
    btnEliminar.type = "button";
    btnEliminar.addEventListener("click", () => {
      fila.remove();
      actualizarTotal();
    });

    select.addEventListener("change", () => {
      precioInput.value = select.value;
      calcularSubtotal();
    });

    [pesoInput, precioInput].forEach(input => {
      input.addEventListener("input", calcularSubtotal);
    });

    function calcularSubtotal() {
      const peso = parseFloat(pesoInput.value) || 0;
      const precio = parseFloat(precioInput.value) || 0;
      const sub = peso * precio;
      subtotal.textContent = `$${sub.toLocaleString("es-CL")}`;
      actualizarTotal();
    }

    fila.appendChild(crearCelda(select));
    fila.appendChild(crearCelda(pesoInput));
    fila.appendChild(crearCelda(precioInput));
    fila.appendChild(subtotal);
    fila.appendChild(crearCelda(btnEliminar));
    tabla.appendChild(fila);

    select.value = materialesVenta[0].precio;
    precioInput.value = materialesVenta[0].precio;
  });

  function crearCelda(contenido) {
    const td = document.createElement("td");
    td.appendChild(contenido);
    return td;
  }

  function actualizarTotal() {
    let total = 0;
    tabla.querySelectorAll("tr").forEach(tr => {
      const sub = tr.cells[3]?.textContent.replace(/\$/g, "").replace(/\./g, "") || "0";
      total += parseInt(sub);
    });
    totalVenta.textContent = `$${total.toLocaleString("es-CL")}`;
  }
});

// 🧹 Limpiar formulario
document.getElementById("btn-limpiar-venta").addEventListener("click", () => {
  if (confirm("¿Seguro que deseas limpiar el formulario?")) {
    document.getElementById("form-venta").reset();
    document.getElementById("tbody-materiales-venta").innerHTML = "";
    document.getElementById("totalVenta").textContent = "$0";
  }
});

// 💾 Guardar venta
document.getElementById("form-venta").addEventListener("submit", async (e) => {
  e.preventDefault();

  const filas = document.querySelectorAll("#tbody-materiales-venta tr");
  if (filas.length === 0) {
    alert("Debe añadir al menos un material antes de guardar");
    return;
  }

  const materialesData = [];
  let total = 0;

  filas.forEach(fila => {
    const select = fila.cells[0].querySelector("select");
    const peso = parseFloat(fila.cells[1].querySelector("input").value) || 0;
    const precio = parseFloat(fila.cells[2].querySelector("input").value) || 0;
    const subtotal = peso * precio;

    materialesData.push({
      material: select.options[select.selectedIndex].text,
      peso,
      precio,
      subtotal
    });

    total += subtotal;
  });

  const datosVenta = {
    folio: document.getElementById("folioVenta").value.trim(),
    nombre: document.getElementById("nombreVenta").value.trim(),
    rut: document.getElementById("rutVenta").value.trim(),
    direccion: document.getElementById("direccionVenta").value.trim(),
    fecha: document.getElementById("fechaVenta").value,
    materiales: materialesData,
    total: Math.round(total),
    facturada: document.getElementById("esFacturadaVenta").checked
  };

  const respuesta = await window.api.guardarVenta(datosVenta);

  if (respuesta.ok) {
    alert("✅ Venta guardada correctamente");
    document.getElementById("form-venta").reset();
    document.getElementById("tbody-materiales-venta").innerHTML = "";
    document.getElementById("totalVenta").textContent = "$0";
  } else {
    alert("❌ Error al guardar: " + respuesta.error);
  }
});

// 🖨️ Imprimir boleta
document.getElementById("btn-imprimir-venta").addEventListener("click", () => {
  const datosVenta = {
    folio: document.getElementById("folioVenta").value.trim(),
    nombre: document.getElementById("nombreVenta").value.trim(),
    rut: document.getElementById("rutVenta").value.trim(),
    direccion: document.getElementById("direccionVenta").value.trim(),
    fecha: document.getElementById("fechaVenta").value,
    facturada: document.getElementById("esFacturadaVenta").checked,
    materiales: [],
    total: 0
  };

  const filas = document.querySelectorAll("#tbody-materiales-venta tr");
  if (filas.length === 0) {
    alert("Debe añadir al menos un material");
    return;
  }

  let total = 0;

  filas.forEach(fila => {
    const material = fila.cells[0].querySelector("select")?.selectedOptions[0]?.text || "—";
    const peso = parseFloat(fila.cells[1].querySelector("input")?.value) || 0;
    const precio = parseFloat(fila.cells[2].querySelector("input")?.value) || 0;
    const subtotal = Math.round(peso * precio) || 0;

    datosVenta.materiales.push({ material, peso, precio, subtotal });
    total += subtotal;
  });

  datosVenta.total = total;

  const boletaVentana = window.open("", "_blank", "width=500,height=700");

  boletaVentana.document.write(`
    <html>
      <head>
        <title>Boleta de Venta</title>
        <style>
          body { font-family: 'Segoe UI', sans-serif; padding: 2rem; background: #f9f9f9; }
          .boleta { max-width: 600px; margin: auto; background: #ffffff; border-radius: 10px; padding: 2rem; box-shadow: 0 0 12px rgba(0, 0, 0, 0.08); border: 1px solid #e0e0e0; }
          .boleta-header { display: flex; justify-content: space-between; align-items: center; border-bottom: 2px solid #198754; padding-bottom: 0.8rem; margin-bottom: 1.2rem; }
          .boleta-header h2 { margin: 0; font-size: 1.4rem; color: #198754; }
          .boleta-info { font-size: 0.95rem; color: #555; text-align: right; }
          .boleta-datos { margin-bottom: 1.2rem; font-size: 0.95rem; }
          .boleta-tabla { width: 100%; border-collapse: collapse; margin-top: 1rem; }
          .boleta-tabla th, .boleta-tabla td { border: 1px solid #dee2e6; padding: 0.7rem; text-align: center; }
          .boleta-tabla thead { background-color: #198754; color: white; }
          .boleta-total { text-align: right; font-size: 1.1rem; font-weight: bold; color: #198754; margin-top: 1.2rem; }
          .boleta-footer { font-size: 0.85rem; color: #6c757d; text-align: center; margin-top: 2rem; }
        </style>
      </head>
      <body>
        <div class="boleta">
          <div class="boleta-header">
            <h2>📦 Boleta de Venta</h2>
            <div class="boleta-info">
              <p>📍 Lote J, Nircunlauta, San Fernando</p>
             <p>📞 +56 9 9199 1451</p>
            </div>
          </div>

          <div class="boleta-datos">
            <p><strong>🔢 Folio:</strong> ${datosVenta.folio}</p>
            <p><strong>👤 Cliente:</strong> ${datosVenta.nombre}</p>
            <p><strong>🆔 RUT:</strong> ${datosVenta.rut}</p>
            <p><strong>🏠 Dirección:</strong> ${datosVenta.direccion}</p>
            <p><strong>📅 Fecha:</strong> ${datosVenta.fecha}</p>
            <p><strong>🧾 Facturada:</strong> ${datosVenta.facturada ? "Sí" : "No"}</p>
          </div>

          <table class="boleta-tabla">
            <thead>
              <tr>
                <th>🧱 Material</th>
                <th>⚖️ Peso (kg)</th>
                <th>💰 Precio</th>
                <th>🧮 Subtotal</th>
              </tr>
            </thead>
            <tbody>
              ${datosVenta.materiales.map(m => `
                <tr>
                  <td>${m.nombre}</td>
                  <td>${m.peso}</td>
                  <td>$${Number(m.precio).toLocaleString("es-CL")}</td>
                  <td>$${Number(m.subtotal).toLocaleString("es-CL")}</td>
                </tr>`).join("")}
            </tbody>
          </table>

          <div class="boleta-total">
            Total: $${datosVenta.total.toLocaleString("es-CL")}
          </div>

          <div class="boleta-footer">
            📝 Esta boleta fue generada por el sistema de Reciclaje Adán Lizana
          </div>
        </div>
      </body>
    </html>
  `);

  boletaVentana.document.close();
  boletaVentana.onload = () => {
    boletaVentana.focus();
    boletaVentana.print();
  };
});

document.getElementById("btn-historial-venta").addEventListener("click", async () => {
  const seccion = document.getElementById("historial-ventas");
  const tabla = document.getElementById("tabla-historial-ventas");

  const respuesta = await window.api.obtenerVentas();
  tabla.innerHTML = "";
  seccion.style.display = "block";

  if (!respuesta.ok) {
    tabla.innerHTML = "<tr><td colspan='6'>❌ Error al obtener ventas</td></tr>";
    return;
  }

  if (respuesta.ventas.length === 0) {
    tabla.innerHTML = "<tr><td colspan='6'>No hay ventas registradas</td></tr>";
    return;
  }

  respuesta.ventas.forEach(v => {
    const fila = document.createElement("tr");
    fila.innerHTML = `
      <td>${v.fecha}</td>
      <td>${v.nombre}</td>
      <td>${v.rut}</td>
      <td>$${v.total.toLocaleString("es-CL")}</td>
      <td>${v.facturada ? "✅" : "—"}</td>
      <td><button class="btn-eliminar-venta" data-id="${v.id}">❌</button></td>
    `;
    tabla.appendChild(fila);
  });

  document.querySelectorAll(".btn-eliminar-venta").forEach(btn => {
    btn.addEventListener("click", async () => {
      if (!confirm("¿Eliminar esta venta permanentemente?")) return;
      const id = parseInt(btn.dataset.id);
      const r = await window.api.eliminarVenta(id);
      if (r.ok) btn.closest("tr").remove();
      else alert("❌ Error al eliminar: " + r.error);
    });
  });
});


document.getElementById("btn-exportar-venta").addEventListener("click", async () => {
  const respuesta = await window.api.exportarVentas();

  if (respuesta.ok) {
    alert("✅ Ventas exportadas correctamente:\n" + respuesta.path);
  } else {
    alert("❌ Error al exportar: " + respuesta.error);
  }
});

document.getElementById("esFacturadaVenta").addEventListener("change", function () {
  const info = document.getElementById("factura-info-venta");
  info.style.display = this.checked ? "block" : "none";
});

document.getElementById("btn-cerrar-historial-venta").addEventListener("click", () => {
  const seccion = document.getElementById("historial-ventas");
  seccion.style.display = "none";
});

