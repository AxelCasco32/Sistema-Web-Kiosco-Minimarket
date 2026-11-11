// routes/ventas.routes.js
// Define los endpoints HTTP del recurso Ventas y los conecta con su controller.
// Ejemplo de endpoints esperados:
//   POST /api/ventas          (registrar una venta con su detalle)
//   GET  /api/ventas          (obtener el historial de ventas)
//   GET  /api/ventas/:id      (consultar una venta puntual)
// routes/ventas.routes.js
// Define los endpoints HTTP del recurso Ventas y los conecta con su controller.

const express = require('express');
const router = express.Router();
const { 
  registrarVenta, 
  obtenerVentas, 
  obtenerProductosMasVendidos, // <-- Importada acá
  resumenHoy,
} = require('../controllers/ventas.controller');
const { verificarToken, soloAdmin } = require('../middlewares/auth');

// Ruta para obtener el reporte de los productos más vendidos
router.get('/reportes/mas-vendidos', verificarToken, soloAdmin, obtenerProductosMasVendidos);

// Resumen del día (ganancias en tiempo real del panel de Admin)
router.get('/resumen-hoy', verificarToken, soloAdmin, resumenHoy);

// Ruta GET para enviar el historial de ventas al panel de Admin
router.get('/', verificarToken, soloAdmin, obtenerVentas);

// Ruta POST para recibir el cobro desde la caja del frontend
router.post('/', verificarToken, registrarVenta);

module.exports = router;