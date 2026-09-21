// pages/Login.jsx
// Pantalla de inicio de sesión.
// Responsabilidad: formulario de usuario/contraseña, llamar al endpoint de
// login, guardar el token y el rol recibido, y redirigir según el rol
// (Cajero -> /pos, Admin -> /admin).
import "../styles.css";
import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";

export default function Login() {
  const [usuario, setUsuario] = useState("");
  const [contrasena, setContrasena] = useState("");
  const navigate = useNavigate();
  const { login } = useAuth();

  function handleSubmit(event) {
    event.preventDefault();
    if (!usuario.trim() || !contrasena) return;
    // Check temporal con el usuario => conectar al backend
    const rol = usuario.trim().toLowerCase() === "admin" ? "Admin" : "Cajero";
    login({ token: "sesion-local", usuario: { nombre: usuario.trim(), rol } });
    navigate(rol === "Admin" ? "/admin" : "/pos", { replace: true });
  }

  return (
    <div className="pagina">
      <form className="tarjeta" onSubmit={handleSubmit}>
        <h1>Iniciar sesión</h1>

        <input
          type="text"
          placeholder="Usuario"
          value={usuario}
          onChange={(event) => setUsuario(event.target.value)}
          required
        />

        <input
          type="password"
          placeholder="Contraseña"
          value={contrasena}
          onChange={(event) => setContrasena(event.target.value)}
          required
        />

        <button type="submit">Ingresar</button>
      </form>
    </div>
  );
}
