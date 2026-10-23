import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";

// Isotipos oficiales
import iconoMorado from "../assets/IconoKiosquitoYa_morado.png";
import iconoBlanco from "../assets/IconoKiosquitoYa_blanco.png";

const AperturaCaja = () => {
  const [horaActual, setHoraActual] = useState(new Date());
  const [montoInicial, setMontoInicial] = useState("");
  const [mostrarIconoBlanco, setMostrarIconoBlanco] = useState(false);
  const [cargando, setCargando] = useState(false);
  const [error, setError] = useState("");

  const navigate = useNavigate();
  const { usuario } = useAuth();

  const idCajero = usuario?.id || usuario?.id_Usuario || usuario?.idUsuario;

  useEffect(() => {
    const turnoActivo = localStorage.getItem("id_turno");
    if (turnoActivo) {
      navigate("/pos", { replace: true });
    }
  }, [navigate]);

  useEffect(() => {
    const timer = setInterval(() => {
      setHoraActual(new Date());
    }, 1000);
    return () => clearInterval(timer);
  }, []);

  const sumarFondo = (valor) => {
    setMontoInicial((prev) => {
      const actual = Number(prev) || 0;
      return String(actual + valor);
    });
  };

  const handleAbrirCaja = async () => {
    if (!idCajero) {
      setError("No se pudo detectar el ID del usuario. Volvé a iniciar sesión.");
      return;
    }

    setCargando(true);
    setError("");

    try {
      const respuesta = await fetch("http://localhost:4000/api/turnos/abrir", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          id_Usuario: idCajero,
          total_efectivo_inicial: Number(montoInicial) || 0,
        }),
      });

      const data = await respuesta.json();

      if (!respuesta.ok) {
        throw new Error(data.error || "Error al abrir la caja");
      }

      localStorage.setItem("id_turno", data.id_turno);
      navigate("/pos", { replace: true });
    } catch (err) {
      setError(err.message);
    } finally {
      setCargando(false);
    }
  };

  return (
    <div style={styles.overlay}>
      <div style={styles.modal}>
        {/* ENCABEZADO CON BRANDING */}
        <div style={styles.header}>
          <div
            onClick={() => setMostrarIconoBlanco(!mostrarIconoBlanco)}
            title="Hacé clic para cambiar la versión del logo"
            style={{
              ...styles.logoWrapper,
              backgroundColor: mostrarIconoBlanco ? "#ffffff" : "transparent",
            }}
          >
            <img
              src={mostrarIconoBlanco ? iconoBlanco : iconoMorado}
              alt="KiosquitoYa"
              style={styles.logoImg}
            />
          </div>

          <h2 style={styles.title}>Apertura de Caja</h2>
          <p style={styles.subtitle}>Inicie su turno para comenzar a facturar</p>
        </div>

        <div style={styles.body}>
          {/* RELOJ Y FECHA */}
          <div style={styles.clockContainer}>
            <span style={styles.timeLabel}>Horario del Sistema</span>
            <div style={styles.time}>
              {horaActual.toLocaleTimeString("es-AR", {
                hour: "2-digit",
                minute: "2-digit",
                second: "2-digit",
              })}
            </div>
            <div style={styles.date}>
              {horaActual.toLocaleDateString("es-AR", {
                weekday: "long",
                day: "numeric",
                month: "long",
                year: "numeric",
              })}
            </div>
          </div>

          {/* DATOS DEL CAJERO */}
          <div style={styles.cajeroCard}>
            <div style={styles.cajeroIcon}>
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#261d60" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"></path>
                <circle cx="12" cy="7" r="4"></circle>
              </svg>
            </div>
            <div>
              <span style={{ fontSize: "0.8em", color: "#7f8c8d", textTransform: "uppercase", fontWeight: "bold" }}>
                Responsable del Turno
              </span>
              <strong style={{ display: "block", color: "#2c3e50", fontSize: "1.05em" }}>
                {usuario?.nombre || usuario?.Nombre || "Usuario"}
              </strong>
            </div>
          </div>

          {/* FONDO DE CAJA INICIAL (VUELTO) */}
          <div style={styles.fondoSection}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "8px" }}>
              <label style={styles.inputLabel}>
                Fondo de Cambio Inicial (Efectivo)
              </label>
              {montoInicial && (
                <button
                  type="button"
                  onClick={() => setMontoInicial("")}
                  style={styles.clearBtn}
                >
                  Reiniciar a $0
                </button>
              )}
            </div>

            <div style={styles.inputWrapper}>
              <span style={styles.currencySymbol}>$</span>
              <input
                type="number"
                min="0"
                placeholder="0.00 (opcional)"
                value={montoInicial}
                onChange={(e) => setMontoInicial(e.target.value)}
                style={styles.inputFondo}
              />
            </div>

            {/* Atajos de billetes frecuentes para el vuelto inicial */}
            <div style={styles.pillsContainer}>
              <button type="button" onClick={() => sumarFondo(1000)} style={styles.pillBtn}>+$1.000</button>
              <button type="button" onClick={() => sumarFondo(2000)} style={styles.pillBtn}>+$2.000</button>
              <button type="button" onClick={() => sumarFondo(5000)} style={styles.pillBtn}>+$5.000</button>
              <button type="button" onClick={() => sumarFondo(10000)} style={styles.pillBtn}>+$10.000</button>
            </div>
          </div>

          {error && <div style={styles.error}>{error}</div>}

          {/* BOTÓN CONFIRMAR */}
          <button
            onClick={handleAbrirCaja}
            disabled={cargando}
            style={{ ...styles.button, opacity: cargando ? 0.75 : 1 }}
          >
            {cargando ? (
              "Habilitando Terminal..."
            ) : (
              <div style={styles.buttonContent}>
                <svg
                  width="20"
                  height="20"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2.5"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                >
                  <rect x="3" y="11" width="18" height="11" rx="2" ry="2"></rect>
                  <path d="M7 11V7a5 5 0 0 1 9.9-1"></path>
                </svg>
                ABRIR TURNO EN CAJA
              </div>
            )}
          </button>
        </div>
      </div>
    </div>
  );
};

