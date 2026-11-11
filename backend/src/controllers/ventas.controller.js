const { Producto, Venta, DetalleVenta, TurnoCaja, Usuario, sequelize } = require('../models');
const { Op } = require('sequelize');
const { puedeOperarTurno } = require('./turnos.controller');
const { avisarAdmins } = require('../realtime/socket');
const { inicioDeHoyAR, horaAR } = require('../utils/fechaAR');

// Normaliza lo que manda el POS ("efectivo", "tarjeta", "transferencia", "qr")
// a los valores del ENUM de la tabla venta.
const METODOS_PAGO = {
  efectivo: 'Efectivo',
  tarjeta: 'Tarjeta',
  transferencia: 'Transferencia',
  qr: 'QR',
};

async function registrarVenta(req, res) {
  // Recibimos los datos del frontend (desde Pos.jsx)
  const { total, metodo_pago, id_cliente, id_turno, detalle, monto_recibido } = req.body;

  if (!detalle || detalle.length === 0) {
    return res.status(400).json({ error: "El detalle de la venta está vacío" });
  }

  const metodo = METODOS_PAGO[String(metodo_pago || '').toLowerCase().trim()];
  if (!metodo) {
    return res.status(400).json({ error: "Método de pago inválido" });
  }

  // La venta tiene que caer en un turno abierto del usuario que cobra,
  // así el arqueo y los faltantes quedan a nombre del responsable correcto.
  const turno = id_turno ? await TurnoCaja.findByPk(id_turno) : null;
  if (!turno || turno.Estado !== 'Abierto') {
    return res.status(400).json({ error: "No hay un turno de caja abierto. Abrí la caja antes de cobrar." });
  }
  if (!puedeOperarTurno(req, turno)) {
    return res.status(403).json({ error: "El turno indicado pertenece a otro usuario" });
  }

  const totalVenta = Number(total) || 0;
  let montoRecibido = totalVenta;
  if (metodo === 'Efectivo' && monto_recibido !== undefined && monto_recibido !== '') {
    montoRecibido = Number(monto_recibido);
    if (Number.isNaN(montoRecibido) || montoRecibido < totalVenta) {
      return res.status(400).json({ error: "El efectivo recibido no cubre el total" });
    }
  }
  const vuelto = Number((montoRecibido - totalVenta).toFixed(2));

  // Iniciamos la Transacción por seguridad (si algo falla, no se descuenta nada)
  const t = await sequelize.transaction();

  try {
    // 1. Creamos el registro general de la Venta (El Ticket)
    const nuevaVenta = await Venta.create({
      Total_Venta: totalVenta,
      Metodo_Pago: metodo,
      id_cliente: id_cliente || null, // null si es consumidor final
      Fecha_Hora: new Date(),
      Monto: montoRecibido, // lo que entregó el cliente
      Vuelto: vuelto,
      id_turno: turno.idturnos_caja
    }, { transaction: t });

    // Para el aviso en tiempo real: ganancia (precio - costo) y productos
    let gananciaVenta = 0;
    const itemsAviso = [];

    // 2. Recorremos cada producto del carrito para descontar stock y armar el detalle
    for (const item of detalle) {
      const producto = await Producto.findByPk(item.idProductos, { transaction: t });

      if (!producto) {
        throw new Error(`Producto no encontrado (ID: ${item.idProductos})`);
      }

      if (producto.Stock < item.cantidad) {
        throw new Error(`Stock insuficiente para "${producto.Nombre}". Quedan solo ${producto.Stock} unidades.`);
      }

      gananciaVenta += (Number(item.precio_unitario) - Number(producto.Precio_costo || 0)) * Number(item.cantidad);
      itemsAviso.push({ nombre: producto.Nombre, cantidad: Number(item.cantidad) });

      // Restamos la cantidad vendida al stock actual
      producto.Stock -= item.cantidad;
      await producto.save({ transaction: t });

      // 3. Guardamos cada renglón en la tabla detalle_venta
      await DetalleVenta.create({
        id_venta: nuevaVenta.id_Venta, // Vinculamos con la venta que acabamos de crear
        id_producto: item.idProductos, 
        Cantidad: item.cantidad,
        Precio_unitario: item.precio_unitario, 
        Subtotal: item.cantidad * item.precio_unitario // Calculamos el subtotal del renglón
      }, { transaction: t });
    }

    // 4. Si todo salió bien (Venta, Detalles y Stock), confirmamos los cambios (commit)
    await t.commit();
    res.status(200).json({ mensaje: "Venta registrada correctamente y stock descontado" });

    // 5. Aviso en tiempo real al panel de Admin (si falla, la venta ya quedó guardada)
    try {
      const cajero = await Usuario.findByPk(req.usuario.id_Usuario);
      avisarAdmins('venta:nueva', {
        idVenta: nuevaVenta.id_Venta,
        fecha: nuevaVenta.Fecha_Hora,
        hora: horaAR(nuevaVenta.Fecha_Hora),
        total: totalVenta,
        ganancia: Number(gananciaVenta.toFixed(2)),
        metodoPago: metodo,
        cajero: cajero ? `${cajero.Nombre} ${cajero.Apellido}`.trim() : 'Cajero',
        items: itemsAviso,
      });
    } catch (errorAviso) {
      console.error('No se pudo enviar el aviso en tiempo real:', errorAviso.message);
    }

  } catch (error) {
    // Si hubo algún error, cancelamos TODO (rollback)
    await t.rollback();
    console.error("Error al registrar la venta:", error);
    res.status(400).json({ error: error.message });
  }
}

