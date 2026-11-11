// utils/stockCritico.js
// Exportar la lista de productos en stock crítico y enviarla al proveedor.
//   descargarCriticosCsv()  -> descarga una planilla que se abre con Excel
//   enviarCriticosProveedor() -> pide el email del proveedor y lo envía desde
//                               el servidor; si el servidor no puede mandar
//                               correos, ofrece abrir el correo del usuario.
import Swal from "sweetalert2";
import api from "../services/api";
import { alertaExito, alertaError, mensajeDeError } from "./alertas";

// Igual que en el backend (STOCK_MINIMO): 5 unidades o menos = crítico
export const STOCK_CRITICO = 5;

const COLOR_PRIMARIO = "#261d60";
const CLAVE_EMAIL = "kiosquito_email_proveedor";

function leerEmailGuardado() {
  try {
    return localStorage.getItem(CLAVE_EMAIL) || "";
  } catch {
    return "";
  }
}

function guardarEmail(email) {
  try {
    localStorage.setItem(CLAVE_EMAIL, email);
  } catch {
    /* sin almacenamiento: no pasa nada */
  }
}

const escapar = (t) =>
  String(t ?? "").replace(/[&<>"']/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c]));

export async function descargarCriticosCsv() {
  try {
    const respuesta = await api.get("/productos/criticos/csv", { responseType: "blob" });
    const url = URL.createObjectURL(respuesta.data);
    const enlace = document.createElement("a");
    enlace.href = url;
    enlace.download = `stock_critico_${new Date().toISOString().slice(0, 10)}.csv`;
    document.body.appendChild(enlace);
    enlace.click();
    enlace.remove();
    setTimeout(() => URL.revokeObjectURL(url), 1000);
    return true;
  } catch (error) {
    alertaError("No se pudo exportar", mensajeDeError(error, "Intentá de nuevo en unos segundos."));
    return false;
  }
}

function armarMailto(email, mensaje, productos) {
  const fecha = new Date().toLocaleDateString("es-AR");
  const lista = productos
    .map((p) => `- ${p.Nombre} (cód. ${p.Cod_barra}): stock ${p.Stock}, pedir ${p.cantidadSugerida}`)
    .join("\n");
  const cuerpo = `${mensaje ? mensaje + "\n\n" : ""}Productos en stock crítico (${fecha}):\n\n${lista}\n\nKiosquitoYa`;
  const asunto = `Pedido de reposición – ${productos.length} producto(s) en stock crítico`;
  return `mailto:${encodeURIComponent(email)}?subject=${encodeURIComponent(asunto)}&body=${encodeURIComponent(cuerpo)}`;
}

export async function enviarCriticosProveedor() {
  // 1) Traer la lista actual para mostrarla y validar que haya algo
  let datos;
  try {
    ({ data: datos } = await api.get("/productos/criticos"));
  } catch (error) {
    alertaError("No se pudo cargar el stock crítico", mensajeDeError(error, "Intentá de nuevo."));
    return;
  }
  const productos = datos.productos || [];
  if (productos.length === 0) {
    alertaExito("Sin productos críticos", `Ningún producto tiene ${STOCK_CRITICO} unidades o menos.`);
    return;
  }

  const filas = productos
    .slice(0, 8)
    .map((p) => `<li><strong>${escapar(p.Nombre)}</strong> — stock ${p.Stock}, pedir ${p.cantidadSugerida}</li>`)
    .join("");
  const mas = productos.length > 8 ? `<li>y ${productos.length - 8} más…</li>` : "";

  // 2) Formulario: email del proveedor + mensaje
  const { value: formulario } = await Swal.fire({
    title: "Enviar pedido al proveedor",
    html: `
      <div style="text-align:left;font-size:0.95em">
        <p style="margin:0 0 8px;color:#475569">Se enviarán <strong>${productos.length}</strong> producto(s) en stock crítico, con la planilla adjunta:</p>
        <ul style="margin:0 0 14px;padding-left:18px;color:#334155;max-height:140px;overflow:auto">${filas}${mas}</ul>
        <label for="prov-email" style="font-weight:600;color:#261d60">Email del proveedor</label>
        <input id="prov-email" type="email" class="swal2-input" style="margin:6px 0 12px;width:100%;box-sizing:border-box" placeholder="proveedor@ejemplo.com" value="${escapar(leerEmailGuardado())}">
        <label for="prov-mensaje" style="font-weight:600;color:#261d60">Mensaje (opcional)</label>
        <textarea id="prov-mensaje" class="swal2-textarea" style="margin:6px 0 0;width:100%;box-sizing:border-box;font-family:inherit;font-size:0.95em" rows="3">Hola, les enviamos el pedido de reposición de los siguientes productos. Gracias.</textarea>
      </div>`,
    focusConfirm: false,
    showCancelButton: true,
    confirmButtonText: "Enviar pedido",
    cancelButtonText: "Cancelar",
    confirmButtonColor: COLOR_PRIMARIO,
    cancelButtonColor: "#94a3b8",
    reverseButtons: true,
    customClass: { popup: "kiosco-swal" },
    preConfirm: () => {
      const email = document.getElementById("prov-email").value.trim();
      const mensaje = document.getElementById("prov-mensaje").value.trim();
      if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
        Swal.showValidationMessage("Ingresá un email válido");
        return false;
      }
      return { email, mensaje };
    },
  });
  if (!formulario) return;
  guardarEmail(formulario.email);

  // 3) Enviar desde el servidor
  Swal.fire({ title: "Enviando…", allowOutsideClick: false, didOpen: () => Swal.showLoading(), customClass: { popup: "kiosco-swal" } });
  try {
    const { data } = await api.post("/productos/criticos/enviar", formulario);
    alertaExito("Pedido enviado", data.mensaje);
  } catch (error) {
    const codigo = error?.response?.data?.codigo;
    if (codigo === "SIN_SMTP" || codigo === "ERROR_SMTP") {
      // 4) Plan B: abrir el correo del usuario con el pedido ya escrito
      const r = await Swal.fire({
        icon: "warning",
        title: "No se pudo enviar desde el sistema",
        html: "Podés enviarlo desde tu correo: se abre con el pedido ya escrito. Si querés adjuntar la planilla, descargala primero.",
        showCancelButton: true,
        showDenyButton: true,
        confirmButtonText: "Abrir mi correo",
        denyButtonText: "Descargar planilla",
        cancelButtonText: "Cerrar",
        confirmButtonColor: COLOR_PRIMARIO,
        denyButtonColor: "#2e7d32",
        cancelButtonColor: "#94a3b8",
        customClass: { popup: "kiosco-swal" },
      });
      if (r.isDenied) {
        await descargarCriticosCsv();
        window.location.href = armarMailto(formulario.email, formulario.mensaje, productos);
      } else if (r.isConfirmed) {
        window.location.href = armarMailto(formulario.email, formulario.mensaje, productos);
      }
    } else {
      alertaError("No se pudo enviar el pedido", mensajeDeError(error, "Intentá de nuevo."));
    }
  }
}
