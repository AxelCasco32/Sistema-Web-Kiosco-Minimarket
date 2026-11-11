const { Op } = require('sequelize');
const { Producto, Auditoria, Usuario } = require('../models');
const { armarCsv } = require('../utils/csv');
const { enviarEmail, smtpConfigurado, escaparHtml } = require('../utils/enviarEmail');

const STOCK_MINIMO = 5; // umbral de "poco stock" (stock crítico) — ajustable
// Cantidad a la que se sugiere reponer cada producto crítico
const STOCK_OBJETIVO = Number(process.env.STOCK_OBJETIVO) || 20;

// El precio de costo es información sensible: solo el Admin puede verlo.
function esAdmin(req) {
  return req.usuario?.rol_nombre === 'Admin';
}

function atributosVisibles(req) {
  return esAdmin(req) ? undefined : { exclude: ['Precio_costo'] };
}

async function listarProductos(req, res) {
  try {
    const productos = await Producto.findAll({ attributes: atributosVisibles(req) });
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
      attributes: atributosVisibles(req),
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

// =====================================================================
// STOCK CRÍTICO: exportar y enviar al proveedor
// =====================================================================

async function obtenerCriticos() {
  const productos = await Producto.findAll({
    where: { Stock: { [Op.lte]: STOCK_MINIMO }, Activo: true },
    order: [['Stock', 'ASC'], ['Nombre', 'ASC']],
  });
  return productos.map((p) => ({
    idProductos: p.idProductos,
    Cod_barra: p.Cod_barra,
    Nombre: p.Nombre,
    Categoria: p.Categoria,
    Stock: p.Stock,
    cantidadSugerida: Math.max(STOCK_OBJETIVO - p.Stock, 0),
  }));
}

function csvCriticos(criticos) {
  return armarCsv(
    ['Código de barras', 'Producto', 'Categoría', 'Stock actual', `Cantidad sugerida (hasta ${STOCK_OBJETIVO} u.)`],
    criticos.map((p) => [p.Cod_barra, p.Nombre, p.Categoria, p.Stock, p.cantidadSugerida])
  );
}

// GET /api/productos/criticos  (solo Admin)
async function listarCriticos(req, res) {
  try {
    const productos = await obtenerCriticos();
    res.json({ stockMinimo: STOCK_MINIMO, stockObjetivo: STOCK_OBJETIVO, productos });
  } catch (error) {
    console.error('Error al listar productos críticos:', error);
    res.status(500).json({ mensaje: 'Error al obtener los productos en stock crítico' });
  }
}

// GET /api/productos/criticos/csv  (solo Admin) -> archivo para Excel
async function descargarCriticosCsv(req, res) {
  try {
    const criticos = await obtenerCriticos();
    const fecha = new Date().toISOString().slice(0, 10);
    res.setHeader('Content-Type', 'text/csv; charset=utf-8');
    res.setHeader('Content-Disposition', `attachment; filename="stock_critico_${fecha}.csv"`);
    res.send(csvCriticos(criticos));
  } catch (error) {
    console.error('Error al exportar productos críticos:', error);
    res.status(500).json({ mensaje: 'Error al exportar los productos en stock crítico' });
  }
}

const REGEX_EMAIL = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

// POST /api/productos/criticos/enviar  { email, mensaje }  (solo Admin)
async function enviarCriticosProveedor(req, res) {
  try {
    const email = String(req.body.email || '').trim().toLowerCase();
    const mensaje = String(req.body.mensaje || '').trim().slice(0, 1000);

    if (!REGEX_EMAIL.test(email) || email.length > 150) {
      return res.status(400).json({ mensaje: 'Ingresá un email válido para el proveedor' });
    }

    const criticos = await obtenerCriticos();
    if (criticos.length === 0) {
      return res.status(400).json({ mensaje: 'No hay productos en stock crítico para enviar' });
    }

    if (!smtpConfigurado()) {
      return res.status(503).json({
        codigo: 'SIN_SMTP',
        mensaje: 'El servidor no tiene configurado el envío de correos.',
      });
    }

    const admin = await Usuario.findByPk(req.usuario.id_Usuario);
    const firma = admin ? `${admin.Nombre} ${admin.Apellido}`.trim() : 'KiosquitoYa';
    const fecha = new Date().toLocaleDateString('es-AR');

    const texto =
      (mensaje ? `${mensaje}\n\n` : '') +
      `Productos en stock crítico (${fecha}):\n\n` +
      criticos.map((p) => `- ${p.Nombre} (cód. ${p.Cod_barra}): stock ${p.Stock}, pedir ${p.cantidadSugerida}`).join('\n') +
      `\n\nSe adjunta la planilla.\n\n${firma}\nKiosquitoYa`;

    const filas = criticos.map((p) =>
      `<tr><td style="padding:6px 10px;border:1px solid #ddd">${escaparHtml(p.Cod_barra)}</td>` +
      `<td style="padding:6px 10px;border:1px solid #ddd">${escaparHtml(p.Nombre)}</td>` +
      `<td style="padding:6px 10px;border:1px solid #ddd">${escaparHtml(p.Categoria)}</td>` +
      `<td style="padding:6px 10px;border:1px solid #ddd;text-align:center">${p.Stock}</td>` +
      `<td style="padding:6px 10px;border:1px solid #ddd;text-align:center"><strong>${p.cantidadSugerida}</strong></td></tr>`
    ).join('');
    const html = `
      <div style="font-family:Arial,Helvetica,sans-serif;color:#1e293b;max-width:680px">
        ${mensaje ? `<p>${escaparHtml(mensaje).replace(/\n/g, '<br>')}</p>` : ''}
        <h3 style="color:#261d60">Productos en stock crítico (${fecha})</h3>
        <table style="border-collapse:collapse;font-size:14px">
          <tr style="background:#261d60;color:#fff">
            <th style="padding:6px 10px">Código</th><th style="padding:6px 10px">Producto</th>
            <th style="padding:6px 10px">Categoría</th><th style="padding:6px 10px">Stock</th>
            <th style="padding:6px 10px">Pedir</th>
          </tr>${filas}
        </table>
        <p style="color:#64748b;font-size:13px">Se adjunta la planilla en formato CSV (se abre con Excel).</p>
        <p>${escaparHtml(firma)}<br>KiosquitoYa</p>
      </div>`;

    try {
      await enviarEmail({
        para: email,
        asunto: `Pedido de reposición – ${criticos.length} producto${criticos.length === 1 ? '' : 's'} en stock crítico`,
        texto,
        html,
        responderA: admin?.Email || undefined,
        adjuntos: [{
          filename: `stock_critico_${new Date().toISOString().slice(0, 10)}.csv`,
          content: csvCriticos(criticos),
          contentType: 'text/csv; charset=utf-8',
        }],
      });
    } catch (errorEnvio) {
      console.error('ERROR ENVIANDO EMAIL AL PROVEEDOR:', errorEnvio.message);
      return res.status(502).json({
        codigo: 'ERROR_SMTP',
        mensaje: 'No se pudo enviar el correo desde el servidor.',
      });
    }

    res.json({ mensaje: `Se envió el pedido a ${email} con ${criticos.length} producto(s).`, cantidad: criticos.length });
  } catch (error) {
    console.error('Error al enviar productos críticos:', error);
    res.status(500).json({ mensaje: 'Error al enviar el pedido al proveedor' });
  }
}

module.exports = {
  listarCriticos,
  descargarCriticosCsv,
  enviarCriticosProveedor,
  listarProductos,
  buscarPorCodigoBarra,
  crearProducto,
  editarProducto,
  listarAuditorias,
};