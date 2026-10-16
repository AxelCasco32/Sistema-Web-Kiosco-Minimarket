const { DataTypes } = require('sequelize');
const sequelize = require('../config/db');

const Cliente = sequelize.define('Cliente', {
  id_Cliente: {
    type: DataTypes.INTEGER,
    primaryKey: true,
    autoIncrement: true
  },
  Tipo_Cliente: {
    type: DataTypes.STRING,
    allowNull: true // Puede ser 'consumidor_final', 'responsable_inscripto', etc.
  },
  Cuit_DNI: {
    type: DataTypes.STRING,
    allowNull: true
  },
  Nombre_razon_social: {
    type: DataTypes.STRING,
    allowNull: true
  },
  Domicilio: {
    type: DataTypes.STRING,
    allowNull: true
  },
  Telefono: {
    type: DataTypes.STRING,
    allowNull: true
  }
}, {
  tableName: 'clientes', 
  timestamps: true
});

module.exports = Cliente;