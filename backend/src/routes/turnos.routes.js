// routes/turnos.routes.js
// Define los endpoints HTTP del recurso Turnos de Caja y los conecta con su controller.
// Ejemplo de endpoints esperados:
//   POST /api/turnos/abrir
//   POST /api/turnos/:id/cerrar
//   GET  /api/turnos/:id
const express = require('express');
const router = express.Router();
const { abrirTurno, obtenerResumen, cerrarTurno } = require('../controllers/turnos.controller');

router.post('/abrir', abrirTurno);
router.get('/:id/resumen', obtenerResumen);
router.put('/cerrar/:id', cerrarTurno);

module.exports = router;