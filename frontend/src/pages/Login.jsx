import "../styles.css";
import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import api from "../services/api";

export default function Login() {
  const [usuario, setUsuario] = useState("");
  const [contrasena, setContrasena] = useState("");
  const [error, setError] = useState("");
  const [cargando, setCargando] = useState(false);
  const navigate = useNavigate();
  const { login } = useAuth();

  async function handleSubmit(event) {
    event.preventDefault();
    if (!usuario.trim() || !contrasena) return;

    setError("");
    setCargando(true);

    try {
      const response = await api.post("/auth/login", {
        usuario: usuario.trim(),
        password: contrasena,
      });

      const { token, usuario: usuarioLogueado } = response.data;
      login({ token, usuario: usuarioLogueado });
      navigate(usuarioLogueado.rol === "Admin" ? "/admin" : "/pos", { replace: true });
    } catch (err) {
      setError(err.response?.status === 401 ? "Usuario o contraseña incorrectos" : "No se pudo conectar con el servidor");
    } finally {
      setCargando(false);
    }
  }

  return (
    <div className="pagina">
      <form className="tarjeta" onSubmit={handleSubmit}>
        <h1>Iniciar sesión</h1>
        <input type="text" placeholder="Usuario" value={usuario} onChange={(e) => setUsuario(e.target.value)} required />
        <input type="password" placeholder="Contraseña" value={contrasena} onChange={(e) => setContrasena(e.target.value)} required />
        {error && <p style={{ color: "#d32f2f", fontWeight: "bold" }}>{error}</p>}
        <button type="submit" disabled={cargando}>{cargando ? "Ingresando..." : "Ingresar"}</button>
      </form>
    </div>
  );
}