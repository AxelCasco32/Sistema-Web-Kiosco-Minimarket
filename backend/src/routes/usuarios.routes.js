const express = require('express');
const router = express.Router();
const { verificarToken, soloAdmin } = require('../middlewares/auth');
const {
  listarUsuarios,
  listarRoles,
  crearUsuario,
  actualizarUsuario,
  cambiarEstadoUsuario,
  eliminarUsuario,
} = require('../controllers/usuarios.controller');

// La gestión de usuarios es exclusiva del Administrador:
// todas las rutas exigen sesión iniciada y rol Admin.
router.use(verificarToken, soloAdmin);

router.get('/roles', listarRoles);
router.get('/', listarUsuarios);
router.post('/', crearUsuario);
router.put('/:id', actualizarUsuario);
router.patch('/:id/estado', cambiarEstadoUsuario);
router.delete('/:id', eliminarUsuario);

module.exports = router;