const { DataTypes } = require('sequelize');
const sequelize = require('../config/db'); // Ajustá la ruta si tu archivo de conexión se llama distinto

const Venta = sequelize.define('Venta', {
  id_Venta: {
    type: DataTypes.INTEGER,
    primaryKey: true,
    autoIncrement: true
  },
  id_turno: {
    type: DataTypes.INTEGER,
    allowNull: true
  },
  id_cliente: {
    type: DataTypes.INTEGER,
    allowNull: true
  },
  Fecha_Hora: {
    type: DataTypes.DATE,
    allowNull: true
  },
  Metodo_Pago: {
    type: DataTypes.STRING,
    allowNull: true
  },
  Monto: {
    type: DataTypes.DECIMAL(10, 2),
    allowNull: true
  },
  Vuelto: {
    type: DataTypes.DECIMAL(10, 2),
    allowNull: true
  },
  Total_Venta: {
    type: DataTypes.DECIMAL(10, 2),
    allowNull: true
  }
}, {
  tableName: 'venta', // Nombre exacto de la tabla
  timestamps: false   // Lo apagamos porque Lautaro no agregó createdAt/updatedAt
});

module.exports = Venta;