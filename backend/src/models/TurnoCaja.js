const { DataTypes } = require('sequelize');
const sequelize = require('../config/db');

const TurnoCaja = sequelize.define('TurnoCaja', {
  idturnos_caja: {
    type: DataTypes.INTEGER,
    primaryKey: true,
    autoIncrement: true
  },
  id_Usuario: {
    type: DataTypes.INTEGER,
    allowNull: true
  },
  Hora_Apertura: {
    type: DataTypes.DATE,
    allowNull: true
  },
  Hora_Cierre: {
    type: DataTypes.DATE,
    allowNull: true
  },
  Fondo_Inicial: {
    type: DataTypes.DECIMAL(12, 2),
    allowNull: false,
    defaultValue: 0
  },
  Total_Efectivo: {
    type: DataTypes.DECIMAL(10, 2),
    allowNull: true
  },
  Total_Tarjeta: {
    type: DataTypes.DECIMAL(10, 2),
    allowNull: true
  },
  Efectivo_Contado: {
    type: DataTypes.DECIMAL(12, 2),
    allowNull: true
  },
  Diferencia: {
    type: DataTypes.DECIMAL(12, 2),
    allowNull: true
  },
  Estado: {
    type: DataTypes.STRING,
    allowNull: true
  }
}, {
  tableName: 'turnos_caja',
  timestamps: false
});

module.exports = TurnoCaja;