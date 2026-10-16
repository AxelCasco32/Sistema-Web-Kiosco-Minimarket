import React, { useState, useEffect } from "react";
import api from "../services/api"; // O ajustá la ruta según donde tengas configurado axios/fetch

export default function CierreCajaModal({ idTurno, onClose, onCierreExitoso }) {
  const [resumen, setResumen] = useState({ efectivo: 0, tarjeta: 0, cantidad: 0 });
  const [cargando, setCargando] = useState(true);
  const [procesando, setProcesando] = useState(false);

  useEffect(() => {
    const cargarResumen = async () => {
      try {
        const respuesta = await api.get(`/turnos/${idTurno}/resumen`);
        setResumen({
          efectivo: respuesta.data.totalEfectivo,
          tarjeta: respuesta.data.totalTarjeta,
          cantidad: respuesta.data.cantidadVentas
        });
      } catch (error) {
        console.error("Error al cargar el resumen", error);
      } finally {
        setCargando(false);
      }
    };
    cargarResumen();
  }, [idTurno]);

  const confirmarCierre = async () => {
    setProcesando(true);
    try {
      await api.put(`/turnos/cerrar/${idTurno}`, {
        totalEfectivo: resumen.efectivo,
        totalTarjeta: resumen.tarjeta
      });
      onCierreExitoso(); // Llama a la función que desloguea al usuario
    } catch (error) {
      console.error("Error al cerrar el turno", error);
      alert("Hubo un error al cerrar la caja.");
      setProcesando(false);
    }
  };

  return (
    <div style={styles.overlay}>
      <div style={styles.modal}>
        <div style={styles.header}>
          <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
            <rect x="3" y="11" width="18" height="11" rx="2" ry="2"></rect>
            <path d="M7 11V7a5 5 0 0 1 10 0v4"></path>
          </svg>
          <h2 style={styles.title}>Arqueo y Cierre de Caja</h2>
        </div>

        <div style={styles.body}>
          {cargando ? (
            <p style={{ textAlign: "center", color: "#7f8c8d" }}>Calculando totales del turno...</p>
          ) : (
            <>
              <div style={styles.summaryBox}>
                <p style={styles.label}>Total Ventas Realizadas</p>
                <h3 style={styles.value}>{resumen.cantidad}</h3>
              </div>

              <div style={styles.grid}>
                <div style={styles.cardEfectivo}>
                  <p style={styles.label}>Ingresos en Efectivo</p>
                  <h3 style={styles.monto}>${resumen.efectivo.toFixed(2)}</h3>
                </div>
                <div style={styles.cardTarjeta}>
                  <p style={styles.label}>Tarjetas / Transferencias</p>
                  <h3 style={styles.monto}>${resumen.tarjeta.toFixed(2)}</h3>
                </div>
              </div>

              <div style={styles.totalFinal}>
                <span style={styles.labelFinal}>Total del Turno</span>
                <span style={styles.montoFinal}>${(resumen.efectivo + resumen.tarjeta).toFixed(2)}</span>
              </div>

              <p style={styles.warning}>
                Al confirmar, el turno se cerrará en el sistema y se cerrará su sesión automáticamente.
              </p>

              <div style={styles.actions}>
                <button onClick={onClose} disabled={procesando} style={styles.btnCancel}>
                  Cancelar
                </button>
                <button onClick={confirmarCierre} disabled={procesando} style={styles.btnConfirm}>
                  {procesando ? "Cerrando..." : "Confirmar Cierre"}
                </button>
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  );
}

const styles = {
  overlay: {
    position: "fixed", top: 0, left: 0, width: "100%", height: "100%",
    backgroundColor: "rgba(0, 0, 0, 0.6)", backdropFilter: "blur(4px)",
    display: "flex", justifyContent: "center", alignItems: "center", zIndex: 2000,
  },
  modal: {
    backgroundColor: "white", width: "450px", borderRadius: "12px",
    boxShadow: "0 10px 30px rgba(0,0,0,0.3)", overflow: "hidden", fontFamily: "sans-serif",
  },
  header: {
    backgroundColor: "#f39c12", padding: "20px", display: "flex", alignItems: "center", gap: "10px", color: "white",
  },
  title: { margin: 0, fontSize: "1.4rem", fontWeight: "bold" },
  body: { padding: "24px" },
  summaryBox: {
    backgroundColor: "#f8f9fa", padding: "12px", borderRadius: "8px", textAlign: "center", marginBottom: "20px", border: "1px solid #e0e0e0"
  },
  grid: { display: "flex", gap: "15px", marginBottom: "20px" },
  cardEfectivo: {
    flex: 1, backgroundColor: "#e8f5e9", padding: "15px", borderRadius: "8px", border: "1px solid #a5d6a7", textAlign: "center"
  },
  cardTarjeta: {
    flex: 1, backgroundColor: "#e3f2fd", padding: "15px", borderRadius: "8px", border: "1px solid #90caf9", textAlign: "center"
  },
  label: { margin: "0 0 5px 0", fontSize: "0.85rem", color: "#555", textTransform: "uppercase" },
  value: { margin: 0, fontSize: "1.5rem", color: "#2c3e50" },
  monto: { margin: 0, fontSize: "1.4rem", color: "#261d60" },
  totalFinal: {
    display: "flex", justifyContent: "space-between", alignItems: "center", padding: "15px 0", borderTop: "2px solid #eee", borderBottom: "2px solid #eee", marginBottom: "20px"
  },
  labelFinal: { fontSize: "1.1rem", fontWeight: "bold", color: "#2c3e50" },
  montoFinal: { fontSize: "1.8rem", fontWeight: "bold", color: "#261d60" },
  warning: { fontSize: "0.85rem", color: "#c62828", textAlign: "center", marginBottom: "20px", fontStyle: "italic" },
  actions: { display: "flex", gap: "15px" },
  btnCancel: {
    flex: 1, padding: "12px", backgroundColor: "#f5f5f5", color: "#555", border: "1px solid #ccc", borderRadius: "6px", fontWeight: "bold", cursor: "pointer"
  },
  btnConfirm: {
    flex: 2, padding: "12px", backgroundColor: "#261d60", color: "white", border: "none", borderRadius: "6px", fontWeight: "bold", cursor: "pointer"
  }
};