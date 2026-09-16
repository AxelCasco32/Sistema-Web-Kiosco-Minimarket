// middlewares/auth.js
// Responsabilidades:
//   - verificarToken: leer el JWT del header Authorization, validarlo y
//     colgar el usuario decodificado en req.usuario.
//   - soloAdmin: cortar la petición con 403 si req.usuario.rol no es "Admin".
// Se usa en las rutas que necesitan sesión iniciada o permisos de Admin
// (ej: ver/editar precio_costo, gestionar usuarios, ver reportes).
