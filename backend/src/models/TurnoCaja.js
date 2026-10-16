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
  Total_Efectivo: {
    type: DataTypes.DECIMAL(10, 2),
    allowNull: true
  },
  Total_Tarjeta: {
    type: DataTypes.DECIMAL(10, 2),
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