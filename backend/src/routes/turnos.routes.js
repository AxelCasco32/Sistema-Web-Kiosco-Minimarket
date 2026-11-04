// routes/turnos.routes.js
// Define los endpoints HTTP del recurso Turnos de Caja y los conecta con su controller.
//   POST /api/turnos/abrir          (Cajero/Admin: abre un turno a su nombre)
//   GET  /api/turnos/:id/resumen    (dueño del turno o Admin)
//   PUT  /api/turnos/cerrar/:id     (dueño del turno o Admin: registra efectivo contado y diferencia)
//   GET  /api/turnos                (solo Admin: historial de cierres y faltantes)
const express = require('express');
const router = express.Router();
const { verificarToken, soloAdmin } = require('../middlewares/auth');
const { abrirTurno, obtenerResumen, cerrarTurno, listarTurnos } = require('../controllers/turnos.controller');

router.use(verificarToken);

router.get('/', soloAdmin, listarTurnos);
router.post('/abrir', abrirTurno);
router.get('/:id/resumen', obtenerResumen);
router.put('/cerrar/:id', cerrarTurno);

module.exports = router;
