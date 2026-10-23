import "../styles/common.css";
import "../styles/login.css";
import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import api from "../services/api";

// Importamos ambas versiones del logo
import logoMorado from "../assets/LogoKiosquitoYa_morado.png";
import logoBlanco from "../assets/LogoKiosquitoYa_blanco.png";

export default function Login() {
  const [usuario, setUsuario] = useState("");
  const [contrasena, setContrasena] = useState("");
  const [error, setError] = useState("");
  const [cargando, setCargando] = useState(false);

  // Estado para alternar entre logo morado y logo blanco
  const [mostrarLogoBlanco, setMostrarLogoBlanco] = useState(false);

  const navigate = useNavigate();
  const { login } = useAuth();

  async function handleSubmit(event) {
    event.preventDefault();

    if (!usuario.trim()) {
      setError("Por favor, ingresá tu usuario.");
      return;
    }

    if (!contrasena) {
      setError("Por favor, ingresá tu contraseña.");
      return;
    }

    setError("");
    setCargando(true);

    try {
      const response = await api.post("/auth/login", {
        usuario: usuario.trim(),
        password: contrasena,
      });

      const { token, usuario: usuarioLogueado } = response.data;
      login(usuarioLogueado, token);

      const rolDelUsuario =
        usuarioLogueado.Rol?.Nombre || usuarioLogueado.rol || usuarioLogueado.Rol;

      if (rolDelUsuario === "Admin") {
        navigate("/admin", { replace: true });
      } else {
        const turnoActivo = localStorage.getItem("id_turno");
        navigate(turnoActivo ? "/pos" : "/apertura-caja", { replace: true });
      }
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
    alert(
      "Para reestablecer tu contraseña, comunicate con el Administrador o soporte técnico del sistema."
    );
  };

  return (
    <div
      style={{
        minHeight: "100vh",
        display: "flex",
        backgroundColor: "#f4f6f9",
        flexWrap: "wrap",
      }}
    >
      {/* PANEL IZQUIERDO: BRANDING INSTITUCIONAL */}
      <div
        style={{
          flex: "1 1 480px",
          backgroundColor: "#261d60",
          backgroundImage:
            "radial-gradient(rgba(255, 255, 255, 0.08) 1.5px, transparent 1.5px)",
          backgroundSize: "22px 22px",
          display: "flex",
          flexDirection: "column",
          justifyContent: "center",
          alignItems: "center",
          padding: "50px 30px",
          position: "relative",
          overflow: "hidden",
        }}
      >
        {/* Glow de iluminación de fondo */}
        <div
          style={{
            position: "absolute",
            width: "320px",
            height: "320px",
            backgroundColor: "#4a3fa0",
            filter: "blur(90px)",
            borderRadius: "50%",
            opacity: 0.35,
            zIndex: 0,
          }}
        />

        {/* Tarjeta interactiva: Al hacer clic alterna entre el logo morado y el blanco */}
        <div
          onClick={() => setMostrarLogoBlanco(!mostrarLogoBlanco)}
          title="Hacé clic para cambiar la versión del logo"
          style={{
            position: "relative",
            zIndex: 1,
            backgroundColor: "rgba(255, 255, 255, 0.06)",
            border: "1px solid rgba(255, 255, 255, 0.14)",
            borderRadius: "24px",
            padding: "24px",
            boxShadow: "0 20px 40px rgba(0, 0, 0, 0.25)",
            backdropFilter: "blur(12px)",
            display: "flex",
            justifyContent: "center",
            alignItems: "center",
            maxWidth: "380px",
            width: "90%",
            marginBottom: "28px",
            cursor: "pointer",
            transition: "transform 0.2s ease, box-shadow 0.2s ease",
            userSelect: "none",
          }}
          onMouseEnter={(e) => {
            e.currentTarget.style.transform = "scale(1.02)";
            e.currentTarget.style.boxShadow = "0 25px 45px rgba(0, 0, 0, 0.35)";
          }}
          onMouseLeave={(e) => {
            e.currentTarget.style.transform = "scale(1)";
            e.currentTarget.style.boxShadow = "0 20px 40px rgba(0, 0, 0, 0.25)";
          }}
        >
          <img
            src={mostrarLogoBlanco ? logoBlanco : logoMorado}
            alt="KiosquitoYa"
            style={{
              width: "100%",
              height: "auto",
              display: "block",
              borderRadius: "14px",
              boxShadow: "0 8px 20px rgba(0, 0, 0, 0.2)",
              transition: "opacity 0.3s ease",
            }}
          />
        </div>

        {/* Textos descriptivos debajo de la tarjeta */}
        <div style={{ position: "relative", zIndex: 1, textAlign: "center" }}>
          <h2
            style={{
              color: "#ffffff",
              fontSize: "1.35rem",
              fontWeight: "600",
              letterSpacing: "0.5px",
              margin: "0 0 8px 0",
            }}
          >
            Punto de Venta & Control de Inventario
          </h2>
          <p
            style={{
              color: "#b0a9d8",
              fontSize: "0.9em",
              margin: "0 0 20px 0",
            }}
          >
            Gestión comercial ágil y centralizada
          </p>

          <span
            style={{
              display: "inline-block",
              backgroundColor: "rgba(255, 255, 255, 0.1)",
              border: "1px solid rgba(255, 255, 255, 0.15)",
              color: "#e6e4f4",
              padding: "5px 14px",
              borderRadius: "20px",
              fontSize: "0.78em",
              fontWeight: "600",
              letterSpacing: "0.5px",
            }}
          >
            SISTEMA SEGURO • V1.0
          </span>
        </div>
      </div>

      {/* PANEL DERECHO: FORMULARIO */}
      <div
        style={{
          flex: "1 1 420px",
          display: "flex",
          justifyContent: "center",
          alignItems: "center",
          padding: "50px 30px",
          backgroundColor: "#f4f6f9",
          backgroundImage:
            "radial-gradient(#e0e4eb 1px, transparent 1px)",
          backgroundSize: "20px 20px",
        }}
      >
        <div
          style={{
            width: "100%",
            maxWidth: "420px",
            backgroundColor: "#ffffff",
            borderRadius: "20px",
            padding: "42px 36px",
            boxShadow: "0 12px 35px rgba(38, 29, 96, 0.08)",
            border: "1px solid #edf0f4",
          }}
        >
          {/* Cabecera del formulario */}
          <div style={{ marginBottom: "26px" }}>
            <span
              style={{
                color: "#261d60",
                fontSize: "0.82em",
                fontWeight: "700",
                letterSpacing: "1px",
                textTransform: "uppercase",
                display: "block",
                marginBottom: "4px",
              }}
            >
              Acceso al personal
            </span>
            <h2
              style={{
                color: "#1e293b",
                fontSize: "1.9rem",
                fontWeight: "800",
                margin: "0 0 6px 0",
              }}
            >
              Iniciar sesión
            </h2>
            <p
              style={{
                color: "#64748b",
                fontSize: "0.92em",
                margin: 0,
              }}
            >
              Ingresá con tus credenciales de usuario.
            </p>
          </div>

          <form
            onSubmit={handleSubmit}
            style={{ display: "flex", flexDirection: "column", gap: "18px" }}
          >
            {/* Campo Usuario */}
            <div>
              <label
                style={{
                  display: "block",
                  fontSize: "0.85em",
                  fontWeight: "600",
                  color: "#334155",
                  marginBottom: "6px",
                }}
              >
                Usuario
              </label>
              <div
                style={{
                  display: "flex",
                  alignItems: "center",
                  backgroundColor: "#f8fafc",
                  border: "1.5px solid #e2e8f0",
                  borderRadius: "10px",
                  padding: "0 14px",
                }}
              >
                <svg
                  width="18"
                  height="18"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="#64748b"
                  strokeWidth="2.2"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                >
                  <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"></path>
                  <circle cx="12" cy="7" r="4"></circle>
                </svg>
                <input
                  type="text"
                  placeholder="Nombre de usuario"
                  value={usuario}
                  onChange={(e) => {
                    setUsuario(e.target.value);
                    if (error) setError("");
                  }}
                  style={{
                    width: "100%",
                    padding: "12px 10px",
                    border: "none",
                    outline: "none",
                    backgroundColor: "transparent",
                    fontSize: "0.95em",
                    color: "#1e293b",
                  }}
                />
              </div>
            </div>

            {/* Campo Contraseña */}
            <div>
              <label
                style={{
                  display: "block",
                  fontSize: "0.85em",
                  fontWeight: "600",
                  color: "#334155",
                  marginBottom: "6px",
                }}
              >
                Contraseña
              </label>
              <div
                style={{
                  display: "flex",
                  alignItems: "center",
                  backgroundColor: "#f8fafc",
                  border: "1.5px solid #e2e8f0",
                  borderRadius: "10px",
                  padding: "0 14px",
                }}
              >
                <svg
                  width="18"
                  height="18"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="#64748b"
                  strokeWidth="2.2"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                >
                  <rect x="3" y="11" width="18" height="11" rx="2" ry="2"></rect>
                  <path d="M7 11V7a5 5 0 0 1 10 0v4"></path>
                </svg>
                <input
                  type="password"
                  placeholder="••••••••"
                  value={contrasena}
                  onChange={(e) => {
                    setContrasena(e.target.value);
                    if (error) setError("");
                  }}
                  style={{
                    width: "100%",
                    padding: "12px 10px",
                    border: "none",
                    outline: "none",
                    backgroundColor: "transparent",
                    fontSize: "0.95em",
                    color: "#1e293b",
                  }}
                />
              </div>
            </div>

            {error && (
              <div
                style={{
                  backgroundColor: "#fef2f2",
                  color: "#b91c1c",
                  padding: "10px 14px",
                  borderRadius: "8px",
                  fontSize: "0.88em",
                  fontWeight: "500",
                  border: "1px solid #fecaca",
                  display: "flex",
                  alignItems: "center",
                  gap: "8px",
                }}
              >
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                  <circle cx="12" cy="12" r="10"></circle>
                  <line x1="12" y1="8" x2="12" y2="12"></line>
                  <line x1="12" y1="16" x2="12.01" y2="16"></line>
                </svg>
                {error}
              </div>
            )}

            {/* Botón Ingresar */}
            <button
              type="submit"
              disabled={cargando}
              style={{
                backgroundColor: "#261d60",
                color: "#ffffff",
                padding: "13px 18px",
                borderRadius: "10px",
                border: "none",
                fontSize: "1rem",
                fontWeight: "700",
                cursor: cargando ? "not-allowed" : "pointer",
                boxShadow: "0 6px 18px rgba(38, 29, 96, 0.25)",
                display: "flex",
                justifyContent: "center",
                alignItems: "center",
                gap: "8px",
                marginTop: "6px",
                transition: "all 0.15s ease",
              }}
              onMouseEnter={(e) => {
                if (!cargando) e.currentTarget.style.transform = "translateY(-1px)";
              }}
              onMouseLeave={(e) => {
                if (!cargando) e.currentTarget.style.transform = "translateY(0)";
              }}
            >
              {cargando ? (
                "Verificando..."
              ) : (
                <>
                  Ingresar
                  <svg
                    width="18"
                    height="18"
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="2.5"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  >
                    <line x1="5" y1="12" x2="19" y2="12"></line>
                    <polyline points="12 5 19 12 12 19"></polyline>
                  </svg>
                </>
              )}
            </button>

            {/* Olvidaste tu contraseña */}
            <button
              type="button"
              onClick={manejarOlvidoContrasena}
              style={{
                background: "none",
                border: "none",
                color: "#64748b",
                fontSize: "0.85em",
                fontWeight: "600",
                cursor: "pointer",
                padding: "6px",
                transition: "color 0.2s",
              }}
              onMouseEnter={(e) => (e.currentTarget.style.color = "#261d60")}
              onMouseLeave={(e) => (e.currentTarget.style.color = "#64748b")}
            >
              ¿Olvidaste tu contraseña?
            </button>
          </form>
        </div>
      </div>
    </div>
  );
}