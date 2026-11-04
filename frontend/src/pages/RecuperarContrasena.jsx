// pages/RecuperarContrasena.jsx
// "¿Olvidaste tu contraseña?": el Administrador restablece su clave con el
// código de recuperación que generó desde su panel. Los cajeros no usan esta
// pantalla: le piden al Administrador que les cambie la clave.
import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import api from "../services/api";
import "../styles/common.css";

const campo = {
  width: "100%",
  padding: "12px 14px",
  border: "1.5px solid #e2e8f0",
  borderRadius: "10px",
  backgroundColor: "#f8fafc",
  fontSize: "0.95em",
  color: "#1e293b",
  outline: "none",
  boxSizing: "border-box",
};

const etiqueta = {
  display: "block",
  fontSize: "0.85em",
  fontWeight: "600",
  color: "#334155",
  marginBottom: "6px",
};

export default function RecuperarContrasena() {
  const navigate = useNavigate();
  const [usuario, setUsuario] = useState("");
  const [codigo, setCodigo] = useState("");
  const [nueva, setNueva] = useState("");
  const [repetir, setRepetir] = useState("");
  const [error, setError] = useState("");
  const [exito, setExito] = useState("");
  const [enviando, setEnviando] = useState(false);

  async function handleSubmit(e) {
    e.preventDefault();
    setError("");

    if (!usuario.trim() || !codigo.trim() || !nueva) {
      setError("Completá todos los campos.");
      return;
    }
    if (nueva.length < 6) {
      setError("La nueva contraseña debe tener al menos 6 caracteres.");
      return;
    }
    if (nueva !== repetir) {
      setError("Las contraseñas no coinciden.");
      return;
    }

    setEnviando(true);
    try {
      const { data } = await api.post("/auth/recuperar", {
        usuario: usuario.trim(),
        codigo: codigo.trim(),
        nuevaPassword: nueva,
      });
      setExito(data.mensaje);
    } catch (err) {
      setError(err.response?.data?.mensaje || "No se pudo conectar con el servidor.");
    } finally {
      setEnviando(false);
    }
  }

  return (
    <div
      style={{
        minHeight: "100vh",
        display: "flex",
        justifyContent: "center",
        alignItems: "center",
        padding: "30px 16px",
        backgroundColor: "#f4f6f9",
        backgroundImage: "radial-gradient(#e0e4eb 1px, transparent 1px)",
        backgroundSize: "20px 20px",
        boxSizing: "border-box",
      }}
    >
      <div
        style={{
          width: "100%",
          maxWidth: "440px",
          backgroundColor: "#ffffff",
          borderRadius: "20px",
          padding: "36px 28px",
          boxShadow: "0 12px 35px rgba(38, 29, 96, 0.08)",
          border: "1px solid #edf0f4",
          boxSizing: "border-box",
        }}
      >
        <span style={{ color: "#261d60", fontSize: "0.82em", fontWeight: "700", letterSpacing: "1px", textTransform: "uppercase", display: "block", marginBottom: "4px" }}>
          Recuperar acceso
        </span>
        <h2 style={{ color: "#1e293b", fontSize: "1.6rem", fontWeight: "800", margin: "0 0 8px 0" }}>
          ¿Olvidaste tu contraseña?
        </h2>

        {exito ? (
          <>
            <div style={{ backgroundColor: "#ecfdf5", color: "#065f46", padding: "14px", borderRadius: "10px", border: "1px solid #a7f3d0", fontSize: "0.92em", margin: "16px 0 20px" }}>
              {exito}
            </div>
            <button
              type="button"
              onClick={() => navigate("/login", { replace: true })}
              style={{ width: "100%", backgroundColor: "#261d60", color: "#fff", padding: "13px", borderRadius: "10px", border: "none", fontSize: "1rem", fontWeight: "700", cursor: "pointer" }}
            >
              Ir a iniciar sesión
            </button>
          </>
        ) : (
          <>
            <p style={{ color: "#64748b", fontSize: "0.9em", margin: "0 0 14px 0" }}>
              <strong>Administrador:</strong> ingresá tu usuario y el código de recuperación que generaste desde tu panel.
            </p>
            <div style={{ backgroundColor: "#f0edfd", color: "#261d60", padding: "10px 14px", borderRadius: "8px", fontSize: "0.85em", marginBottom: "20px" }}>
              <strong>¿Sos cajero?</strong> Pedile al Administrador que te restablezca la contraseña desde la gestión de usuarios.
            </div>

            <form onSubmit={handleSubmit} style={{ display: "flex", flexDirection: "column", gap: "16px" }}>
              <div>
                <label htmlFor="rec-usuario" style={etiqueta}>Usuario</label>
                <input id="rec-usuario" type="text" autoComplete="username" value={usuario} onChange={(e) => setUsuario(e.target.value)} placeholder="Nombre de usuario" style={campo} />
              </div>
              <div>
                <label htmlFor="rec-codigo" style={etiqueta}>Código de recuperación</label>
                <input
                  id="rec-codigo"
                  type="text"
                  autoComplete="off"
                  spellCheck={false}
                  value={codigo}
                  onChange={(e) => setCodigo(e.target.value.toUpperCase())}
                  placeholder="XXXX-XXXX-XXXX-XXXX"
                  style={{ ...campo, fontFamily: "monospace", letterSpacing: "1px" }}
                />
              </div>
              <div>
                <label htmlFor="rec-nueva" style={etiqueta}>Nueva contraseña</label>
                <input id="rec-nueva" type="password" autoComplete="new-password" value={nueva} onChange={(e) => setNueva(e.target.value)} placeholder="Mínimo 6 caracteres" style={campo} />
              </div>
              <div>
                <label htmlFor="rec-repetir" style={etiqueta}>Repetir nueva contraseña</label>
                <input id="rec-repetir" type="password" autoComplete="new-password" value={repetir} onChange={(e) => setRepetir(e.target.value)} style={campo} />
              </div>

              {error && (
                <div style={{ backgroundColor: "#fef2f2", color: "#b91c1c", padding: "10px 14px", borderRadius: "8px", fontSize: "0.88em", border: "1px solid #fecaca" }}>
                  {error}
                </div>
              )}

              <button
                type="submit"
                disabled={enviando}
                style={{ backgroundColor: "#261d60", color: "#fff", padding: "13px", borderRadius: "10px", border: "none", fontSize: "1rem", fontWeight: "700", cursor: enviando ? "not-allowed" : "pointer", opacity: enviando ? 0.75 : 1 }}
              >
                {enviando ? "Verificando..." : "Restablecer contraseña"}
              </button>
            </form>
          </>
        )}

        <div style={{ textAlign: "center", marginTop: "18px" }}>
          <Link to="/login" style={{ color: "#64748b", fontSize: "0.85em", fontWeight: "600", textDecoration: "none" }}>
            ← Volver al inicio de sesión
          </Link>
        </div>
      </div>
    </div>
  );
}
