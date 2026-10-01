const express = require('express');
const router = express.Router();
const {
  listarProductos,
  buscarPorCodigoBarra,
  crearProducto,
  editarProducto,
} = require('../controllers/productos.controller');
const { verificarToken, soloAdmin } = require('../middlewares/auth');

router.get('/', verificarToken, listarProductos);
router.get('/:cod_barra', verificarToken, buscarPorCodigoBarra);
router.post('/', verificarToken, soloAdmin, crearProducto);
router.put('/:id', verificarToken, soloAdmin, editarProducto);

module.exports = router;