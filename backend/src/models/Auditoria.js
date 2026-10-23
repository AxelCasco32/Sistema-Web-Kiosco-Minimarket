const { DataTypes } = require('sequelize');
const sequelize = require('../config/db');

const Auditoria = sequelize.define(
  'Auditoria',
  {
    id: {
      type: DataTypes.INTEGER,
      primaryKey: true,
      autoIncrement: true,
    },
    id_usuario: {
      type: DataTypes.INTEGER,
      allowNull: false,
    },
    nombre_usuario: {
      type: DataTypes.STRING(100),
      allowNull: false,
    },
    id_producto: {
      type: DataTypes.INTEGER,
      allowNull: false,
    },
    nombre_producto: {
      type: DataTypes.STRING(145),
      allowNull: false,
    },
    campo_modificado: {
      type: DataTypes.STRING(50),
      allowNull: false,
    },
    valor_anterior: {
      type: DataTypes.STRING(100),
      allowNull: false,
    },
    valor_nuevo: {
      type: DataTypes.STRING(100),
      allowNull: false,
    },
    fecha_hora: {
      type: DataTypes.DATE,
      defaultValue: DataTypes.NOW,
    },
  },
  {
    tableName: 'auditorias',
    timestamps: false,
  }
);

module.exports = Auditoria;