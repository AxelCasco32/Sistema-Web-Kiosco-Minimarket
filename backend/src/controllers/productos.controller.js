const { Producto } = require('../models');

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
    const { Cod_barra, Nombre, Precio_costo, Precio_Venta, Stock } = req.body;

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

    await producto.update(req.body);
    res.json(producto);
  } catch (error) {
    res.status(500).json({ mensaje: 'Error al editar producto', error: error.message });
  }
}

module.exports = { listarProductos, buscarPorCodigoBarra, crearProducto, editarProducto };