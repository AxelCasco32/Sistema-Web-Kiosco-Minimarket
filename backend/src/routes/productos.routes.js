const express = require('express');
const router = express.Router();
const { verificarToken, soloAdmin } = require('../middlewares/auth');
const {
  listarProductos,
  buscarPorCodigoBarra,
  crearProducto,
  editarProducto,
  listarAuditorias,
  listarCriticos,
  descargarCriticosCsv,
  enviarCriticosProveedor,
} = require('../controllers/productos.controller');

// Rutas
router.get('/', verificarToken, listarProductos);
router.get('/auditorias', verificarToken, soloAdmin, listarAuditorias);
// Stock crítico: listar, exportar a Excel (CSV) y enviar al proveedor
router.get('/criticos', verificarToken, soloAdmin, listarCriticos);
router.get('/criticos/csv', verificarToken, soloAdmin, descargarCriticosCsv);
router.post('/criticos/enviar', verificarToken, soloAdmin, enviarCriticosProveedor);
router.get('/:cod_barra', verificarToken, buscarPorCodigoBarra);
router.post('/', verificarToken, soloAdmin, crearProducto);
router.put('/:id', verificarToken, soloAdmin, editarProducto);

module.exports = router;