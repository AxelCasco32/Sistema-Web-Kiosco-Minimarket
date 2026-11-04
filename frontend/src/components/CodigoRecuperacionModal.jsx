// components/CodigoRecuperacionModal.jsx
// Permite al Administrador generar su código de recuperación de contraseña.
// El código se muestra UNA sola vez: hay que anotarlo en un lugar seguro.
import { useState, useEffect } from "react";
import api from "../services/api";

export default function CodigoRecuperacionModal({ onClose }) {
  const [tieneCodigo, setTieneCodigo] = useState(null);
  const [password, setPassword] = useState("");
  const [codigo, setCodigo] = useState("");
  const [error, setError] = useState("");
  const [generando, setGenerando] = useState(false);
  const [copiado, setCopiado] = useState(false);

  useEffect(() => {
    api
      .get("/auth/codigo-recuperacion")
      .then((res) => setTieneCodigo(res.data.tieneCodigo))
      .catch(() => setTieneCodigo(false));
  }, []);

  async function generar(e) {
    e.preventDefault();
    setError("");
    if (!password) {
      setError("Ingresá tu contraseña actual.");
      return;
    }
    if (tieneCodigo && !window.confirm("Ya tenés un código generado. Si generás uno nuevo, el anterior deja de funcionar. ¿Continuar?")) {
      return;
    }
    setGenerando(true);
    try {
      const { data } = await api.post("/auth/codigo-recuperacion", { password });
      setCodigo(data.codigo);
      setTieneCodigo(true);
      setPassword("");
    } catch (err) {
      setError(err.response?.data?.mensaje || "No se pudo generar el código.");
    } finally {
      setGenerando(false);
    }
  }

  async function copiar() {
    try {
      await navigator.clipboard.writeText(codigo);
      setCopiado(true);
      setTimeout(() => setCopiado(false), 2000);
    } catch {
      setCopiado(false);
    }
  }

  return (
    <div style={styles.overlay} onClick={onClose}>
      <div style={styles.modal} onClick={(e) => e.stopPropagation()} role="dialog" aria-modal="true" aria-labelledby="titulo-codigo-rec">
        <h2 id="titulo-codigo-rec" style={styles.title}>Código de recuperación</h2>
        <p style={styles.text}>
          Si olvidás tu contraseña, vas a poder restablecerla desde <strong>"¿Olvidaste tu contraseña?"</strong> en el inicio de sesión, usando este código.
        </p>

        {tieneCodigo !== null && !codigo && (
          <div style={{ ...styles.estado, ...(tieneCodigo ? styles.estadoOk : styles.estadoFalta) }}>
            {tieneCodigo
              ? "Ya tenés un código activo. Generá uno nuevo solo si lo perdiste."
              : "Todavía no generaste un código. Si perdés la contraseña no vas a poder recuperarla."}
          </div>
        )}

        {codigo ? (
          <>
            <div style={styles.codigoBox}>
              <code style={styles.codigo}>{codigo}</code>
              <button type="button" onClick={copiar} style={styles.btnCopiar}>
                {copiado ? "¡Copiado!" : "Copiar"}
              </button>
            </div>
            <div style={styles.aviso}>
              <strong>Anotalo ahora y guardalo en un lugar seguro</strong> (papel, gestor de contraseñas). No se vuelve a mostrar. Sirve una sola vez: después de usarlo, generá uno nuevo.
            </div>
            <button type="button" onClick={onClose} style={styles.btnPrimario}>
              Ya lo guardé
            </button>
          </>
        ) : (
          <form onSubmit={generar} style={{ display: "flex", flexDirection: "column", gap: "12px" }}>
            <label htmlFor="pass-actual" style={styles.label}>Confirmá tu contraseña actual</label>
            <input
              id="pass-actual"
              type="password"
              autoComplete="current-password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              style={styles.input}
              autoFocus
            />
            {error && <div style={styles.error}>{error}</div>}
            <div style={styles.acciones}>
              <button type="button" onClick={onClose} style={styles.btnSecundario}>Cancelar</button>
              <button type="submit" disabled={generando} style={{ ...styles.btnPrimario, marginTop: 0, opacity: generando ? 0.75 : 1 }}>
                {generando ? "Generando..." : tieneCodigo ? "Generar uno nuevo" : "Generar código"}
              </button>
            </div>
          </form>
        )}
      </div>
    </div>
  );
}

const styles = {
  overlay: {
    position: "fixed",
    inset: 0,
    backgroundColor: "rgba(15, 12, 41, 0.7)",
    display: "flex",
    justifyContent: "center",
    alignItems: "center",
    padding: "16px",
    zIndex: 2000,
    boxSizing: "border-box",
  },
  modal: {
    backgroundColor: "#fff",
    borderRadius: "16px",
    padding: "26px 22px",
    width: "100%",
    maxWidth: "460px",
    boxShadow: "0 20px 50px rgba(0,0,0,0.25)",
    boxSizing: "border-box",
  },
  title: { margin: "0 0 8px", color: "#261d60", fontSize: "1.3em" },
  text: { margin: "0 0 14px", color: "#475569", fontSize: "0.92em", lineHeight: 1.45 },
  estado: { padding: "10px 12px", borderRadius: "8px", fontSize: "0.86em", marginBottom: "16px" },
  estadoOk: { backgroundColor: "#ecfdf5", color: "#065f46", border: "1px solid #a7f3d0" },
  estadoFalta: { backgroundColor: "#fff7ed", color: "#9a3412", border: "1px solid #fed7aa" },
  label: { fontWeight: "600", color: "#334155", fontSize: "0.88em" },
  input: {
    padding: "11px 12px",
    borderRadius: "8px",
    border: "1.5px solid #e2e8f0",
    fontSize: "1em",
    outline: "none",
    width: "100%",
    boxSizing: "border-box",
  },
  error: { backgroundColor: "#fef2f2", color: "#b91c1c", padding: "9px 12px", borderRadius: "8px", fontSize: "0.86em", border: "1px solid #fecaca" },
  acciones: { display: "flex", gap: "10px", justifyContent: "flex-end", flexWrap: "wrap" },
  codigoBox: {
    display: "flex",
    alignItems: "center",
    justifyContent: "space-between",
    gap: "10px",
    flexWrap: "wrap",
    backgroundColor: "#f0edfd",
    border: "1px dashed #261d60",
    borderRadius: "10px",
    padding: "14px",
    marginBottom: "12px",
  },
  codigo: { fontSize: "1.15em", fontWeight: "700", color: "#261d60", letterSpacing: "1px", wordBreak: "break-all" },
  btnCopiar: { backgroundColor: "#261d60", color: "#fff", border: "none", borderRadius: "8px", padding: "8px 14px", fontWeight: "700", cursor: "pointer" },
  aviso: { backgroundColor: "#fef2f2", color: "#991b1b", border: "1px solid #fecaca", borderRadius: "8px", padding: "10px 12px", fontSize: "0.86em", lineHeight: 1.45 },
  btnPrimario: { backgroundColor: "#261d60", color: "#fff", border: "none", borderRadius: "8px", padding: "11px 18px", fontWeight: "700", cursor: "pointer", marginTop: "16px", width: "auto" },
  btnSecundario: { backgroundColor: "#f1f5f9", color: "#334155", border: "none", borderRadius: "8px", padding: "11px 18px", fontWeight: "700", cursor: "pointer" },
};
