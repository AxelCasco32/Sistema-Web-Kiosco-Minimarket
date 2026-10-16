const { DataTypes } = require('sequelize');
const sequelize = require('../config/db');

const DetalleVenta = sequelize.define('DetalleVenta', {
  id_detalle: {
    type: DataTypes.INTEGER,
    primaryKey: true,
    autoIncrement: true
  },
  id_venta: {
    type: DataTypes.INTEGER,
    allowNull: false
  },
  id_producto: {
    type: DataTypes.INTEGER,
    allowNull: false
  },
  Cantidad: {
    type: DataTypes.INTEGER,
    allowNull: false
  },
  Precio_unitario: {
    type: DataTypes.DECIMAL(10, 2),
    allowNull: false
  },
  Subtotal: {
    type: DataTypes.DECIMAL(10, 2),
    allowNull: false
  }
}, {
  tableName: 'detalle_venta',
  timestamps: false
});

module.exports = DetalleVenta;