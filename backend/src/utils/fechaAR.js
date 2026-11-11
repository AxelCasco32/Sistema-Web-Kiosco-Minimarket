// utils/fechaAR.js
// Fechas en hora de Argentina (UTC-3, sin horario de verano), sin importar
// la zona horaria del servidor (Render corre en UTC).
const OFFSET_MS = 3 * 60 * 60 * 1000;

// Inicio del día de hoy en Argentina, como Date (UTC)
function inicioDeHoyAR(ahora = new Date()) {
  const local = new Date(ahora.getTime() - OFFSET_MS);
  return new Date(Date.UTC(local.getUTCFullYear(), local.getUTCMonth(), local.getUTCDate()) + OFFSET_MS);
}

// Hora (0 a 23) en Argentina de una fecha
function horaAR(fecha) {
  return new Date(new Date(fecha).getTime() - OFFSET_MS).getUTCHours();
}

module.exports = { inicioDeHoyAR, horaAR };
