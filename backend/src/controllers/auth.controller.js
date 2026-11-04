const crypto = require('crypto');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const { Usuario, Rol } = require('../models');

async function login(req, res) {
  try {
    const { usuario, password } = req.body;

    if (!usuario || !password) {
      return res.status(400).json({ mensaje: 'Usuario y contraseña son obligatorios' });
    }

    const usuarioEncontrado = await Usuario.findOne({
      where: { Usuario: usuario, Activo: true },
      include: { model: Rol },
    });

    if (!usuarioEncontrado) {
      return res.status(401).json({ mensaje: 'Usuario o contraseña incorrectos' });
    }

    const passwordValida = await bcrypt.compare(password, usuarioEncontrado.password_hash);
    if (!passwordValida) {
      return res.status(401).json({ mensaje: 'Usuario o contraseña incorrectos' });
    }

    const token = jwt.sign(
      {
        id_Usuario: usuarioEncontrado.id_Usuario,
        id_Rol: usuarioEncontrado.id_Rol,
        rol_nombre: usuarioEncontrado.Rol.Nombre,
      },
      process.env.JWT_SECRET,
      { expiresIn: (process.env.JWT_EXPIRES_IN || '').trim() || '8h' }
    );

    res.json({
      token,
      usuario: {
        id_Usuario: usuarioEncontrado.id_Usuario,
        nombre: usuarioEncontrado.Nombre,
        apellido: usuarioEncontrado.Apellido,
        rol: usuarioEncontrado.Rol.Nombre,
      },
    });
  } catch (error) {
    console.error('ERROR LOGIN:', error); // <-- agregar esta línea
    res.status(500).json({ mensaje: 'Error al iniciar sesión', error: error.message });
  } 
}

// =====================================================================
// RECUPERACIÓN DE CONTRASEÑA DEL ADMIN (código de recuperación)
// ---------------------------------------------------------------------
// El Admin genera desde su panel un código de un solo uso y lo guarda en un
// lugar seguro (papel, celular). Si pierde la contraseña, la restablece desde
// "¿Olvidaste tu contraseña?" con su usuario + ese código. En la base solo se
// guarda el hash del código, igual que con las contraseñas.
// Los cajeros no usan este flujo: el Admin les resetea la clave desde el panel.
// =====================================================================

// Sin 0/O, 1/I/L para que no se confundan al copiarlo a mano
const ALFABETO_CODIGO = 'ABCDEFGHJKMNPQRSTUVWXYZ23456789';

function generarCodigoPlano() {
  let codigo = '';
  for (let i = 0; i < 16; i++) {
    codigo += ALFABETO_CODIGO[crypto.randomInt(ALFABETO_CODIGO.length)];
  }
  return codigo.match(/.{4}/g).join('-'); // XXXX-XXXX-XXXX-XXXX
}

function normalizarCodigo(codigo) {
  return String(codigo || '').toUpperCase().replace(/[^A-Z0-9]/g, '');
}

// Límite simple de intentos en memoria: 5 intentos fallidos cada 15 minutos
// por usuario + IP, para que no se pueda adivinar el código por fuerza bruta.
const MAX_INTENTOS = 5;
const VENTANA_MS = 15 * 60 * 1000;
const intentosFallidos = new Map();

function claveIntentos(req, usuario) {
  return `${String(usuario || '').toLowerCase()}|${req.ip}`;
}

function estaBloqueado(clave) {
  const registro = intentosFallidos.get(clave);
  if (!registro) return false;
  if (Date.now() - registro.desde > VENTANA_MS) {
    intentosFallidos.delete(clave);
    return false;
  }
  return registro.cantidad >= MAX_INTENTOS;
}

function registrarFallo(clave) {
  const registro = intentosFallidos.get(clave);
  if (!registro || Date.now() - registro.desde > VENTANA_MS) {
    intentosFallidos.set(clave, { cantidad: 1, desde: Date.now() });
  } else {
    registro.cantidad += 1;
  }
}

const MENSAJE_RECUPERACION_INVALIDA =
  'Usuario o código de recuperación incorrectos. Si sos cajero, pedile al Administrador que te restablezca la contraseña.';

