// middlewares/auth.js
// Responsabilidades:
//   - verificarToken: leer el JWT del header Authorization, validarlo y
//     colgar el usuario decodificado en req.usuario.
//   - soloAdmin: cortar la petición con 403 si req.usuario.rol no es "Admin".
// Se usa en las rutas que necesitan sesión iniciada o permisos de Admin
// (ej: ver/editar precio_costo, gestionar usuarios, ver reportes).
const jwt = require('jsonwebtoken');

function verificarToken(req, res, next) {
  const authHeader = req.headers.authorization;
  if (!authHeader) return res.status(401).json({ mensaje: 'Token no provisto' });

  const token = authHeader.split(' ')[1];
  try {
    const payload = jwt.verify(token, process.env.JWT_SECRET);
    req.usuario = payload; // { id_Usuario, id_Rol, rol_nombre }
    next();
  } catch (error) {
    res.status(401).json({ mensaje: 'Token inválido o expirado' });
  }
}

function soloAdmin(req, res, next) {
  if (req.usuario?.rol_nombre !== 'Admin') {
    return res.status(403).json({ mensaje: 'Acceso restringido a administradores' });
  }
  next();
}

module.exports = { verificarToken, soloAdmin };