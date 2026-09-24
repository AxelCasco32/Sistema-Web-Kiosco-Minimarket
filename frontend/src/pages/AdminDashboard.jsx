// pages/AdminDashboard.jsx
import { useEffect, useState } from "react";
import { useAuth } from "../context/AuthContext";
import api from "../services/api";

export default function AdminDashboard() {
  const { usuario, logout } = useAuth();
  const [usuarios, setUsuarios] = useState([]);
  const [roles, setRoles] = useState([]);
  const [form, setForm] = useState({ nombre: "", apellido: "", usuario: "", password: "", id_Rol: "" });
  const [mensaje, setMensaje] = useState("");

  async function cargarDatos() {
    try {
      const [resUsuarios, resRoles] = await Promise.all([
        api.get("/usuarios"),
        api.get("/usuarios/roles"), // ✅ Cambiado de "/roles" a "/usuarios/roles"
      ]);
      setUsuarios(resUsuarios.data);
      setRoles(resRoles.data);
    } catch (err) {
      setMensaje("Error al cargar datos");
    }
  }

  useEffect(() => {
    cargarDatos();
  }, []);

  function handleChange(event) {
    setForm({ ...form, [event.target.name]: event.target.value });
  }

  async function handleCrearUsuario(event) {
    event.preventDefault();
    setMensaje("");
    try {
      // Ojo: En tu backend req.body espera "Nombre" y "Apellido" en mayúscula, 
      // pero en tu estado local están en minúscula ("nombre", "apellido").
      // Enviamos el objeto mapeado correctamente según lo que espera el controlador:
      await api.post("/usuarios", {
        Nombre: form.nombre,
        Apellido: form.apellido,
        Usuario: form.usuario,
        password: form.password,
        id_Rol: form.id_Rol,
      });

      setMensaje("Usuario creado correctamente");
      setForm({ nombre: "", apellido: "", usuario: "", password: "", id_Rol: "" });
      cargarDatos();
    } catch (err) {
      setMensaje(err.response?.data?.mensaje || "Error al crear usuario");
    }
  }

  return (
    <div style={{ padding: 24 }}>
      <div style={{ display: "flex", justifyContent: "space-between" }}>
        <h1>Panel de Administrador</h1>
        <button onClick={logout}>Cerrar sesión</button>
      </div>
      <p>Bienvenido, {usuario?.nombre} ({usuario?.rol})</p>

      <h2>Crear usuario</h2>
      <form onSubmit={handleCrearUsuario} style={{ display: "flex", flexDirection: "column", gap: 8, maxWidth: 320 }}>
        <input name="nombre" placeholder="Nombre" value={form.nombre} onChange={handleChange} required />
        <input name="apellido" placeholder="Apellido" value={form.apellido} onChange={handleChange} required />
        <input name="usuario" placeholder="Usuario" value={form.usuario} onChange={handleChange} required />
        <input name="password" type="password" placeholder="Contraseña" value={form.password} onChange={handleChange} required />
        <select name="id_Rol" value={form.id_Rol} onChange={handleChange} required>
          <option value="">Seleccionar rol</option>
          {roles.map((rol) => (
            <option key={rol.id_Rol} value={rol.id_Rol}>{rol.Nombre}</option>
          ))}
        </select>
        <button type="submit">Crear usuario</button>
      </form>

      {mensaje && <p>{mensaje}</p>}

      <h2>Usuarios existentes</h2>
      <ul>
        {usuarios.map((u) => (
          <li key={u.id_Usuario}>{u.Nombre} {u.Apellido} — {u.Usuario} ({u.Rol?.Nombre})</li>
        ))}
      </ul>
    </div>
  );
}