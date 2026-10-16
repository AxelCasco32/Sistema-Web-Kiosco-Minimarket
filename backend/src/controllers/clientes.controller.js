const { Cliente } = require('../models');

// Función 1: Buscar cliente por su CUIT o DNI
const buscarPorCuit = async (req, res) => {
  try {
    const { cuit } = req.params;
    
    // Buscamos usando el nombre de columna real: Cuit_DNI
    const cliente = await Cliente.findOne({ where: { Cuit_DNI: cuit } });

    if (!cliente) {
      return res.status(404).json({ mensaje: 'Cliente no encontrado' });
    }

    res.json(cliente);
  } catch (error) {
    console.error("Error al buscar cliente:", error);
    res.status(500).json({ mensaje: 'Error interno del servidor' });
  }
};

// Función 2: Guardar un cliente nuevo al vuelo
const crearCliente = async (req, res) => {
  try {
    const { nombre, cuit, condicion_iva } = req.body;

    const clienteExistente = await Cliente.findOne({ where: { Cuit_DNI: cuit } });
    if (clienteExistente) {
      return res.status(400).json({ mensaje: 'Ya existe un cliente con ese CUIT/DNI' });
    }

    // Lo creamos usando las columnas reales de Lautaro
    const nuevoCliente = await Cliente.create({
      Nombre_razon_social: nombre,
      Cuit_DNI: cuit,
      Tipo_Cliente: condicion_iva || 'consumidor_final'
    });

    res.status(201).json(nuevoCliente);
  } catch (error) {
    console.error("Error al crear cliente:", error);
    res.status(500).json({ mensaje: 'Error al registrar el cliente en la base de datos' });
  }
};

module.exports = {
  buscarPorCuit,
  crearCliente
};