const express = require('express');
const router = express.Router();
const { verificarToken, soloAdmin } = require('../middlewares/auth');
const {
  listarUsuarios,
  listarRoles,
  crearUsuario,
  actualizarUsuario,
  cambiarEstadoUsuario,
  eliminarUsuario, // <-- Agregado a la importación
} = require('../controllers/usuarios.controller');

// Rutas de Usuarios
router.get('/roles', listarRoles);
router.get('/', listarUsuarios);
router.post('/', crearUsuario);
router.put('/:id', verificarToken, actualizarUsuario); // Dejamos una sola ruta PUT protegida
router.patch('/:id/estado', cambiarEstadoUsuario);
router.delete('/:id', verificarToken, eliminarUsuario); // Ruta DELETE protegida

module.exports = router;