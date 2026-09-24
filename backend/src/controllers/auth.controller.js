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
      { expiresIn: process.env.JWT_EXPIRES_IN }
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

module.exports = { login };