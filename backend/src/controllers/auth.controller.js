const crypto = require('crypto');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const { Op } = require('sequelize');
const { Usuario, Rol } = require('../models');
const { enviarEmail, emailCodigoRecuperacion } = require('../utils/enviarEmail');

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
// RECUPERACIÓN DE CONTRASEÑA POR CORREO
// ---------------------------------------------------------------------
// 1) POST /api/auth/recuperar/solicitar   { identificador }  (usuario o email)
//    Si el usuario existe, está activo y tiene email, se le envía un código
//    de 6 dígitos que vence en 15 minutos. La respuesta es siempre la misma
//    para no revelar qué usuarios o correos existen.
// 2) POST /api/auth/recuperar/restablecer { identificador, codigo, nuevaPassword }
//    Valida el código (máx. 5 intentos) y cambia la contraseña.
// En la base solo se guarda el hash del código, igual que las contraseñas.
// =====================================================================

const MINUTOS_VALIDEZ = 15;
const MAX_INTENTOS_CODIGO = 5;      // intentos por código antes de anularlo
const ESPERA_REENVIO_MS = 60 * 1000; // no reenviar más de un correo por minuto

// Límite por IP (en memoria) para frenar abusos: 10 pedidos cada 15 minutos
const MAX_PEDIDOS_IP = 10;
const VENTANA_MS = 15 * 60 * 1000;
const pedidosPorIp = new Map();

function superaLimiteIp(req, tipo) {
  const clave = `${tipo}|${req.ip}`;
  const ahora = Date.now();
  const registro = pedidosPorIp.get(clave);
  if (!registro || ahora - registro.desde > VENTANA_MS) {
    pedidosPorIp.set(clave, { cantidad: 1, desde: ahora });
    return false;
  }
  registro.cantidad += 1;
  return registro.cantidad > MAX_PEDIDOS_IP;
}

function generarCodigo() {
  return String(crypto.randomInt(0, 1000000)).padStart(6, '0');
}

async function buscarPorIdentificador(identificador) {
  const valor = String(identificador || '').trim();
  if (!valor) return null;
  return Usuario.findOne({
    where: {
      Activo: true,
      [Op.or]: [{ Usuario: valor }, { Email: valor.toLowerCase() }],
    },
  });
}

const MENSAJE_SOLICITUD =
  'Si el usuario existe y tiene un email cargado, te enviamos un código. Revisá tu correo (y la carpeta de spam).';

async function solicitarCodigo(req, res) {
  try {
    const { identificador } = req.body;
    if (!identificador || !String(identificador).trim()) {
      return res.status(400).json({ mensaje: 'Ingresá tu usuario o tu email' });
    }
    if (superaLimiteIp(req, 'solicitar')) {
      return res.status(429).json({ mensaje: 'Demasiados pedidos. Esperá unos minutos y volvé a intentar.' });
    }

    const usuario = await buscarPorIdentificador(identificador);

    if (usuario && usuario.Email) {
      // Si ya se mandó un código hace menos de un minuto, no se reenvía
      const enviadoHace =
        usuario.codigo_recuperacion_expira &&
        Date.now() - (new Date(usuario.codigo_recuperacion_expira).getTime() - MINUTOS_VALIDEZ * 60 * 1000);
      const puedeEnviar = !enviadoHace || enviadoHace > ESPERA_REENVIO_MS;

      if (puedeEnviar) {
        const codigo = generarCodigo();
        usuario.codigo_recuperacion_hash = await bcrypt.hash(codigo, 10);
        usuario.codigo_recuperacion_expira = new Date(Date.now() + MINUTOS_VALIDEZ * 60 * 1000);
        usuario.codigo_recuperacion_intentos = 0;
        await usuario.save();

        const correo = emailCodigoRecuperacion({
          nombre: usuario.Nombre,
          usuario: usuario.Usuario,
          codigo,
          minutos: MINUTOS_VALIDEZ,
        });
        try {
          await enviarEmail({ para: usuario.Email, ...correo });
        } catch (errorEnvio) {
          console.error('ERROR ENVIANDO EMAIL DE RECUPERACIÓN:', errorEnvio.message);
          return res.status(502).json({
            mensaje: 'No se pudo enviar el correo en este momento. Intentá más tarde o pedile ayuda al Administrador.',
          });
        }
      }
    }

    res.json({ mensaje: MENSAJE_SOLICITUD });
  } catch (error) {
    console.error('ERROR SOLICITAR CODIGO:', error);
    res.status(500).json({ mensaje: 'Error al procesar la solicitud' });
  }
}

const MENSAJE_CODIGO_INVALIDO = 'El código es incorrecto o venció. Pedí uno nuevo.';

async function restablecerContrasena(req, res) {
  try {
    const { identificador, codigo, nuevaPassword } = req.body;

    if (!identificador || !codigo || !nuevaPassword) {
      return res.status(400).json({ mensaje: 'Completá usuario o email, código y nueva contraseña' });
    }
    if (String(nuevaPassword).length < 6) {
      return res.status(400).json({ mensaje: 'La nueva contraseña debe tener al menos 6 caracteres' });
    }
    if (superaLimiteIp(req, 'restablecer')) {
      return res.status(429).json({ mensaje: 'Demasiados intentos. Esperá unos minutos y volvé a intentar.' });
    }

    const usuario = await buscarPorIdentificador(identificador);
    const vigente =
      usuario &&
      usuario.codigo_recuperacion_hash &&
      usuario.codigo_recuperacion_expira &&
      new Date(usuario.codigo_recuperacion_expira).getTime() > Date.now() &&
      usuario.codigo_recuperacion_intentos < MAX_INTENTOS_CODIGO;

    if (!vigente) {
      return res.status(400).json({ mensaje: MENSAJE_CODIGO_INVALIDO });
    }

    const codigoLimpio = String(codigo).replace(/\D/g, '');
    const correcto = await bcrypt.compare(codigoLimpio, usuario.codigo_recuperacion_hash);

    if (!correcto) {
      usuario.codigo_recuperacion_intentos += 1;
      const restantes = MAX_INTENTOS_CODIGO - usuario.codigo_recuperacion_intentos;
      if (restantes <= 0) {
        usuario.codigo_recuperacion_hash = null; // demasiados intentos: se anula
        usuario.codigo_recuperacion_expira = null;
      }
      await usuario.save();
      return res.status(400).json({
        mensaje: restantes > 0
          ? `Código incorrecto. Te quedan ${restantes} intento${restantes === 1 ? '' : 's'}.`
          : 'Código incorrecto. Se agotaron los intentos: pedí un código nuevo.',
      });
    }

    usuario.password_hash = await bcrypt.hash(String(nuevaPassword), 10);
    usuario.codigo_recuperacion_hash = null; // el código sirve una sola vez
    usuario.codigo_recuperacion_expira = null;
    usuario.codigo_recuperacion_intentos = 0;
    await usuario.save();

    res.json({ mensaje: 'Contraseña restablecida. Ya podés iniciar sesión con tu nueva contraseña.' });
  } catch (error) {
    console.error('ERROR RESTABLECER CONTRASEÑA:', error);
    res.status(500).json({ mensaje: 'Error al restablecer la contraseña' });
  }
}

module.exports = { login, solicitarCodigo, restablecerContrasena };
