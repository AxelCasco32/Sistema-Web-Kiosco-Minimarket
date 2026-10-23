const { TurnoCaja, Venta } = require('../models');

const abrirTurno = async (req, res) => {
  try {
    const { id_Usuario, total_efectivo_inicial } = req.body;

    // Tomamos el fondo enviado por el usuario, o 0 si no ingresó nada
    const fondoInicial = Number(total_efectivo_inicial) || 0;

    const nuevoTurno = await TurnoCaja.create({
      id_Usuario: id_Usuario || 1,
      Hora_Apertura: new Date(),
      Total_Efectivo: fondoInicial, // <-- Guarda el dinero con el que arranca la caja
      Total_Tarjeta: 0,
      Estado: 'Abierto',
    });

    res.status(201).json({
      mensaje: 'Caja abierta correctamente',
      id_turno: nuevoTurno.idturnos_caja,
      fondoInicial,
    });
  } catch (error) {
    console.error("Error al abrir caja:", error);
    res.status(500).json({ error: 'Error interno al abrir la caja' });
  }
};

const obtenerResumen = async (req, res) => {
  try {
    const { id } = req.params;

    // 1. Buscamos el turno para obtener el fondo inicial de apertura
    const turno = await TurnoCaja.findByPk(id);
    const fondoInicial = Number(turno?.Total_Efectivo || 0);

    // 2. Buscamos las ventas registradas durante este turno
    const ventas = await Venta.findAll({ where: { id_turno: id } });

    let ventasEfectivo = 0;
    let totalTarjeta = 0;

    ventas.forEach((venta) => {
      const monto = Number(venta.Total_Venta || 0);
      const metodo = String(venta.Metodo_Pago || venta.metodo_pago || '').toLowerCase().trim();

      if (metodo === 'efectivo') {
        ventasEfectivo += monto;
      } else {
        totalTarjeta += monto;
      }
    });

    // Total físico en el cajón = Fondo inicial + Ventas en efectivo
    const totalEfectivo = fondoInicial + ventasEfectivo;

    res.status(200).json({
      fondoInicial,
      ventasEfectivo,
      totalEfectivo,
      totalTarjeta,
      cantidadVentas: ventas.length,
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

    await TurnoCaja.update(
      {
        Hora_Cierre: new Date(),
        Total_Efectivo: Number(totalEfectivo) || 0,
        Total_Tarjeta: Number(totalTarjeta) || 0,
        Estado: 'Cerrado',
      },
      {
        where: { idturnos_caja: id },
      }
    );

    res.status(200).json({ mensaje: 'Caja cerrada correctamente' });
  } catch (error) {
    console.error("Error al cerrar caja:", error);
    res.status(500).json({ error: 'Error interno al cerrar la caja' });
  }
};

module.exports = { abrirTurno, obtenerResumen, cerrarTurno };