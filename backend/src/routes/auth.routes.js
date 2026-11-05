const express = require('express');
const router = express.Router();
const { login, solicitarCodigo, restablecerContrasena } = require('../controllers/auth.controller');

router.post('/login', login);

// "¿Olvidaste tu contraseña?": se envía un código al email del usuario
router.post('/recuperar/solicitar', solicitarCodigo);
router.post('/recuperar/restablecer', restablecerContrasena);

module.exports = router;
