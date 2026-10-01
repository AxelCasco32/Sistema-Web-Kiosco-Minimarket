const { DataTypes } = require('sequelize');
const sequelize = require('../config/db');

const Producto = sequelize.define(
  'Producto',
  {
    idProductos: {
      type: DataTypes.INTEGER,
      primaryKey: true,
      autoIncrement: true,
    },
    Cod_barra: { type: DataTypes.STRING(45), allowNull: false, unique: true },
    Nombre: { type: DataTypes.STRING(145), allowNull: false },
    Precio_costo: { type: DataTypes.DECIMAL(12, 2), allowNull: false, defaultValue: 0.0 },
    Precio_Venta: { type: DataTypes.DECIMAL(12, 2), allowNull: false, defaultValue: 0.0 },
    Stock: { type: DataTypes.INTEGER, allowNull: false, defaultValue: 0 },
    Activo: { type: DataTypes.BOOLEAN, allowNull: false, defaultValue: true },
  },
  {
    tableName: 'productos',
    timestamps: true,
  }
);

module.exports = Producto;