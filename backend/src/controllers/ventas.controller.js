const { Producto, sequelize } = require('../models');

async function registrarVenta(req, res) {
  // Obtenemos los datos que nos mandó el frontend al hacer clic en "COBRAR"
  const { total, metodo_pago, comprobante, detalle } = req.body;

  if (!detalle || detalle.length === 0) {
    return res.status(400).json({ error: "El detalle de la venta está vacío" });
  }

  // Iniciamos una Transacción por seguridad. 
  // Si algo falla a la mitad, no se descuenta nada.
  const t = await sequelize.transaction();

  try {
    // Recorremos cada producto del carrito para descontar su stock
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

      // Guardamos el nuevo stock en la base de datos
      await producto.save({ transaction: t });
    }

    // Nota para el Sprint 4: Acá agregaremos la lógica para guardar el historial de la Venta 
    // en una tabla nueva llamada 'Ventas' para los reportes. Por ahora, descontamos el stock.

    // 2. Si todo salió bien y no hubo errores, confirmamos (commit) los cambios en la base de datos
    await t.commit();
    res.status(200).json({ mensaje: "Venta registrada correctamente y stock descontado" });

  } catch (error) {
    // 3. Si hubo algún error (ej. no alcanzó el stock), cancelamos TODO (rollback)
    await t.rollback();
    console.error("Error al registrar la venta:", error);
    res.status(400).json({ error: error.message });
  }
}

module.exports = {
  registrarVenta
};