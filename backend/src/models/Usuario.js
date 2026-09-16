const { DataTypes } = require('sequelize');
const sequelize = require('../config/db');

const Usuario = sequelize.define(
  'Usuario',
  {
    id_Usuario: {
      type: DataTypes.INTEGER,
      primaryKey: true,
      autoIncrement: true,
    },
    id_Rol: { type: DataTypes.INTEGER, allowNull: false },
    Nombre: { type: DataTypes.STRING(45), allowNull: false },
    Apellido: { type: DataTypes.STRING(45), allowNull: false },
    Usuario: { type: DataTypes.STRING(45), allowNull: false, unique: true },
    password_hash: { type: DataTypes.STRING(255), allowNull: false },
    Activo: { type: DataTypes.BOOLEAN, allowNull: false, defaultValue: true },
  },
  {
    tableName: 'usuarios',
    timestamps: true, // ya tenés createdAt/updatedAt en la tabla
  }
);

module.exports = Usuario;