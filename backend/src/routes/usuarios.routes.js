const express = require('express');
const router = express.Router();
const { verificarToken, soloAdmin } = require('../middlewares/auth');
const {
  listarUsuarios,
  listarRoles,
  crearUsuario,
  actualizarUsuario,
  cambiarEstadoUsuario,
} = require('../controllers/usuarios.controller');

// Todas las rutas de este archivo requieren estar logueado Y ser Admin
router.use(verificarToken, soloAdmin);

router.get('/roles', listarRoles);
router.get('/', listarUsuarios);
router.post('/', crearUsuario);
router.put('/:id', actualizarUsuario);
router.patch('/:id/estado', cambiarEstadoUsuario);

module.exports = router;