import "../styles/common.css";
import "../styles/login.css";
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
      
      login(usuarioLogueado, token); 

      const rolDelUsuario = usuarioLogueado.Rol?.Nombre || usuarioLogueado.rol || usuarioLogueado.Rol;

      navigate(rolDelUsuario === "Admin" ? "/admin" : "/pos", {
        replace: true,
      });
    } catch (err) {
      setError(
        err.response?.status === 401
          ? "Usuario o contraseña incorrectos"
          : "No se pudo conectar con el servidor",
      );
    } finally {
      setCargando(false);
    }
  }

  // Función para manejar el "¿Olvidaste tu contraseña?"
  const manejarOlvidoContrasena = () => {
    alert("Para reestablecer tu contraseña, comunicate con el Administrador o soporte técnico del sistema.");
  };

  return (
    <div className="pagina-login">
      <form className="tarjeta-login-moderna" onSubmit={handleSubmit}>
        
        {/* Encabezado con Ícono de Candado */}
        <div style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: "10px", marginBottom: "5px" }}>
          <div style={{ backgroundColor: "rgba(25, 118, 210, 0.1)", padding: "12px", borderRadius: "50%", display: "flex", justifyContent: "center", alignItems: "center" }}>
            <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="#1976d2" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
              <rect x="3" y="11" width="18" height="11" rx="2" ry="2"></rect>
              <path d="M7 11V7a5 5 0 0 1 10 0v4"></path>
            </svg>
          </div>
          <h2 style={{ margin: 0, color: "#2c3e50", fontSize: "1.65em", fontWeight: "700" }}>Iniciar sesión</h2>
        </div>

        {/* Campo Usuario */}
        <div className="contenedor-input">
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
            <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"></path>
            <circle cx="12" cy="7" r="4"></circle>
          </svg>
          <input
            className="input-login"
            type="text"
            placeholder="Usuario"
            value={usuario}
            onChange={(e) => setUsuario(e.target.value)}
            required
          />
        </div>

        {/* Campo Contraseña */}
        <div className="contenedor-input">
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
            <rect x="3" y="11" width="18" height="11" rx="2" ry="2"></rect>
            <path d="M7 11V7a5 5 0 0 1 10 0v4"></path>
          </svg>
          <input
            className="input-login"
            type="password"
            placeholder="Contraseña"
            value={contrasena}
            onChange={(e) => setContrasena(e.target.value)}
            required
          />
        </div>

        {error && <p className="mensaje-error" style={{ margin: 0, fontSize: "0.9em", textAlign: "center" }}> {error} </p>}
        
        {/* Botón Ingresar */}
        <button className="btn-ingresar" type="submit" disabled={cargando}>
          {cargando ? (
            "Ingresando..."
          ) : (
            <>
              Ingresar
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                <line x1="5" y1="12" x2="19" y2="12"></line>
                <polyline points="12 5 19 12 12 19"></polyline>
              </svg>
            </>
          )}
        </button>

        {/* Olvidaste tu contraseña */}
        <button type="button" onClick={manejarOlvidoContrasena} className="btn-olvido">
          ¿Olvidaste tu contraseña?
        </button>

      </form>
    </div>
  );
}