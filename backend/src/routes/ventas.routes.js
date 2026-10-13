// routes/ventas.routes.js
// Define los endpoints HTTP del recurso Ventas y los conecta con su controller.
// Ejemplo de endpoints esperados:
//   POST /api/ventas          (registrar una venta con su detalle)
//   GET  /api/ventas/:id      (consultar una venta puntual)
const express = require('express');
const router = express.Router();
const { registrarVenta } = require('../controllers/ventas.controller');
const { verificarToken } = require('../middlewares/auth');

// Ruta POST para recibir el cobro desde la caja del frontend
router.post('/', verificarToken, registrarVenta);

module.exports = router;