// POST /api/auth/recuperar  { usuario, codigo, nuevaPassword }
async function recuperarContrasena(req, res) {
  try {
    const { usuario, codigo, nuevaPassword } = req.body;

    if (!usuario || !codigo || !nuevaPassword) {
      return res.status(400).json({ mensaje: 'Usuario, código y nueva contraseña son obligatorios' });
    }
    if (String(nuevaPassword).length < 6) {
      return res.status(400).json({ mensaje: 'La nueva contraseña debe tener al menos 6 caracteres' });
    }

    const clave = claveIntentos(req, usuario);
    if (estaBloqueado(clave)) {
      return res.status(429).json({
        mensaje: 'Demasiados intentos fallidos. Esperá 15 minutos y volvé a intentar.',
      });
    }

    const usuarioEncontrado = await Usuario.findOne({
      where: { Usuario: String(usuario).trim(), Activo: true },
      include: { model: Rol },
    });

    const esAdminConCodigo =
      usuarioEncontrado &&
      usuarioEncontrado.Rol?.Nombre === 'Admin' &&
      usuarioEncontrado.codigo_recuperacion_hash;

    const codigoValido =
      esAdminConCodigo &&
      (await bcrypt.compare(normalizarCodigo(codigo), usuarioEncontrado.codigo_recuperacion_hash));

    // Mismo mensaje en todos los casos: no revelamos si el usuario existe
    if (!codigoValido) {
      registrarFallo(clave);
      return res.status(401).json({ mensaje: MENSAJE_RECUPERACION_INVALIDA });
    }

    usuarioEncontrado.password_hash = await bcrypt.hash(String(nuevaPassword), 10);
    usuarioEncontrado.codigo_recuperacion_hash = null; // el código es de un solo uso
    await usuarioEncontrado.save();
    intentosFallidos.delete(clave);

    res.json({
      mensaje:
        'Contraseña restablecida. Iniciá sesión y generá un nuevo código de recuperación desde tu panel: el anterior ya no sirve.',
    });
  } catch (error) {
    console.error('ERROR RECUPERAR CONTRASEÑA:', error);
    res.status(500).json({ mensaje: 'Error al restablecer la contraseña' });
  }
}

// GET /api/auth/codigo-recuperacion -> { tieneCodigo }
async function estadoCodigoRecuperacion(req, res) {
  try {
    const admin = await Usuario.findByPk(req.usuario.id_Usuario);
    if (!admin) return res.status(404).json({ mensaje: 'Usuario no encontrado' });
    res.json({ tieneCodigo: Boolean(admin.codigo_recuperacion_hash) });
  } catch (error) {
    console.error('ERROR ESTADO CODIGO RECUPERACION:', error);
    res.status(500).json({ mensaje: 'Error al consultar el código de recuperación' });
  }
}

// POST /api/auth/codigo-recuperacion  { password } -> { codigo }
// Pide la contraseña actual para que nadie que encuentre la sesión abierta
// pueda generarse un código a escondidas. El código se muestra UNA sola vez.
async function generarCodigoRecuperacion(req, res) {
  try {
    const { password } = req.body;
    if (!password) {
      return res.status(400).json({ mensaje: 'Ingresá tu contraseña actual' });
    }

    const admin = await Usuario.findByPk(req.usuario.id_Usuario);
    if (!admin) return res.status(404).json({ mensaje: 'Usuario no encontrado' });

    const passwordValida = await bcrypt.compare(password, admin.password_hash);
    if (!passwordValida) {
      return res.status(401).json({ mensaje: 'La contraseña actual es incorrecta' });
    }

    const codigo = generarCodigoPlano();
    admin.codigo_recuperacion_hash = await bcrypt.hash(normalizarCodigo(codigo), 10);
    await admin.save();

    res.status(201).json({ codigo });
  } catch (error) {
    console.error('ERROR GENERAR CODIGO RECUPERACION:', error);
    res.status(500).json({ mensaje: 'Error al generar el código de recuperación' });
  }
}

module.exports = { login, recuperarContrasena, estadoCodigoRecuperacion, generarCodigoRecuperacion };