// utils/ticket.js
// Ticket de la compra para imprimir (pensado para impresora térmica de 80 mm,
// también sirve en una impresora común o para "Guardar como PDF").
//
//   imprimirTicket({
//     idVenta, fecha, cajero, cliente: { Nombre, CUIT } | null,
//     items: [{ nombre, cantidad, precio }],
//     total, medioPago, montoRecibido, vuelto, comprobante,
//   })
//
// Se imprime desde un iframe oculto: no abre ventanas nuevas ni lo bloquea
// el navegador, y el cajero vuelve a la caja apenas cierra el diálogo.

const pesos = (n) =>
  `$${Number(n || 0).toLocaleString("es-AR", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;

const esc = (t) =>
  String(t ?? "").replace(/[&<>"']/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c]));

const MEDIOS = { efectivo: "Efectivo", tarjeta: "Tarjeta", transferencia: "Transferencia" };

export function ticketHtml(v) {
  const fecha = new Date(v.fecha || Date.now());
  const items = v.items || [];
  const unidades = items.reduce((acc, it) => acc + Number(it.cantidad || 0), 0);
  const medio = MEDIOS[String(v.medioPago || "").toLowerCase()] || v.medioPago || "-";
  const esEfectivo = medio === "Efectivo";
  const numero = v.idVenta ? String(v.idVenta).padStart(6, "0") : "------";

  const filas = items
    .map(
      (it) => `
      <div class="item">
        <div class="nombre">${esc(it.nombre)}</div>
        <div class="fila"><span>${Number(it.cantidad)} x ${pesos(it.precio)}</span><span>${pesos(Number(it.cantidad) * Number(it.precio))}</span></div>
      </div>`
    )
    .join("");

  const fila = (a, b, clase = "") => `<div class="fila ${clase}"><span>${a}</span><span>${b}</span></div>`;

  return `<!doctype html>
<html lang="es"><head><meta charset="utf-8"><title>Ticket ${numero}</title>
<style>
  @page { size: 80mm auto; margin: 4mm; }
  * { box-sizing: border-box; }
  body { margin: 0; width: 72mm; font-family: "Courier New", Courier, monospace; font-size: 12px; color: #000; line-height: 1.35; }
  .centro { text-align: center; }
  h1 { font-size: 18px; margin: 0; letter-spacing: 1px; }
  .chico { font-size: 10.5px; }
  .linea { border-top: 1px dashed #000; margin: 6px 0; }
  .fila { display: flex; justify-content: space-between; gap: 8px; }
  .fila span:last-child { white-space: nowrap; }
  .item { margin: 3px 0; }
  .nombre { font-weight: bold; word-break: break-word; }
  .total { font-size: 16px; font-weight: bold; margin: 4px 0; }
  .gracias { margin-top: 8px; font-weight: bold; }
</style></head>
<body>
  <div class="centro">
    <h1>KIOSQUITOYA</h1>
    <div class="chico">Kiosco y minimarket</div>
    <div class="chico">Comprobante interno - no válido como factura</div>
  </div>
  <div class="linea"></div>
  ${fila("Ticket N°", numero)}
  ${fila("Fecha", fecha.toLocaleDateString("es-AR"))}
  ${fila("Hora", fecha.toLocaleTimeString("es-AR", { hour: "2-digit", minute: "2-digit" }))}
  ${fila("Cajero", esc(v.cajero || "-"))}
  ${v.cliente ? fila("Cliente", esc(v.cliente.Nombre)) + fila("CUIT/DNI", esc(v.cliente.CUIT)) : fila("Cliente", "Consumidor final")}
  <div class="linea"></div>
  ${filas}
  <div class="linea"></div>
  ${fila("Artículos", unidades)}
  ${fila("TOTAL", pesos(v.total), "total")}
  <div class="linea"></div>
  ${fila("Medio de pago", esc(medio))}
  ${esEfectivo && v.montoRecibido != null ? fila("Recibido", pesos(v.montoRecibido)) : ""}
  ${esEfectivo && v.vuelto != null ? fila("Vuelto", pesos(v.vuelto)) : ""}
  ${!esEfectivo && v.comprobante ? fila("Comprobante", esc(v.comprobante)) : ""}
  <div class="linea"></div>
  <div class="centro gracias">¡Gracias por su compra!</div>
</body></html>`;
}

export function imprimirTicket(venta) {
  const marco = document.createElement("iframe");
  marco.setAttribute("aria-hidden", "true");
  marco.style.cssText = "position:fixed;right:0;bottom:0;width:0;height:0;border:0;visibility:hidden";
  document.body.appendChild(marco);

  const doc = marco.contentWindow.document;
  doc.open();
  doc.write(ticketHtml(venta));
  doc.close();

  const quitar = () => setTimeout(() => marco.remove(), 1000);
  marco.contentWindow.onafterprint = quitar;
  // Un instante para que el navegador arme la página antes de imprimir
  setTimeout(() => {
    const foco = document.activeElement;
    try {
      marco.contentWindow.focus();
      marco.contentWindow.print();
    } finally {
      // Devolvemos el foco a la caja (lector y atajos de teclado)
      window.focus();
      if (foco && typeof foco.focus === "function") foco.focus();
      setTimeout(quitar, 60000); // por si el navegador no avisa el fin de la impresión
    }
  }, 150);
}
