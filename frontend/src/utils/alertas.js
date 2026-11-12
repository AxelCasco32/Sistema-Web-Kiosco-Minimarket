// utils/alertas.js
// Alertas y confirmaciones del sistema con SweetAlert2, con los colores de
// KiosquitoYa. Reemplazan a alert() / window.confirm() del navegador.
//
//   alertaExito(titulo, texto)      -> modal verde
//   alertaError(titulo, texto)      -> modal rojo
//   alertaAviso(titulo, texto)      -> modal amarillo
//   await confirmar({ ... })        -> true si el usuario confirma
//   avisoRapido(texto, tipo)        -> toast que no bloquea (ideal para el POS)
//
// Los textos se escapan, así que se puede pasar cualquier dato (nombres,
// mensajes del backend) sin riesgo; los saltos de línea (\n) se respetan.
import Swal from "sweetalert2";
import "./alertas.css";

const COLOR_PRIMARIO = "#261d60";
const COLOR_PELIGRO = "#c62828";
const COLOR_CANCELAR = "#94a3b8";

function aHtml(texto) {
  return String(texto ?? "")
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#39;")
    .replace(/\n/g, "<br>");
}

const base = {
  confirmButtonColor: COLOR_PRIMARIO,
  confirmButtonText: "Aceptar",
  customClass: { popup: "kiosco-swal" },
};

function modal(icon, titulo, texto) {
  return Swal.fire({
    ...base,
    icon,
    title: titulo,
    html: texto ? aHtml(texto) : undefined,
  });
}

export const alertaExito = (titulo, texto) => modal("success", titulo, texto);
export const alertaError = (titulo, texto) => modal("error", titulo, texto);
export const alertaAviso = (titulo, texto) => modal("warning", titulo, texto);
export const alertaInfo = (titulo, texto) => modal("info", titulo, texto);

export async function confirmar({
  titulo,
  texto,
  textoConfirmar = "Sí, continuar",
  textoCancelar = "Cancelar",
  peligro = false,
  icono = "question",
}) {
  const resultado = await Swal.fire({
    ...base,
    icon: icono,
    title: titulo,
    html: texto ? aHtml(texto) : undefined,
    showCancelButton: true,
    confirmButtonText: textoConfirmar,
    cancelButtonText: textoCancelar,
    confirmButtonColor: peligro ? COLOR_PELIGRO : COLOR_PRIMARIO,
    cancelButtonColor: COLOR_CANCELAR,
    reverseButtons: true,
    focusCancel: peligro,
  });
  return resultado.isConfirmed;
}

// Venta cobrada: muestra el resumen y ofrece imprimir el ticket.
// Devuelve true si el cajero eligió "Imprimir ticket". El foco queda en
// "Listo" para que Enter o Esc sigan atendiendo sin imprimir.
export async function ventaRegistrada(texto) {
  const resultado = await Swal.fire({
    ...base,
    icon: "success",
    title: "¡Venta registrada!",
    html: aHtml(texto),
    showCancelButton: true,
    confirmButtonText: "Imprimir ticket",
    cancelButtonText: "Listo",
    cancelButtonColor: COLOR_CANCELAR,
    reverseButtons: true,
    focusCancel: true,
  });
  return resultado.isConfirmed;
}

const toast = Swal.mixin({
  toast: true,
  position: "top-end",
  showConfirmButton: false,
  timer: 2500,
  timerProgressBar: true,
  customClass: { popup: "kiosco-swal-toast" },
});

// tipo: "success" | "error" | "warning" | "info"
export function avisoRapido(texto, tipo = "info") {
  return toast.fire({ icon: tipo, title: texto });
}

// Mensaje de error que devuelve el backend, o uno genérico
export function mensajeDeError(error, porDefecto) {
  return error?.response?.data?.error || error?.response?.data?.mensaje || porDefecto;
}
