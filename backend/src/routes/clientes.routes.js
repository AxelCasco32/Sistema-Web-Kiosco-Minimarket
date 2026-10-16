const express = require('express');
const router = express.Router();
const clientesController = require('../controllers/clientes.controller');

// GET /api/clientes/:cuit -> Buscar si un cliente existe
router.get('/:cuit', clientesController.buscarPorCuit);

// POST /api/clientes -> Guardar un cliente nuevo
router.post('/', clientesController.crearCliente);

module.exports = router;