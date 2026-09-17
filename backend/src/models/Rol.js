const { DataTypes } = require('sequelize');
const sequelize = require('../config/db');

const Rol = sequelize.define(
  'Rol',
  {
    id_Rol: {
      type: DataTypes.INTEGER,
      primaryKey: true,
      autoIncrement: true,
    },
    Nombre: {
      type: DataTypes.ENUM('Admin', 'Cajero'),
      allowNull: false,
      unique: true,
    },
  },
  {
    tableName: 'roles',
    timestamps: false,
  }
);

module.exports = Rol;