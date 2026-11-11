// realtime/socket.js
// WebSockets (socket.io) para avisar en tiempo real al panel de Admin.
// Solo los usuarios con rol Admin (token JWT válido) pueden conectarse:
// el resto es rechazado en el saludo inicial.
const { Server } = require('socket.io');
const jwt = require('jsonwebtoken');

let io = null;
const SALA_ADMINS = 'admins';

function iniciarSocket(servidorHttp, origenesPermitidos) {
  io = new Server(servidorHttp, {
    cors: { origin: origenesPermitidos.length ? origenesPermitidos : '*' },
  });

  io.use((socket, next) => {
    try {
      const token = socket.handshake.auth?.token;
      const datos = jwt.verify(token, process.env.JWT_SECRET);
      if (datos.rol_nombre !== 'Admin') return next(new Error('Solo administradores'));
      socket.usuario = datos;
      next();
    } catch {
      next(new Error('Token inválido o expirado'));
    }
  });

  io.on('connection', (socket) => {
    socket.join(SALA_ADMINS);
  });

  return io;
}

// Envía un evento a todos los administradores conectados (si los hay).
function avisarAdmins(evento, datos) {
  if (io) io.to(SALA_ADMINS).emit(evento, datos);
}

module.exports = { iniciarSocket, avisarAdmins };
