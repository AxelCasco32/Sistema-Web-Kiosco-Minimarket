const { TurnoCaja, Venta } = require('../models'); // Asegurate de que se llame igual que en tu index.js de models

const abrirTurno = async (req, res) => {
  try {
    const { id_Usuario } = req.body;

    const nuevoTurno = await TurnoCaja.create({
      id_Usuario: id_Usuario || 1, // Por si no llega, ponemos 1
      Hora_Apertura: new Date(),
      Total_Efectivo: 0,
      Total_Tarjeta: 0,
      Estado: 'Abierto'
      // Hora_Cierre queda en NULL por defecto
    });

    res.status(201).json({ 
      mensaje: 'Caja abierta correctamente', 
      id_turno: nuevoTurno.idturnos_caja 
    });

  } catch (error) {
    console.error("Error al abrir caja:", error);
    res.status(500).json({ error: 'Error interno al abrir la caja' });
  }
};

const obtenerResumen = async (req, res) => {
  try {
    const { id } = req.params;
    
    // Buscamos todas las ventas asociadas a este turno
    const ventas = await Venta.findAll({ where: { id_turno: id } });

    let totalEfectivo = 0;
    let totalTarjeta = 0;

    ventas.forEach(venta => {
      const monto = Number(venta.Total_Venta);
      
      // Atrapamos el dato sin importar si Sequelize lo trajo como Metodo_Pago o metodo_pago,
      // lo pasamos a minúsculas y le sacamos los espacios vacíos por las dudas.
      const metodo = String(venta.Metodo_Pago || venta.metodo_pago || '').toLowerCase().trim();

      if (metodo === 'efectivo') {
        totalEfectivo += monto;
      } else {
        // Todo lo que sea 'tarjeta' o 'transferencia' cae acá
        totalTarjeta += monto;
      }
    });

    res.status(200).json({ 
      totalEfectivo, 
      totalTarjeta, 
      cantidadVentas: ventas.length 
    });

  } catch (error) {
    console.error("Error al obtener resumen:", error);
    res.status(500).json({ error: 'Error interno al calcular el resumen' });
  }
};

const cerrarTurno = async (req, res) => {
  try {
    const { id } = req.params;
    const { totalEfectivo, totalTarjeta } = req.body;

    await TurnoCaja.update({
      Hora_Cierre: new Date(),
      Total_Efectivo: totalEfectivo,
      Total_Tarjeta: totalTarjeta,
      Estado: 'Cerrado'
    }, { 
      where: { idturnos_caja: id } 
    });

    res.status(200).json({ mensaje: 'Caja cerrada correctamente' });

  } catch (error) {
    console.error("Error al cerrar caja:", error);
    res.status(500).json({ error: 'Error interno al cerrar la caja' });
  }
};

module.exports = { abrirTurno, obtenerResumen, cerrarTurno };