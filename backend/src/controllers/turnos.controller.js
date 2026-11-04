const { TurnoCaja, Venta, Usuario } = require('../models');

const esAdmin = (req) => req.usuario?.rol_nombre === 'Admin';

// Un cajero solo puede operar sobre sus propios turnos; el Admin sobre cualquiera.
const puedeOperarTurno = (req, turno) =>
  esAdmin(req) || Number(turno.id_Usuario) === Number(req.usuario?.id_Usuario);

// Suma las ventas del turno separando efectivo de medios electrónicos.
async function calcularTotales(turno) {
  const fondoInicial = Number(turno.Fondo_Inicial || 0);
  const ventas = await Venta.findAll({ where: { id_turno: turno.idturnos_caja } });

  let ventasEfectivo = 0;
  let totalTarjeta = 0;

  ventas.forEach((venta) => {
    const monto = Number(venta.Total_Venta || 0);
    const metodo = String(venta.Metodo_Pago || '').toLowerCase().trim();

    if (metodo === 'efectivo') {
      ventasEfectivo += monto;
    } else {
      totalTarjeta += monto;
    }
  });

  return {
    fondoInicial,
    ventasEfectivo,
    // Total físico esperado en el cajón = Fondo inicial + Ventas en efectivo
    totalEfectivo: fondoInicial + ventasEfectivo,
    totalTarjeta,
    cantidadVentas: ventas.length,
  };
}

const abrirTurno = async (req, res) => {
  try {
    const { total_efectivo_inicial } = req.body;
    const fondoInicial = Number(total_efectivo_inicial) || 0;

    if (fondoInicial < 0) {
      return res.status(400).json({ error: 'El fondo inicial no puede ser negativo' });
    }

    // El turno queda a nombre del usuario logueado (sale del token, no del body)
    const nuevoTurno = await TurnoCaja.create({
      id_Usuario: req.usuario.id_Usuario,
      Hora_Apertura: new Date(),
      Fondo_Inicial: fondoInicial,
      Total_Efectivo: fondoInicial,
      Total_Tarjeta: 0,
      Estado: 'Abierto',
    });

    res.status(201).json({
      mensaje: 'Caja abierta correctamente',
      id_turno: nuevoTurno.idturnos_caja,
      fondoInicial,
    });
  } catch (error) {
    console.error('Error al abrir caja:', error);
    res.status(500).json({ error: 'Error interno al abrir la caja' });
  }
};

const obtenerResumen = async (req, res) => {
  try {
    const turno = await TurnoCaja.findByPk(req.params.id);
    if (!turno) return res.status(404).json({ error: 'Turno no encontrado' });
    if (!puedeOperarTurno(req, turno)) {
      return res.status(403).json({ error: 'No tenés permiso sobre este turno' });
    }

    const totales = await calcularTotales(turno);
    res.status(200).json({ ...totales, estado: turno.Estado });
  } catch (error) {
    console.error('Error al obtener resumen:', error);
    res.status(500).json({ error: 'Error interno al calcular el resumen' });
  }
};

const cerrarTurno = async (req, res) => {
  try {
    const turno = await TurnoCaja.findByPk(req.params.id);
    if (!turno) return res.status(404).json({ error: 'Turno no encontrado' });
    if (!puedeOperarTurno(req, turno)) {
      return res.status(403).json({ error: 'No tenés permiso sobre este turno' });
    }
    if (turno.Estado === 'Cerrado') {
      return res.status(409).json({ error: 'Este turno ya fue cerrado' });
    }

    const { efectivo_contado } = req.body;
    const efectivoContado = Number(efectivo_contado);
    if (efectivo_contado === undefined || efectivo_contado === '' || Number.isNaN(efectivoContado) || efectivoContado < 0) {
      return res.status(400).json({ error: 'Ingresá el efectivo contado en el cajón' });
    }

    // Los totales se recalculan acá: no se confía en lo que manda el navegador
    const totales = await calcularTotales(turno);
    const diferencia = Number((efectivoContado - totales.totalEfectivo).toFixed(2));

    await turno.update({
      Hora_Cierre: new Date(),
      Total_Efectivo: totales.totalEfectivo,
      Total_Tarjeta: totales.totalTarjeta,
      Efectivo_Contado: efectivoContado,
      Diferencia: diferencia, // negativo = faltante, positivo = sobrante
      Estado: 'Cerrado',
    });

    res.status(200).json({
      mensaje: 'Caja cerrada correctamente',
      ...totales,
      efectivoContado,
      diferencia,
    });
  } catch (error) {
    console.error('Error al cerrar caja:', error);
    res.status(500).json({ error: 'Error interno al cerrar la caja' });
  }
};

// GET /api/turnos (solo Admin) - historial de cierres con responsable y diferencias
const listarTurnos = async (req, res) => {
  try {
    const turnos = await TurnoCaja.findAll({
      include: { model: Usuario, attributes: ['Nombre', 'Apellido', 'Usuario'] },
      order: [['Hora_Apertura', 'DESC']],
      limit: 200,
    });
    res.status(200).json(turnos);
  } catch (error) {
    console.error('Error al listar turnos:', error);
    res.status(500).json({ error: 'Error interno al listar los turnos' });
  }
};

module.exports = { abrirTurno, obtenerResumen, cerrarTurno, listarTurnos, puedeOperarTurno };
