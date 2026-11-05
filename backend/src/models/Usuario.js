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
    // Obligatorio para usuarios nuevos (los anteriores a la migración 003 pueden no tenerlo)
    Email: { type: DataTypes.STRING(150), allowNull: true, unique: true },
    password_hash: { type: DataTypes.STRING(255), allowNull: false },
    Activo: { type: DataTypes.BOOLEAN, allowNull: false, defaultValue: true },
    // Código de recuperación enviado por correo: solo se guarda su hash,
    // vence a los 15 minutos y admite pocos intentos.
    codigo_recuperacion_hash: { type: DataTypes.STRING(255), allowNull: true },
    codigo_recuperacion_expira: { type: DataTypes.DATE, allowNull: true },
    codigo_recuperacion_intentos: { type: DataTypes.INTEGER, allowNull: false, defaultValue: 0 },
  },
  {
    tableName: 'usuarios',
    timestamps: true, // ya tenés createdAt/updatedAt en la tabla
  }
);

module.exports = Usuario;