const styles = {
  overlay: {
    position: "fixed",
    top: 0,
    left: 0,
    width: "100%",
    height: "100%",
    backgroundColor: "#16113c",
    backgroundImage: "radial-gradient(rgba(255, 255, 255, 0.08) 1.5px, transparent 1.5px)",
    backgroundSize: "22px 22px",
    display: "flex",
    justifyContent: "center",
    alignItems: "center",
    zIndex: 1000,
    padding: "20px",
    boxSizing: "border-box",
    overflowY: "auto",
  },
  modal: {
    backgroundColor: "#ffffff",
    width: "100%",
    maxWidth: "460px",
    maxHeight: "92vh",       // Límite vertical
    borderRadius: "20px",
    boxShadow: "0 20px 45px rgba(0, 0, 0, 0.35)",
    overflow: "hidden",
    border: "1px solid rgba(255, 255, 255, 0.2)",
    display: "flex",
    flexDirection: "column",
  },
  header: {
    backgroundColor: "#261d60",
    padding: "20px 20px 16px", // Un poco más compacto para ganar espacio vertical
    textAlign: "center",
    color: "white",
    display: "flex",
    flexDirection: "column",
    alignItems: "center",
    flexShrink: 0,
  },
  logoWrapper: {
    width: "56px",
    height: "56px",
    borderRadius: "14px",
    overflow: "hidden",
    marginBottom: "12px",
    cursor: "pointer",
    boxShadow: "0 6px 16px rgba(0,0,0,0.25)",
    border: "1px solid rgba(255, 255, 255, 0.2)",
    display: "flex",
    justifyContent: "center",
    alignItems: "center",
    transition: "transform 0.15s ease",
  },
  logoImg: {
    width: "100%",
    height: "100%",
    objectFit: "cover",
    display: "block",
  },
  title: {
    margin: 0,
    fontSize: "1.55rem",
    fontWeight: "800",
    letterSpacing: "0.3px",
  },
  subtitle: {
    margin: "6px 0 0",
    fontSize: "0.88rem",
    color: "#b0a9d8",
  },
  body: {
    padding: "22px 24px",
    overflowY: "auto",      // Permite scrollear hasta ver el botón de confirmación
    flex: "1 1 auto",
  },
  clockContainer: {
    textAlign: "center",
    backgroundColor: "#f8fafc",
    borderRadius: "14px",
    padding: "18px",
    marginBottom: "20px",
    border: "1px solid #edf0f2",
  },
  timeLabel: {
    fontSize: "0.78rem",
    color: "#64748b",
    textTransform: "uppercase",
    letterSpacing: "1px",
    fontWeight: "700",
  },
  time: {
    fontSize: "2.6rem",
    fontWeight: "800",
    color: "#261d60",
    margin: "4px 0",
    letterSpacing: "1px",
  },
  date: {
    fontSize: "0.92rem",
    color: "#64748b",
    textTransform: "capitalize",
    fontWeight: "500",
  },
  cajeroCard: {
    display: "flex",
    alignItems: "center",
    gap: "12px",
    backgroundColor: "#ffffff",
    border: "1px solid #edf0f2",
    borderRadius: "12px",
    padding: "12px 16px",
    marginBottom: "20px",
  },
  cajeroIcon: {
    width: "38px",
    height: "38px",
    borderRadius: "10px",
    backgroundColor: "#f0edfd",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
  },
  fondoSection: {
    backgroundColor: "#fbfcfe",
    border: "1.5px solid #edf0f4",
    borderRadius: "14px",
    padding: "16px",
    marginBottom: "22px",
  },
  inputLabel: {
    fontSize: "0.85rem",
    fontWeight: "700",
    color: "#334155",
  },
  clearBtn: {
    background: "none",
    border: "none",
    color: "#c62828",
    fontSize: "0.75rem",
    fontWeight: "bold",
    cursor: "pointer",
    padding: 0,
    textDecoration: "underline",
  },
  inputWrapper: {
    display: "flex",
    alignItems: "center",
    backgroundColor: "#ffffff",
    border: "1.5px solid #cbd5e1",
    borderRadius: "10px",
    padding: "0 14px",
    marginBottom: "10px",
  },
  currencySymbol: {
    fontSize: "1.15rem",
    fontWeight: "bold",
    color: "#64748b",
    marginRight: "6px",
  },
  inputFondo: {
    width: "100%",
    padding: "10px 0",
    border: "none",
    outline: "none",
    fontSize: "1.1rem",
    fontWeight: "bold",
    color: "#261d60",
  },
  pillsContainer: {
    display: "flex",
    gap: "6px",
    flexWrap: "wrap",
  },
  pillBtn: {
    backgroundColor: "#ffffff",
    border: "1px solid #cbd5e1",
    borderRadius: "16px",
    padding: "4px 10px",
    fontSize: "0.78rem",
    fontWeight: "600",
    color: "#475569",
    cursor: "pointer",
    transition: "all 0.15s ease",
  },
  error: {
    backgroundColor: "#fee2e2",
    color: "#b91c1c",
    padding: "10px",
    borderRadius: "10px",
    marginBottom: "16px",
    fontSize: "0.85rem",
    textAlign: "center",
    fontWeight: "600",
    border: "1px solid #fecaca",
  },
  button: {
    width: "100%",
    padding: "15px",
    backgroundColor: "#261d60",
    color: "white",
    border: "none",
    borderRadius: "12px",
    fontSize: "1rem",
    fontWeight: "700",
    letterSpacing: "0.5px",
    cursor: "pointer",
    boxShadow: "0 8px 20px rgba(38, 29, 96, 0.25)",
    transition: "transform 0.15s ease",
  },
  buttonContent: {
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    gap: "10px",
  },
};

export default AperturaCaja;