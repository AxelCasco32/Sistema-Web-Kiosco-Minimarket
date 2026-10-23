const { Producto, Auditoria, Usuario } = require('../models');

const STOCK_MINIMO = 5; // umbral de "poco stock" — ajustable

async function listarProductos(req, res) {
  try {
    const productos = await Producto.findAll();
    const conAlerta = productos.map((p) => ({
      ...p.toJSON(),
      stockBajo: p.Stock <= STOCK_MINIMO,
    }));
    res.json(conAlerta);
  } catch (error) {
    res.status(500).json({ mensaje: 'Error al listar productos', error: error.message });
  }
}

async function buscarPorCodigoBarra(req, res) {
  try {
    const producto = await Producto.findOne({
      where: { Cod_barra: req.params.cod_barra },
    });

    if (!producto) {
      return res.status(404).json({ mensaje: 'Producto no encontrado' });
    }

    res.json(producto);
  } catch (error) {
    res.status(500).json({ mensaje: 'Error al buscar producto', error: error.message });
  }
}

async function crearProducto(req, res) {
  try {
    const { Cod_barra, Nombre, Precio_costo, Precio_Venta, Stock, Categoria } = req.body;

    if (!Cod_barra || !Nombre) {
      return res.status(400).json({ mensaje: 'Código de barras y nombre son obligatorios' });
    }

    const existente = await Producto.findOne({ where: { Cod_barra } });
    if (existente) {
      return res.status(409).json({ mensaje: 'Ya existe un producto con ese código de barras' });
    }

    const nuevoProducto = await Producto.create({
      Cod_barra,
      Nombre,
      Precio_costo: Precio_costo || 0,
      Precio_Venta: Precio_Venta || 0,
      Stock: Stock || 0,
      Categoria: Categoria || 'General',
    });

    res.status(201).json(nuevoProducto);
  } catch (error) {
    res.status(500).json({ mensaje: 'Error al crear producto', error: error.message });
  }
}

async function editarProducto(req, res) {
  try {
    const { id } = req.params;
    const producto = await Producto.findByPk(id);

    if (!producto) {
      return res.status(404).json({ mensaje: 'Producto no encontrado' });
    }

    // 1. Obtenemos el ID del admin desde el token
    const idAdmin = req.usuario?.id_Usuario || req.usuario?.id || 1;

    // 2. Buscamos el usuario real en la base de datos para obtener su nombre completo
    let nombreAdmin = 'Admin';
    if (idAdmin) {
      const adminBD = await Usuario.findByPk(idAdmin);
      if (adminBD) {
        // Usa "Nombre Apellido", o en su defecto el campo "Usuario"
        const nombreCompleto = `${adminBD.Nombre || ''} ${adminBD.Apellido || ''}`.trim();
        nombreAdmin = nombreCompleto || adminBD.Usuario || 'Admin';
      }
    }

    // 3. Campos auditables
    const camposAuditables = ['Precio_costo', 'Precio_Venta', 'Stock'];

    for (const campo of camposAuditables) {
      if (req.body[campo] !== undefined) {
        const valorViejo = Number(producto[campo]);
        const valorNuevo = Number(req.body[campo]);

        // Si cambió el valor numérico, guardamos el log con el nombre real
        if (valorViejo !== valorNuevo) {
          await Auditoria.create({
            id_usuario: idAdmin,
            nombre_usuario: nombreAdmin,
            id_producto: producto.idProductos || producto.id,
            nombre_producto: producto.Nombre,
            campo_modificado: campo,
            valor_anterior: String(valorViejo),
            valor_nuevo: String(valorNuevo),
            fecha_hora: new Date(),
          });
        }
      }
    }

    // 4. Actualizamos el producto en la BD
    await producto.update(req.body);
    res.json(producto);

  } catch (error) {
    console.error("Error al editar producto:", error);
    res.status(500).json({ mensaje: 'Error al editar producto', error: error.message });
  }
}

async function listarAuditorias(req, res) {
  try {
    const logs = await Auditoria.findAll({
      order: [['fecha_hora', 'DESC']],
      limit: 100,
    });
    res.json(logs);
  } catch (error) {
    console.error("Error al listar auditorías:", error);
    res.status(500).json({ mensaje: 'Error al obtener auditorías', error: error.message });
  }
}

module.exports = {
  listarProductos,
  buscarPorCodigoBarra,
  crearProducto,
  editarProducto,
  listarAuditorias,
};