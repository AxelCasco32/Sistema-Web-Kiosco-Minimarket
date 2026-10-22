import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext"; // <-- Traemos el contexto de sesión

const AperturaCaja = () => {
  const [horaActual, setHoraActual] = useState(new Date());
  const [cargando, setCargando] = useState(false);
  const [error, setError] = useState("");
  
  const navigate = useNavigate();
  const { usuario } = useAuth(); // <-- Sacamos el usuario logueado

  // Buscamos el ID del usuario según cómo venga de tu base de datos
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
        body: JSON.stringify({ id_Usuario: idCajero }), // <-- Mandamos el ID real a la BD
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
        <div style={styles.header}>
          <h2 style={styles.title}>Apertura de Caja</h2>
          <p style={styles.subtitle}>Inicie su turno para comenzar a operar</p>
        </div>

        <div style={styles.body}>
          <div style={styles.clockContainer}>
            <span style={styles.timeLabel}>Hora de Apertura</span>
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

          <div style={styles.infoBox}>
            <p style={{ margin: "0 0 8px 0" }}>
              <strong>Cajero:</strong> {usuario?.nombre || usuario?.Nombre || "Usuario"} (ID: {idCajero})
            </p>
            <p style={{ margin: 0 }}>
              <strong>Estado Inicial:</strong> Efectivo y Tarjetas en $0.00
            </p>
          </div>

          {error && <div style={styles.error}>{error}</div>}

          <button
            onClick={handleAbrirCaja}
            disabled={cargando}
            style={{ ...styles.button, opacity: cargando ? 0.7 : 1 }}
          >
            {cargando ? (
              "Abriendo Turno..."
            ) : (
              <div style={styles.buttonContent}>
                <svg 
                  width="22" 
                  height="22" 
                  viewBox="0 0 24 24" 
                  fill="none" 
                  stroke="currentColor" 
                  strokeWidth="2" 
                  strokeLinecap="round" 
                  strokeLinejoin="round"
                >
                  <rect x="3" y="11" width="18" height="11" rx="2" ry="2"></rect>
                  <path d="M7 11V7a5 5 0 0 1 9.9-1"></path>
                </svg>
                ABRIR CAJA
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
    position: "fixed", top: 0, left: 0, width: "100%", height: "100%",
    backgroundColor: "rgba(0, 0, 0, 0.6)", backdropFilter: "blur(4px)",
    display: "flex", justifyContent: "center", alignItems: "center", zIndex: 1000,
  },
  modal: {
    backgroundColor: "white", width: "420px", borderRadius: "16px",
    boxShadow: "0 10px 30px rgba(0,0,0,0.3)", overflow: "hidden", fontFamily: "sans-serif",
  },
  header: {
    backgroundColor: "#261d60", padding: "24px", textAlign: "center", color: "white",
  },
  title: { margin: 0, fontSize: "1.5rem", fontWeight: "bold" },
  subtitle: { margin: "8px 0 0", fontSize: "0.9rem", opacity: 0.8 },
  body: { padding: "30px" },
  clockContainer: {
    textAlign: "center", backgroundColor: "#f8f9fa", borderRadius: "12px",
    padding: "20px", marginBottom: "24px", border: "1px solid #e0e0e0",
  },
  timeLabel: { fontSize: "0.85rem", color: "#666", textTransform: "uppercase", letterSpacing: "1px" },
  time: { fontSize: "3rem", fontWeight: "bold", color: "#261d60", margin: "10px 0" },
  date: { fontSize: "1rem", color: "#444", textTransform: "capitalize" },
  infoBox: {
    backgroundColor: "#f3e5f5", padding: "15px", borderRadius: "8px",
    marginBottom: "24px", fontSize: "0.95rem", color: "#4a148c", borderLeft: "4px solid #261d60",
  },
  error: {
    backgroundColor: "#ffebee", color: "#d32f2f", padding: "12px",
    borderRadius: "8px", marginBottom: "20px", fontSize: "0.9rem", textAlign: "center",
  },
  button: {
    width: "100%", padding: "16px", backgroundColor: "#261d60", color: "white",
    border: "none", borderRadius: "8px", fontSize: "1.1rem", fontWeight: "bold",
    cursor: "pointer", transition: "background 0.3s",
  },
  buttonContent: {
    display: "flex", alignItems: "center", justifyContent: "center", gap: "8px",
  }
};

export default AperturaCaja;