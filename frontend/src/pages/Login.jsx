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

      // EL CAMBIO CLAVE: Si es Admin va al panel, si es Cajero va a abrir la caja (no al POS directo)
      navigate(rolDelUsuario === "Admin" ? "/admin" : "/apertura-caja", {
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

  const manejarOlvidoContrasena = () => {
    alert("Para reestablecer tu contraseña, comunicate con el Administrador o soporte técnico del sistema.");
  };

  return (
    <div className="pagina-login" style={{ backgroundColor: "#e6e4f4", backgroundImage: "radial-gradient(#c2bce0 1px, transparent 1px)", backgroundSize: "20px 20px" }}>
      <form className="tarjeta-login-moderna" onSubmit={handleSubmit} style={{ boxShadow: "0 10px 30px rgba(38, 29, 96, 0.15)" }}>
        
        {/* ESPACIO RESERVADO PARA EL LOGO */}
        <div style={{ display: "flex", flexDirection: "column", alignItems: "center", marginBottom: "15px" }}>
          <div style={{ width: "70px", height: "70px", backgroundColor: "#f3e5f5", borderRadius: "16px", display: "flex", justifyContent: "center", alignItems: "center", marginBottom: "10px", border: "2px dashed #261d60" }}>
            {/* Cuando tengas el logo, borrás este SVG y ponés la etiqueta <img> */}
            <svg width="36" height="36" viewBox="0 0 24 24" fill="none" stroke="#261d60" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
              <path d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z"></path>
              <polyline points="9 22 9 12 15 12 15 22"></polyline>
            </svg>
          </div>
        </div>

        {/* Encabezado con Ícono de Candado Morado */}
        <div style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: "10px", marginBottom: "20px" }}>
          <div style={{ backgroundColor: "rgba(38, 29, 96, 0.1)", padding: "12px", borderRadius: "50%", display: "flex", justifyContent: "center", alignItems: "center" }}>
            <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="#261d60" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
              <rect x="3" y="11" width="18" height="11" rx="2" ry="2"></rect>
              <path d="M7 11V7a5 5 0 0 1 10 0v4"></path>
            </svg>
          </div>
          <h2 style={{ margin: 0, color: "#261d60", fontSize: "1.65em", fontWeight: "700" }}>Iniciar sesión</h2>
        </div>

        {/* Campo Usuario */}
        <div className="contenedor-input">
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#261d60" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
            <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"></path>
            <circle cx="12" cy="7" r="4"></circle>
          </svg>
          <input
            className="input-login"
            type="text"
            placeholder="Usuario"
            value={usuario}
            onChange={(e) => setUsuario(e.target.value)}
            style={{ borderFocus: "#261d60" }}
            required
          />
        </div>

        {/* Campo Contraseña */}
        <div className="contenedor-input">
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#261d60" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
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

        {error && <p className="mensaje-error" style={{ margin: 0, fontSize: "0.9em", textAlign: "center", color: "#c62828", backgroundColor: "#ffebee", padding: "8px", borderRadius: "6px" }}> {error} </p>}
        
        {/* Botón Ingresar */}
        <button 
          className="btn-ingresar" 
          type="submit" 
          disabled={cargando}
          style={{ backgroundColor: "#261d60", color: "white", transition: "background 0.3s" }}
        >
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
        <button type="button" onClick={manejarOlvidoContrasena} className="btn-olvido" style={{ color: "#261d60" }}>
          ¿Olvidaste tu contraseña?
        </button>

      </form>
    </div>
  );
}