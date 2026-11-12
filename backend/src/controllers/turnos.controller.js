const { TurnoCaja, Venta, Usuario, Rol } = require('../models');
const { enviarEmail, escaparHtml } = require('../utils/enviarEmail');
const { avisarAdmins } = require('../realtime/socket');

const pesos = (n) => `$${Number(n || 0).toLocaleString('es-AR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
const fechaHoraAR = (d) => new Date(d).toLocaleString('es-AR', { timeZone: 'America/Argentina/Buenos_Aires' });

// Aviso automático al dueño cuando un turno cierra con faltante:
// mail a todos los administradores activos con email y aviso en vivo al panel.
async function avisarFaltante(turno, totales, efectivoContado, diferencia) {
  const cajero = await Usuario.findByPk(turno.id_Usuario);
  const nombreCajero = cajero ? `${cajero.Nombre} ${cajero.Apellido}`.trim() : `Usuario #${turno.id_Usuario}`;
  const faltante = Math.abs(diferencia);

  avisarAdmins('cierre:faltante', {
    idTurno: turno.idturnos_caja,
    cajero: nombreCajero,
    faltante,
    esperado: totales.totalEfectivo,
    contado: efectivoContado,
  });

  const admins = await Usuario.findAll({
    where: { Activo: true },
    include: { model: Rol, where: { Nombre: 'Admin' } },
  });
  const destinatarios = admins.map((a) => a.Email).filter(Boolean);
  if (destinatarios.length === 0) {
    console.warn('[FALTANTE] No hay administradores con email para avisar del faltante.');
    return;
  }

  const filas = [
    ['Cajero responsable', nombreCajero],
    ['Turno', `#${turno.idturnos_caja}`],
    ['Apertura', fechaHoraAR(turno.Hora_Apertura)],
    ['Cierre', fechaHoraAR(turno.Hora_Cierre || new Date())],
    ['Ventas del turno', String(totales.cantidadVentas)],
    ['Efectivo esperado', pesos(totales.totalEfectivo)],
    ['Efectivo contado', pesos(efectivoContado)],
  ];
  const asunto = `⚠ Faltante de ${pesos(faltante)} en la caja de ${nombreCajero}`;
  const texto =
    `Se cerró un turno de caja con faltante.\n\n` +
    filas.map(([k, v]) => `${k}: ${v}`).join('\n') +
    `\nFaltante: ${pesos(faltante)}\n\nPodés ver el detalle en el panel: Control > Cierres de caja.\n\nKiosquitoYa`;
  const html = `
    <div style="font-family:Arial,Helvetica,sans-serif;color:#1e293b;max-width:520px">
      <h2 style="color:#b71c1c;margin-bottom:6px">Faltante en el cierre de caja</h2>
      <p style="margin-top:0">Se cerró un turno con <strong>${pesos(faltante)}</strong> menos de lo esperado.</p>
      <table style="border-collapse:collapse;font-size:14px;width:100%">
        ${filas.map(([k, v]) => `<tr><td style="padding:6px 10px;border:1px solid #e2e8f0;color:#64748b">${escaparHtml(k)}</td><td style="padding:6px 10px;border:1px solid #e2e8f0"><strong>${escaparHtml(v)}</strong></td></tr>`).join('')}
        <tr><td style="padding:6px 10px;border:1px solid #fecaca;background:#fff5f5;color:#b71c1c">Faltante</td><td style="padding:6px 10px;border:1px solid #fecaca;background:#fff5f5;color:#b71c1c"><strong>${pesos(faltante)}</strong></td></tr>
      </table>
      <p style="color:#64748b;font-size:13px">Detalle en el panel de administración: Control &gt; Cierres de caja.</p>
      <p>KiosquitoYa</p>
    </div>`;

  for (const para of destinatarios) {
    try {
      await enviarEmail({ para, asunto, texto, html });
    } catch (error) {
      // enviarEmail ya deja el motivo en el log; el cierre no se ve afectado
    }
  }
}

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

    // Faltante: aviso al dueño por mail y en el panel (después de responder,
    // así el cajero no espera el envío y un error no afecta el cierre)
    if (diferencia < -0.005) {
      avisarFaltante(turno, totales, efectivoContado, diferencia).catch((error) =>
        console.error('[FALTANTE] No se pudo avisar del faltante:', error.message)
      );
    }
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
