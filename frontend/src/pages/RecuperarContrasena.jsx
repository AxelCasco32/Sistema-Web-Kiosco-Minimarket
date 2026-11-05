// pages/RecuperarContrasena.jsx
// "¿Olvidaste tu contraseña?" en dos pasos:
//   1) El usuario ingresa su usuario o email y se le envía un código al correo.
//   2) Ingresa ese código (vence en 15 minutos) y su nueva contraseña.
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

const botonPrimario = (deshabilitado) => ({
  width: "100%",
  backgroundColor: "#261d60",
  color: "#fff",
  padding: "13px",
  borderRadius: "10px",
  border: "none",
  fontSize: "1rem",
  fontWeight: "700",
  cursor: deshabilitado ? "not-allowed" : "pointer",
  opacity: deshabilitado ? 0.75 : 1,
});

const cajaError = {
  backgroundColor: "#fef2f2",
  color: "#b91c1c",
  padding: "10px 14px",
  borderRadius: "8px",
  fontSize: "0.88em",
  border: "1px solid #fecaca",
};

const cajaInfo = {
  backgroundColor: "#f0edfd",
  color: "#261d60",
  padding: "10px 14px",
  borderRadius: "8px",
  fontSize: "0.86em",
  lineHeight: 1.45,
};

export default function RecuperarContrasena() {
  const navigate = useNavigate();
  const [paso, setPaso] = useState(1); // 1 = pedir código, 2 = ingresar código, 3 = listo
  const [identificador, setIdentificador] = useState("");
  const [codigo, setCodigo] = useState("");
  const [nueva, setNueva] = useState("");
  const [repetir, setRepetir] = useState("");
  const [info, setInfo] = useState("");
  const [error, setError] = useState("");
  const [enviando, setEnviando] = useState(false);

  async function solicitarCodigo(e) {
    e?.preventDefault();
    setError("");
    if (!identificador.trim()) {
      setError("Ingresá tu usuario o tu email.");
      return;
    }
    setEnviando(true);
    try {
      const { data } = await api.post("/auth/recuperar/solicitar", {
        identificador: identificador.trim(),
      });
      setInfo(data.mensaje);
      setPaso(2);
    } catch (err) {
      setError(err.response?.data?.mensaje || "No se pudo conectar con el servidor.");
    } finally {
      setEnviando(false);
    }
  }

  async function restablecer(e) {
    e.preventDefault();
    setError("");
    if (codigo.length !== 6) {
      setError("El código tiene 6 números.");
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
      const { data } = await api.post("/auth/recuperar/restablecer", {
        identificador: identificador.trim(),
        codigo,
        nuevaPassword: nueva,
      });
      setInfo(data.mensaje);
      setPaso(3);
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
          Recuperar acceso · Paso {Math.min(paso, 2)} de 2
        </span>
        <h2 style={{ color: "#1e293b", fontSize: "1.6rem", fontWeight: "800", margin: "0 0 8px 0" }}>
          ¿Olvidaste tu contraseña?
        </h2>

        {paso === 1 && (
          <form onSubmit={solicitarCodigo} style={{ display: "flex", flexDirection: "column", gap: "16px" }}>
            <p style={{ color: "#64748b", fontSize: "0.9em", margin: 0 }}>
              Ingresá tu usuario o el email que tenés registrado. Te vamos a enviar un código para crear una contraseña nueva.
            </p>
            <div>
              <label htmlFor="rec-identificador" style={etiqueta}>Usuario o email</label>
              <input
                id="rec-identificador"
                type="text"
                autoComplete="username"
                autoFocus
                value={identificador}
                onChange={(e) => setIdentificador(e.target.value)}
                placeholder="usuario o nombre@correo.com"
                style={campo}
              />
            </div>
            {error && <div style={cajaError}>{error}</div>}
            <button type="submit" disabled={enviando} style={botonPrimario(enviando)}>
              {enviando ? "Enviando..." : "Enviarme el código"}
            </button>
          </form>
        )}

        {paso === 2 && (
          <form onSubmit={restablecer} style={{ display: "flex", flexDirection: "column", gap: "16px" }}>
            <div style={cajaInfo}>{info}</div>
            <div>
              <label htmlFor="rec-codigo" style={etiqueta}>Código de 6 números</label>
              <input
                id="rec-codigo"
                type="text"
                inputMode="numeric"
                autoComplete="one-time-code"
                autoFocus
                maxLength={6}
                value={codigo}
                onChange={(e) => setCodigo(e.target.value.replace(/\D/g, "").slice(0, 6))}
                placeholder="000000"
                style={{ ...campo, fontFamily: "monospace", fontSize: "1.3em", letterSpacing: "6px", textAlign: "center" }}
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
            {error && <div style={cajaError}>{error}</div>}
            <button type="submit" disabled={enviando} style={botonPrimario(enviando)}>
              {enviando ? "Verificando..." : "Cambiar contraseña"}
            </button>
            <div style={{ display: "flex", justifyContent: "space-between", gap: "10px", flexWrap: "wrap" }}>
              <button
                type="button"
                onClick={() => { setPaso(1); setCodigo(""); setError(""); }}
                style={{ background: "none", border: "none", color: "#64748b", fontWeight: "600", fontSize: "0.85em", cursor: "pointer", padding: 0 }}
              >
                ← Cambiar usuario
              </button>
              <button
                type="button"
                disabled={enviando}
                onClick={() => solicitarCodigo()}
                style={{ background: "none", border: "none", color: "#261d60", fontWeight: "700", fontSize: "0.85em", cursor: "pointer", padding: 0 }}
              >
                Reenviar código
              </button>
            </div>
            <p style={{ color: "#94a3b8", fontSize: "0.8em", margin: 0 }}>
              ¿No te llega? Revisá spam. Si tu usuario no tiene email cargado, pedile al Administrador que te cambie la contraseña.
            </p>
          </form>
        )}

        {paso === 3 && (
          <>
            <div style={{ backgroundColor: "#ecfdf5", color: "#065f46", padding: "14px", borderRadius: "10px", border: "1px solid #a7f3d0", fontSize: "0.92em", margin: "16px 0 20px" }}>
              {info}
            </div>
            <button type="button" onClick={() => navigate("/login", { replace: true })} style={botonPrimario(false)}>
              Ir a iniciar sesión
            </button>
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