// ==========================================
// NUEVA FUNCIÓN: Obtener Historial (Secuencial para bases gratuitas)
// ==========================================
async function obtenerVentas(req, res) {
  try {
    const ventas = await Venta.findAll({
      order: [['Fecha_Hora', 'DESC']]
    });

    const historialFormateado = [];

    for (const v of ventas) {
      const idDeVenta = v.id_Venta || v.idVentas || v.id;

      // --- 1. RASTREO DEL CAJERO ---
      let nombreCajero = `Turno #${v.id_turno || 1}`; // Valor por defecto

      if (v.id_turno) {
        // Buscamos el turno en la BD
        const turnoBD = await TurnoCaja.findByPk(v.id_turno);
        
        if (turnoBD && (turnoBD.id_Usuario || turnoBD.idUsuario)) {
          const idDelUsuario = turnoBD.id_Usuario || turnoBD.idUsuario;
          
          // Buscamos al usuario dueño de ese turno
          const usuarioBD = await Usuario.findByPk(idDelUsuario);
          if (usuarioBD) {
            nombreCajero = `${usuarioBD.Nombre} ${usuarioBD.Apellido}`; // Ej: "Hernán Lucero"
          } else {
            nombreCajero = `Cajero ID: ${idDelUsuario}`;
          }
        }
      }

      // --- 2. RASTREO DE LOS PRODUCTOS ---
      const detallesBD = await DetalleVenta.findAll({ 
        where: { id_venta: idDeVenta } 
      });

      const detallesConProducto = [];
      
      for (const d of detallesBD) {
        const idProd = d.id_producto || d.idProductos;
        let nombreProd = 'Producto eliminado';

        if (idProd) {
          const productoBD = await Producto.findByPk(idProd);
          if (productoBD) {
            nombreProd = productoBD.Nombre;
          }
        }

        detallesConProducto.push({
          cantidad: d.Cantidad || d.cantidad,
          Producto: { Nombre: nombreProd }
        });
      }

      // --- 3. ARMADO FINAL ---
      historialFormateado.push({
        idVenta: idDeVenta,
        fecha: v.Fecha_Hora,
        total: v.Total_Venta,
        metodo_pago: v.Metodo_Pago,
        Cajero: { Nombre: nombreCajero }, // Acá mandamos el nombre real
        Detalles: detallesConProducto
      });
    }

    res.status(200).json(historialFormateado);

  } catch (error) {
    console.error("Error crítico al obtener el historial de ventas:", error);
    res.status(500).json({ error: "No se pudo cargar el historial de ventas" });
  }
}

