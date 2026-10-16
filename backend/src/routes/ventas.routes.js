// routes/ventas.routes.js
// Define los endpoints HTTP del recurso Ventas y los conecta con su controller.
// Ejemplo de endpoints esperados:
//   POST /api/ventas          (registrar una venta con su detalle)
//   GET  /api/ventas          (obtener el historial de ventas)
//   GET  /api/ventas/:id      (consultar una venta puntual)

const express = require('express');
const router = express.Router();
const { registrarVenta, obtenerVentas } = require('../controllers/ventas.controller'); // <-- Sumamos obtenerVentas
const { verificarToken } = require('../middlewares/auth');

// Ruta POST para recibir el cobro desde la caja del frontend
router.post('/', verificarToken, registrarVenta);

// Ruta GET para enviar el historial de ventas al panel de Admin
router.get('/', verificarToken, obtenerVentas); // <-- Agregamos esta línea protegida

module.exports = router;