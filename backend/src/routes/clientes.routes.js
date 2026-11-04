const express = require('express');
const router = express.Router();
const clientesController = require('../controllers/clientes.controller');
const { verificarToken } = require('../middlewares/auth');

// Cajero y Admin necesitan sesión iniciada para buscar o cargar clientes.
router.use(verificarToken);

// GET /api/clientes/:cuit -> Buscar si un cliente existe
router.get('/:cuit', clientesController.buscarPorCuit);

// POST /api/clientes -> Guardar un cliente nuevo
router.post('/', clientesController.crearCliente);

module.exports = router;