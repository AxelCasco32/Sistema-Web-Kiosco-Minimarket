// utils/csv.js
// Arma un CSV que Excel abre bien en español: separador ";" y BOM UTF-8
// (para que se vean los acentos y la ñ).
function celda(valor) {
  const texto = valor === null || valor === undefined ? '' : String(valor);
  return /[";\n\r]/.test(texto) ? `"${texto.replace(/"/g, '""')}"` : texto;
}

function armarCsv(encabezados, filas) {
  const lineas = [encabezados, ...filas].map((fila) => fila.map(celda).join(';'));
  return '﻿' + lineas.join('\r\n') + '\r\n';
}

module.exports = { armarCsv };
