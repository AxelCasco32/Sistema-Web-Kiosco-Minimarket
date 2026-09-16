// server.js
// Punto de entrada del backend.
// Responsabilidades:
//   - Inicializar Express y sus middlewares globales (cors, json, logger).
//   - Conectar con la base de datos (usar src/config/db.js).
//   - Registrar todas las rutas de la API bajo el prefijo /api (ej: /api/usuarios).
//   - Levantar el servidor en el puerto definido en .env (PORT).
// No debe contener lógica de negocio: solo arma y arranca la app.
require('dotenv').config();
const express = require('express');
const cors = require('cors');
const morgan = require('morgan');
const { sequelize } = require('./src/models');

const authRoutes = require('./src/routes/auth.routes');
// const productosRoutes = require('./src/routes/productos.routes');

const app = express();

app.use(cors());
app.use(express.json());
app.use(morgan('dev'));

app.get('/api/health', (req, res) => {
  res.json({ status: 'ok', mensaje: 'API del kiosco funcionando' });
});

app.use('/api/auth', authRoutes);
// app.use('/api/productos', productosRoutes);

const PORT = process.env.PORT || 4000;

sequelize
  .authenticate()
  .then(() => {
    console.log('Conexión a MySQL establecida correctamente.');
    app.listen(PORT, () => {
      console.log(`Servidor corriendo en http://localhost:${PORT}`);
    });
  })
  .catch((err) => {
    console.error('No se pudo conectar a la base de datos:', err.message);
  });