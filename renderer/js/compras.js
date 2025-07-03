import { materiales } from "./materiales.js";

document.addEventListener("DOMContentLoaded", () => {
  const tabla = document.getElementById("tbody-materiales");
  const btnAgregar = document.getElementById("btn-agregar-material");
  const totalCompra = document.getElementById("totalCompra");

  btnAgregar.addEventListener("click", () => {
    const fila = document.createElement("tr");

    // Selector de material
    const select = document.createElement("select");
    materiales.forEach(m => {
      const option = document.createElement("option");
      option.value = m.precio;
      option.textContent = m.nombre;
      select.appendChild(option);
    });

    // Peso input
    const pesoInput = document.createElement("input");
    pesoInput.type = "number";
    pesoInput.min = "0";
    pesoInput.step = "0.01";

    // Precio input (editable)
    const precioInput = document.createElement("input");
    precioInput.type = "number";
    precioInput.min = "0";
    precioInput.step = "1";

    // Subtotal
    const subtotal = document.createElement("td");
    subtotal.textContent = "$0";

    // Botón eliminar
    const btnEliminar = document.createElement("button");
    btnEliminar.textContent = "❌";
    btnEliminar.type = "button";

    // Evento para eliminar
    btnEliminar.addEventListener("click", () => {
      fila.remove();
      actualizarTotal();
    });

    // Actualizar precio al cambiar material
    select.addEventListener("change", () => {
      precioInput.value = select.value;
      calcularSubtotal();
    });

    // Eventos para recalcular
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

    // Celdas
    fila.appendChild(crearCelda(select));
    fila.appendChild(crearCelda(pesoInput));
    fila.appendChild(crearCelda(precioInput));
    fila.appendChild(subtotal);
    fila.appendChild(crearCelda(btnEliminar));
    tabla.appendChild(fila);

    // Precarga precio inicial
    select.value = materiales[0].precio;
    precioInput.value = materiales[0].precio;
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
    totalCompra.textContent = `$${total.toLocaleString("es-CL")}`;
  }
});

//Botón para limpiar el formulario
document.getElementById("btn-limpiar").addEventListener("click", () => {
  if (confirm("¿Seguro que deseas limpiar el formulario?")) {
    document.getElementById("form-compra").reset();
    document.getElementById("tbody-materiales").innerHTML = "";
    document.getElementById("totalCompra").textContent = "$0";
  }
});

document.getElementById("btn-historial").addEventListener("click", async () => {
  try {
    const respuesta = await window.api.obtenerCompras();
    console.log("Respuesta desde main:", respuesta);

    const tbody = document.getElementById("tabla-historial");
    const seccion = document.getElementById("historial-compras");
    tbody.innerHTML = "";
    seccion.style.display = "block";

    if (!respuesta.ok) {
      tbody.innerHTML = "<tr><td colspan='6'>❌ Error al obtener historial</td></tr>";
      return;
    }

    if (respuesta.compras.length === 0) {
      tbody.innerHTML = "<tr><td colspan='6'>No hay compras registradas</td></tr>";
      return;
    }

    respuesta.compras.forEach(compra => {
      const tr = document.createElement("tr");
      tr.innerHTML = `
        <td>${compra.fecha}</td>
        <td>${compra.nombre}</td>
        <td>${compra.rut}</td>
        <td>$${compra.total.toLocaleString("es-CL")}</td>
        <td>${compra.facturada ? "✅" : "—"}</td>
        <td><button class="btn-eliminar" data-id="${compra.id}" style="color:red; cursor:pointer;">❌</button></td>
      `;
      tbody.appendChild(tr);
      seccion.classList.add("fadeIn");

    });

    // Activar los botones eliminar una vez renderizado el historial
    setTimeout(() => {
      document.querySelectorAll(".btn-eliminar").forEach(btn => {
        btn.addEventListener("click", async () => {
          const id = parseInt(btn.dataset.id);
          if (!confirm("¿Eliminar esta compra permanentemente?")) return;

          const resultado = await window.api.eliminarCompra(id);
          if (resultado.ok) {
            btn.closest("tr").remove();
          } else {
            alert("❌ Error al eliminar: " + resultado.error);
          }
        });
      });
    }, 0);

  } catch (error) {
    console.error("Error al mostrar historial:", error.message);
  }
});

document.querySelectorAll(".btn-eliminar").forEach(btn => {
  btn.addEventListener("click", async () => {
    if (!confirm("¿Eliminar esta compra permanentemente?")) return;
    const id = parseInt(btn.dataset.id);
    const r = await window.api.eliminarCompra(id);
    if (r.ok) {
      btn.closest("tr").remove();
    } else {
      alert("❌ Error al eliminar: " + r.error);
    }
  });
});


document.getElementById("form-compra").addEventListener("submit", async (e) => {
  e.preventDefault();

  const filas = document.querySelectorAll("#tbody-materiales tr");
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

  const datosCompra = {
    nombre: document.getElementById("nombreCliente").value.trim(),
    rut: document.getElementById("rutCliente").value.trim(),
    direccion: document.getElementById("direccionCliente").value.trim(),
    fecha: document.getElementById("fechaCompra").value,
    materiales: materialesData,
    total: Math.round(total),
    facturada: document.getElementById("esFacturada").checked
  };

  console.log("➡️ Enviando datos:", datosCompra);

  const respuesta = await window.api.guardarCompra(datosCompra);

  console.log("💾 Respuesta al guardar:", respuesta);

  if (respuesta.ok) {
    alert("✅ Compra guardada correctamente");
    document.getElementById("form-compra").reset();
    document.getElementById("tbody-materiales").innerHTML = "";
    document.getElementById("totalCompra").textContent = "$0";
  } else {
    alert("❌ Error al guardar: " + respuesta.error);
  }
});

document.getElementById("btn-imprimir").addEventListener("click", () => {
  const datos = {
    nombre: document.getElementById("nombreCliente").value,
    rut: document.getElementById("rutCliente").value,
    direccion: document.getElementById("direccionCliente").value,
    fecha: document.getElementById("fechaCompra").value,
    facturada: document.getElementById("esFacturada").checked,
    materiales: [],
    total: document.getElementById("totalCompra").textContent
  };

  const filas = document.querySelectorAll("#tbody-materiales tr");
  if (filas.length === 0) {
    alert("Debe añadir al menos un material");
    return;
  }

  filas.forEach(fila => {
    const nombre = fila.cells[0].querySelector("select").selectedOptions[0].text;
    const peso = fila.cells[1].querySelector("input").value;
    const precio = fila.cells[2].querySelector("input").value;
    datos.materiales.push({ nombre, peso, precio });
  });
  
// 🟢 1. Recolectar materiales desde la tabla
const filasTabla = document.querySelectorAll("#tabla-materiales tbody tr");

const materiales = [];
filasTabla.forEach(fila => {
  const nombre = fila.cells[0].querySelector("select")?.selectedOptions[0]?.text || "—";
  const peso = fila.cells[1].querySelector("input")?.value || "0";
  const precio = fila.cells[2].querySelector("input")?.value || "0";
  materiales.push({ nombre, peso, precio });
});

// 🟢 2. Calcular el total
const totalCalculado = materiales.reduce((acc, m) => {
  const precio = Number(m.precio);
  const peso = Number(m.peso);
  return acc + (isNaN(precio * peso) ? 0 : precio * peso);
}, 0);

// 🟢 3. Construir objeto de datos
const datosBoleta = {
  nombre: document.getElementById("nombre")?.value || "—",
  rut: document.getElementById("rut")?.value || "—",
  direccion: document.getElementById("direccion")?.value || "—",
  fecha: new Date().toLocaleDateString("es-CL"),
  facturada: document.getElementById("facturada")?.checked || false,
  materiales,
  total: totalCalculado
};

// 🟢 4. Generar la boleta en ventana emergente
const boletaVentana = window.open("", "_blank", "width=500,height=700");
boletaVentana.document.write(`
  <html>
    <head>
      <title>Boleta</title>
      <style>
        body {
          font-family: 'Segoe UI', sans-serif;
          padding: 2rem;
          background: #f9f9f9;
        }
        .boleta {
          max-width: 600px;
          margin: auto;
          background: #ffffff;
          border-radius: 10px;
          padding: 2rem;
          box-shadow: 0 0 12px rgba(0, 0, 0, 0.08);
          border: 1px solid #e0e0e0;
        }
        .boleta-header {
          display: flex;
          justify-content: space-between;
          align-items: center;
          border-bottom: 2px solid #198754;
          padding-bottom: 0.8rem;
          margin-bottom: 1.2rem;
        }
        .boleta-header h2 {
          margin: 0;
          font-size: 1.4rem;
          color: #198754;
        }
        .boleta-info {
          font-size: 0.95rem;
          color: #555;
          text-align: right;
        }
        .boleta-datos {
          margin-bottom: 1.2rem;
          font-size: 0.95rem;
        }
        .boleta-datos p {
          margin: 0.3rem 0;
        }
        .boleta-tabla {
          width: 100%;
          border-collapse: collapse;
          margin-top: 1rem;
        }
        .boleta-tabla th,
        .boleta-tabla td {
          border: 1px solid #dee2e6;
          padding: 0.7rem;
          text-align: center;
        }
        .boleta-tabla thead {
          background-color: #198754;
          color: white;
        }
        .boleta-total {
          text-align: right;
          font-size: 1.1rem;
          font-weight: bold;
          color: #198754;
          margin-top: 1.2rem;
        }
        .boleta-footer {
          font-size: 0.85rem;
          color: #6c757d;
          text-align: center;
          margin-top: 2rem;
        }
      </style>

    </head>
    <body>
      <div class="boleta">
        <div class="boleta-header">
          <h2>♻️ Boleta de Compra</h2>
          <div class="boleta-info">
            <p>📍 Lote J, Nircunlauta, San Fernando</p>
            <p>📞 +56 9 9199 1451</p>
          </div>
        </div>

        <div class="boleta-datos">
          <p><strong>👤 Cliente:</strong> ${datosBoleta.nombre}</p>
          <p><strong>🆔 RUT:</strong> ${datosBoleta.rut}</p>
          <p><strong>🏠 Dirección:</strong> ${datosBoleta.direccion}</p>
          <p><strong>📅 Fecha:</strong> ${datosBoleta.fecha}</p>
          <p><strong>🧾 Facturada:</strong> ${datosBoleta.facturada ? "Sí" : "No"}</p>
        </div>

        <table class="boleta-tabla">
          <thead>
            <tr>
              <th>♻️ Material</th>
              <th>⚖️ Peso (kg)</th>
              <th>💰 Precio</th>
            </tr>
          </thead>
          <tbody>
            ${datosBoleta.materiales.map(m => `
              <tr>
                <td>${m.nombre}</td>
                <td>${m.peso}</td>
                <td>$${Number(m.precio).toLocaleString("es-CL")}</td>
              </tr>`).join("")}
          </tbody>
        </table>

        <div class="boleta-total">
          Total: $${datosBoleta.total.toLocaleString("es-CL")}
        </div>

        <div class="boleta-footer">
          📝 Esta boleta fue generada por el sistema de Reciclaje Adán Lizana
        </div>
      </div>
    </body>
  </html>
`);
boletaVentana.document.close();

  // 👉 Esperamos a que todo cargue antes de imprimir
  boletaVentana.onload = () => {
    boletaVentana.focus();
    boletaVentana.print();
  };
});

document.getElementById("btn-exportar").addEventListener("click", async () => {
  const respuesta = await window.api.exportarExcel();

  if (respuesta.ok) {
    alert("✅ Excel exportado correctamente en:\n" + respuesta.path);
  } else {
    alert("❌ Error al exportar: " + respuesta.error);
  }
});

function mostrarVista(vista) {
  const vistas = ["inicio", "compras", "ventas"];
  vistas.forEach(v => {
    const seccion = document.getElementById("vista-" + v);
    if (seccion) seccion.style.display = "none";
  });

  const target = document.getElementById("vista-" + vista);
  if (target) {
    target.style.display = "block";
    target.classList.add("fadeIn");
  } else {
    console.warn("Vista no encontrada:", vista);
  }
}

document.getElementById("btn-inicio").addEventListener("click", () => mostrarVista("inicio"));
document.getElementById("btn-compras").addEventListener("click", () => mostrarVista("compras"));
document.getElementById("btn-ventas").addEventListener("click", () => mostrarVista("ventas"));

document.getElementById("esFacturada").addEventListener("change", function () {
  const info = document.getElementById("factura-info");
  info.style.display = this.checked ? "block" : "none";
});

document.getElementById("btn-cerrar-historial").addEventListener("click", () => {
  const seccion = document.getElementById("historial-compras");
  seccion.style.display = "none";
});