// Obtener ranking de los productos más vendidos y ganancias
// Obtener ranking de los productos más vendidos, recaudación y ganancias
async function obtenerProductosMasVendidos(req, res) {
  try {
    const detalles = await DetalleVenta.findAll();

    const mapaProductos = {};

    for (const d of detalles) {
      // Clave foránea según el DER: id_producto
      const idProd = d.id_producto || d.idProductos || d.idProducto;
      if (!idProd) continue;

      const cantidad = Number(d.Cantidad || d.cantidad || 0);
      
      // Columna exacta según DER: Precio_unitario o Subtotal
      const subtotalLinea = Number(d.Subtotal || d.subtotal || 0);
      let precioUnit = Number(d.Precio_unitario || d.precio_unitario || d.Precio_Unitario || 0);

      if (!mapaProductos[idProd]) {
        mapaProductos[idProd] = {
          idProductos: idProd,
          cantidadVendida: 0,
          totalRecaudado: 0,
        };
      }

      mapaProductos[idProd].cantidadVendida += cantidad;

      // Si viene Subtotal en el detalle, sumamos directamente
      if (subtotalLinea > 0) {
        mapaProductos[idProd].totalRecaudado += subtotalLinea;
      } else if (precioUnit > 0) {
        mapaProductos[idProd].totalRecaudado += cantidad * precioUnit;
      }
    }

    const ranking = [];
    for (const idProd of Object.keys(mapaProductos)) {
      const prodBD = await Producto.findByPk(idProd);
      if (prodBD) {
        const costoUnitario = Number(prodBD.Precio_costo || 0);
        const precioVentaCatalogo = Number(prodBD.Precio_Venta || 0);
        const cantidadVendida = mapaProductos[idProd].cantidadVendida;
        
        let totalRecaudado = mapaProductos[idProd].totalRecaudado;

        // Fallback: Si en los detalles el precio quedó en 0, usamos el Precio_Venta del catálogo
        if (totalRecaudado === 0 && precioVentaCatalogo > 0) {
          totalRecaudado = cantidadVendida * precioVentaCatalogo;
        }

        const costoTotal = costoUnitario * cantidadVendida;
        const gananciaTotal = totalRecaudado - costoTotal;

        ranking.push({
          idProductos: idProd,
          nombre: prodBD.Nombre,
          categoria: prodBD.Categoria || 'General',
          stockActual: prodBD.Stock,
          precioCosto: costoUnitario,
          precioVenta: precioVentaCatalogo,
          cantidadVendida,
          totalRecaudado,
          gananciaTotal,
        });
      }
    }

    // Ordenar de mayor a menor cantidad vendida
    ranking.sort((a, b) => b.cantidadVendida - a.cantidadVendida);

    res.status(200).json(ranking.slice(0, 10));

  } catch (error) {
    console.error("Error al generar reporte de productos más vendidos:", error);
    res.status(500).json({ error: "No se pudo generar el reporte" });
  }
}
// ==========================================
// Resumen del día para el panel en tiempo real (solo Admin)
// GET /api/ventas/resumen-hoy
// ==========================================
async function resumenHoy(req, res) {
  try {
    const inicio = inicioDeHoyAR();
    const ventas = await Venta.findAll({
      where: { Fecha_Hora: { [Op.gte]: inicio } },
      order: [['Fecha_Hora', 'DESC']],
    });

    const ids = ventas.map((v) => v.id_Venta);
    const detalles = ids.length ? await DetalleVenta.findAll({ where: { id_venta: ids } }) : [];
    const idsProductos = [...new Set(detalles.map((d) => d.id_producto))];
    const productos = idsProductos.length ? await Producto.findAll({ where: { idProductos: idsProductos } }) : [];
    const costo = new Map(productos.map((p) => [p.idProductos, Number(p.Precio_costo || 0)]));
    const nombre = new Map(productos.map((p) => [p.idProductos, p.Nombre]));

    const idsTurnos = [...new Set(ventas.map((v) => v.id_turno))];
    const turnos = idsTurnos.length ? await TurnoCaja.findAll({ where: { idturnos_caja: idsTurnos } }) : [];
    const idsUsuarios = [...new Set(turnos.map((t) => t.id_Usuario))];
    const usuarios = idsUsuarios.length ? await Usuario.findAll({ where: { id_Usuario: idsUsuarios } }) : [];
    const usuarioPorId = new Map(usuarios.map((u) => [u.id_Usuario, `${u.Nombre} ${u.Apellido}`.trim()]));
    const cajeroPorTurno = new Map(turnos.map((t) => [t.idturnos_caja, usuarioPorId.get(t.id_Usuario) || 'Cajero']));

    const gananciaPorVenta = new Map();
    const itemsPorVenta = new Map();
    for (const d of detalles) {
      const g = (Number(d.Precio_unitario) - (costo.get(d.id_producto) || 0)) * Number(d.Cantidad);
      gananciaPorVenta.set(d.id_venta, (gananciaPorVenta.get(d.id_venta) || 0) + g);
      if (!itemsPorVenta.has(d.id_venta)) itemsPorVenta.set(d.id_venta, []);
      itemsPorVenta.get(d.id_venta).push({ nombre: nombre.get(d.id_producto) || 'Producto', cantidad: Number(d.Cantidad) });
    }

    const porHora = Array.from({ length: 24 }, (_, hora) => ({ hora, recaudado: 0, ganancia: 0, ventas: 0 }));
    const porMetodo = {};
    let recaudado = 0;
    let ganancia = 0;
    for (const v of ventas) {
      const total = Number(v.Total_Venta || 0);
      const g = gananciaPorVenta.get(v.id_Venta) || 0;
      const h = porHora[horaAR(v.Fecha_Hora)];
      h.recaudado += total; h.ganancia += g; h.ventas += 1;
      porMetodo[v.Metodo_Pago] = (porMetodo[v.Metodo_Pago] || 0) + total;
      recaudado += total;
      ganancia += g;
    }

    const redondear = (n) => Number(n.toFixed(2));
    res.json({
      desde: inicio,
      cantidadVentas: ventas.length,
      recaudado: redondear(recaudado),
      ganancia: redondear(ganancia),
      ticketPromedio: ventas.length ? redondear(recaudado / ventas.length) : 0,
      porHora: porHora.map((h) => ({ ...h, recaudado: redondear(h.recaudado), ganancia: redondear(h.ganancia) })),
      porMetodo,
      ultimas: ventas.slice(0, 8).map((v) => ({
        idVenta: v.id_Venta,
        fecha: v.Fecha_Hora,
        hora: horaAR(v.Fecha_Hora),
        total: Number(v.Total_Venta || 0),
        ganancia: redondear(gananciaPorVenta.get(v.id_Venta) || 0),
        metodoPago: v.Metodo_Pago,
        cajero: cajeroPorTurno.get(v.id_turno) || 'Cajero',
        items: itemsPorVenta.get(v.id_Venta) || [],
      })),
    });
  } catch (error) {
    console.error('Error al calcular el resumen del día:', error);
    res.status(500).json({ error: 'No se pudo calcular el resumen del día' });
  }
}

module.exports = {
  resumenHoy,
  registrarVenta,
  obtenerVentas,
  obtenerProductosMasVendidos // <-- Exportamos la nueva función
};