// middlewares/errorHandler.js
// Middleware global de manejo de errores de Express.
// Responsabilidad: capturar cualquier error no controlado en los controllers
// y devolver una respuesta JSON consistente (status + mensaje), en vez de
// que Express devuelva un stack trace crudo al cliente.
