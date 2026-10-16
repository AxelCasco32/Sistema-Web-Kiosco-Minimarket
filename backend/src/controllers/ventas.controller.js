const { Producto, Venta, DetalleVenta, TurnoCaja, Usuario, sequelize } = require('../models');
async function registrarVenta(req, res) {
  // Recibimos los datos del frontend (desde Pos.jsx)
  const { total, metodo_pago, id_cliente, id_turno, detalle } = req.body;

  if (!detalle || detalle.length === 0) {
    return res.status(400).json({ error: "El detalle de la venta está vacío" });
  }

  // Iniciamos la Transacción por seguridad (si algo falla, no se descuenta nada)
  const t = await sequelize.transaction();

  try {
    // 1. Creamos el registro general de la Venta (El Ticket)
    const nuevaVenta = await Venta.create({
      Total_Venta: total,
      Metodo_Pago: metodo_pago,
      id_cliente: id_cliente || null, // null si es consumidor final
      Fecha_Hora: new Date(),
      Monto: total, 
      Vuelto: 0,     
      id_turno: id_turno || 1 // <-- FORZAMOS EL TURNO 1 (Luego lo haremos dinámico con la Apertura de Caja)
    }, { transaction: t });

    // 2. Recorremos cada producto del carrito para descontar stock y armar el detalle
    for (const item of detalle) {
      const producto = await Producto.findByPk(item.idProductos, { transaction: t });

      if (!producto) {
        throw new Error(`Producto no encontrado (ID: ${item.idProductos})`);
      }

      if (producto.Stock < item.cantidad) {
        throw new Error(`Stock insuficiente para "${producto.Nombre}". Quedan solo ${producto.Stock} unidades.`);
      }

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
module.exports = {
  registrarVenta,
  obtenerVentas // <-- Exportamos la nueva función
};