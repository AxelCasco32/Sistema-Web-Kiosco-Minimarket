const express = require('express');
const router = express.Router();
const { verificarToken, soloAdmin } = require('../middlewares/auth');
const {
  login,
  recuperarContrasena,
  estadoCodigoRecuperacion,
  generarCodigoRecuperacion,
} = require('../controllers/auth.controller');

router.post('/login', login);

// "Olvidé mi contraseña": público, se valida con el código de recuperación
router.post('/recuperar', recuperarContrasena);

// El Admin logueado consulta / genera su código de recuperación
router.get('/codigo-recuperacion', verificarToken, soloAdmin, estadoCodigoRecuperacion);
router.post('/codigo-recuperacion', verificarToken, soloAdmin, generarCodigoRecuperacion);

module.exports = router;
