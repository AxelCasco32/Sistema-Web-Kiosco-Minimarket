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
  obtenerProductosMasVendidos // <-- Importada acá
} = require('../controllers/ventas.controller');
const { verificarToken } = require('../middlewares/auth');

// Ruta para obtener el reporte de los productos más vendidos
router.get('/reportes/mas-vendidos', verificarToken, obtenerProductosMasVendidos);

// Ruta GET para enviar el historial de ventas al panel de Admin
router.get('/', verificarToken, obtenerVentas);

// Ruta POST para recibir el cobro desde la caja del frontend
router.post('/', verificarToken, registrarVenta);

module.exports = router;