// config/db.js
// Conexión a MySQL con Sequelize, con los datos del .env (o del panel de Render).
require('dotenv').config();
const crypto = require('crypto');
const { Sequelize } = require('sequelize');

// Se quitan espacios y saltos de línea que se cuelan al copiar y pegar
// los valores en paneles como el de Render.
const limpio = (v) => (v === undefined || v === null ? v : String(v).trim());

const DB = {
  host: limpio(process.env.DB_HOST),
  port: Number(limpio(process.env.DB_PORT)) || 3306,
  name: limpio(process.env.DB_NAME),
  user: limpio(process.env.DB_USER),
  password: limpio(process.env.DB_PASSWORD),
};

const sequelize = new Sequelize(DB.name, DB.user, DB.password, {
  host: DB.host,
  port: DB.port,
  dialect: 'mysql',
  logging: false, // Desactivar logs de SQL en consola
  // El plan gratuito de Clever Cloud admite pocas conexiones simultáneas
  pool: { max: Number(process.env.DB_POOL_MAX) || 4, min: 0, idle: 10000 },
});

// Huella corta de la contraseña: permite comparar dos contraseñas sin mostrarlas
const huella = (v) => crypto.createHash('sha256').update(String(v || '')).digest('hex').slice(0, 8);

// Datos para diagnosticar una conexión fallida sin mostrar la contraseña
sequelize.diagnostico = () => {
  const crudo = process.env.DB_PASSWORD || '';
  return (
    `host=${DB.host} puerto=${DB.port} base=${DB.name} usuario=${DB.user} ` +
    `contraseña=${DB.password ? DB.password.length : 0} caracteres huella=${huella(DB.password)}` +
    (crudo !== (DB.password || '') ? ' (tenía espacios o saltos de línea, se quitaron)' : '')
  );
};

module.exports = sequelize;
