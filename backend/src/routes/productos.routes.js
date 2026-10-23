const express = require('express');
const router = express.Router();
const { verificarToken, soloAdmin } = require('../middlewares/auth');
const {
  listarProductos,
  buscarPorCodigoBarra,
  crearProducto,
  editarProducto,
  listarAuditorias
} = require('../controllers/productos.controller');

// Rutas
router.get('/', listarProductos);
router.get('/auditorias', verificarToken, soloAdmin, listarAuditorias);
router.get('/:cod_barra', buscarPorCodigoBarra);
router.post('/', verificarToken, soloAdmin, crearProducto);
router.put('/:id', verificarToken, soloAdmin, editarProducto);

module.exports = router;