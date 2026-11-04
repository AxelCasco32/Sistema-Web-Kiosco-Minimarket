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
router.get('/', verificarToken, listarProductos);
router.get('/auditorias', verificarToken, soloAdmin, listarAuditorias);
router.get('/:cod_barra', verificarToken, buscarPorCodigoBarra);
router.post('/', verificarToken, soloAdmin, crearProducto);
router.put('/:id', verificarToken, soloAdmin, editarProducto);

module.exports = router;