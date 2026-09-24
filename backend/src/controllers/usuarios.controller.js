const bcrypt = require('bcryptjs');
const { Usuario, Rol } = require('../models');

// GET /api/usuarios - listar todos los usuarios (sin exponer el hash)
async function listarUsuarios(req, res) {
  try {
    const usuarios = await Usuario.findAll({
      attributes: ['id_Usuario', 'id_Rol', 'Nombre', 'Apellido', 'Usuario', 'Activo', 'createdAt'],
      include: { model: Rol, attributes: ['Nombre'] },
      order: [['id_Usuario', 'ASC']],
    });
    res.json(usuarios);
  } catch (error) {
    console.error('ERROR LISTAR USUARIOS:', error);
    res.status(500).json({ mensaje: 'Error al listar usuarios', error: error.message });
  }
}

// GET /api/usuarios/roles - listar roles disponibles (para el select del form)
async function listarRoles(req, res) {
  try {
    const roles = await Rol.findAll({ attributes: ['id_Rol', 'Nombre'] });
    res.json(roles);
  } catch (error) {
    console.error('ERROR LISTAR ROLES:', error);
    res.status(500).json({ mensaje: 'Error al listar roles', error: error.message });
  }
}

// POST /api/usuarios - crear usuario (Admin o Cajero)
async function crearUsuario(req, res) {
  try {
    const { id_Rol, Nombre, Apellido, Usuario: nombreUsuario, password } = req.body;

    if (!id_Rol || !Nombre || !Apellido || !nombreUsuario || !password) {
      return res.status(400).json({ mensaje: 'Todos los campos son obligatorios' });
    }
    if (password.length < 6) {
      return res.status(400).json({ mensaje: 'La contraseña debe tener al menos 6 caracteres' });
    }

    const existe = await Usuario.findOne({ where: { Usuario: nombreUsuario } });
    if (existe) {
      return res.status(409).json({ mensaje: 'Ese nombre de usuario ya existe' });
    }

    const password_hash = await bcrypt.hash(password, 10);

    const nuevoUsuario = await Usuario.create({
      id_Rol,
      Nombre,
      Apellido,
      Usuario: nombreUsuario,
      password_hash,
      Activo: true,
    });

    res.status(201).json({
      id_Usuario: nuevoUsuario.id_Usuario,
      Nombre: nuevoUsuario.Nombre,
      Apellido: nuevoUsuario.Apellido,
      Usuario: nuevoUsuario.Usuario,
      id_Rol: nuevoUsuario.id_Rol,
    });
  } catch (error) {
    console.error('ERROR CREAR USUARIO:', error);
    res.status(500).json({ mensaje: 'Error al crear usuario', error: error.message });
  }
}

// PUT /api/usuarios/:id - editar nombre/apellido/rol (no toca la password)
async function actualizarUsuario(req, res) {
  try {
    const { id } = req.params;
    const { Nombre, Apellido, id_Rol } = req.body;

    const usuario = await Usuario.findByPk(id);
    if (!usuario) return res.status(404).json({ mensaje: 'Usuario no encontrado' });

    if (Nombre) usuario.Nombre = Nombre;
    if (Apellido) usuario.Apellido = Apellido;
    if (id_Rol) usuario.id_Rol = id_Rol;

    await usuario.save();
    res.json({ mensaje: 'Usuario actualizado correctamente' });
  } catch (error) {
    console.error('ERROR ACTUALIZAR USUARIO:', error);
    res.status(500).json({ mensaje: 'Error al actualizar usuario', error: error.message });
  }
}

// PATCH /api/usuarios/:id/estado - activar/desactivar (nunca hacer DELETE físico)
async function cambiarEstadoUsuario(req, res) {
  try {
    const { id } = req.params;

    if (Number(id) === req.usuario.id_Usuario) {
      return res.status(400).json({ mensaje: 'No podés desactivar tu propio usuario' });
    }

    const usuario = await Usuario.findByPk(id);
    if (!usuario) return res.status(404).json({ mensaje: 'Usuario no encontrado' });

    usuario.Activo = !usuario.Activo;
    await usuario.save();

    res.json({ mensaje: `Usuario ${usuario.Activo ? 'activado' : 'desactivado'}`, Activo: usuario.Activo });
  } catch (error) {
    console.error('ERROR CAMBIAR ESTADO:', error);
    res.status(500).json({ mensaje: 'Error al cambiar estado', error: error.message });
  }
}

module.exports = { listarUsuarios, listarRoles, crearUsuario, actualizarUsuario, cambiarEstadoUsuario };