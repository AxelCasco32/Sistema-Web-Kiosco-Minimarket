const { dataTypes } = require('sequelize');
const sequelize = require('../config/db');

const Rol = sequelize.define(
  'Rol',
  {
    id: {
      type: dataTypes.INTEGER,
      primaryKey: true,
      autoIncrement: true,
    },
    nombre: {
      type: DataTypes.ENUM('Admin', 'Cajero'),
      allowNull: false,
    },
  },
  {
    tableName: 'roles',
    timestamps: false, // Desactivar timestamps si no se necesitan
  }
);

module.exports = Rol;       