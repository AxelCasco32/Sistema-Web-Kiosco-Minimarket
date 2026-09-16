// models/index.js
// Responsabilidad: importar todos los modelos y definir las asociaciones entre ellos
// (hasMany / belongsTo), por ejemplo:
//   Usuario 1---N TurnoCaja
//   TurnoCaja 1---N Venta
//   Cliente 0/1---N Venta
//   Venta 1---N DetalleVenta
//   Producto 1---N DetalleVenta
// Exportar todos los modelos ya asociados para usarlos desde los controllers.
const sequelize = require('../config/db');
const Usuario = require('./Usuario');
const Rol = require('./Rol');

Usuario.belongsTo(Rol, { foreignKey: 'id_Rol' });
Rol.hasMany(Usuario, { foreignKey: 'id_Rol' });

module.exports = { sequelize, Usuario, Rol };