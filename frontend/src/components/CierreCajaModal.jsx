import React, { useState, useEffect } from "react";
import api from "../services/api";

export default function CierreCajaModal({ idTurno, onClose, onCierreExitoso }) {
  const [resumen, setResumen] = useState({
    fondoInicial: 0,
    ventasEfectivo: 0,
    totalEfectivo: 0,
    tarjeta: 0,
    cantidad: 0,
  });
  const [cargando, setCargando] = useState(true);
  const [procesando, setProcesando] = useState(false);

  useEffect(() => {
    const cargarResumen = async () => {
      try {
        const respuesta = await api.get(`/turnos/${idTurno}/resumen`);
        setResumen({
          fondoInicial: Number(respuesta.data.fondoInicial || 0),
          ventasEfectivo: Number(respuesta.data.ventasEfectivo || 0),
          totalEfectivo: Number(respuesta.data.totalEfectivo || 0),
          tarjeta: Number(respuesta.data.totalTarjeta || 0),
          cantidad: Number(respuesta.data.cantidadVentas || 0),
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
        totalEfectivo: resumen.totalEfectivo,
        totalTarjeta: resumen.tarjeta,
      });

      localStorage.removeItem("id_turno");
      onCierreExitoso();
    } catch (error) {
      console.error("Error al cerrar el turno", error);
      alert("Hubo un error al cerrar la caja.");
      setProcesando(false);
    }
  };

  const totalFacturadoTurno = resumen.ventasEfectivo + resumen.tarjeta;

  return (
    <div style={styles.overlay}>
      <div style={styles.modal}>
        {/* HEADER MODAL */}
        <div style={styles.header}>
          <div style={styles.headerIcon}>
            <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
              <rect x="3" y="11" width="18" height="11" rx="2" ry="2"></rect>
              <path d="M7 11V7a5 5 0 0 1 10 0v4"></path>
            </svg>
          </div>
          <div>
            <h2 style={styles.title}>Arqueo y Cierre de Turno</h2>
            <p style={styles.subtitle}>Verificá los valores antes de finalizar</p>
          </div>
        </div>

        <div style={styles.body}>
          {cargando ? (
            <p style={{ textAlign: "center", color: "#7f8c8d", padding: "30px 0" }}>
              Calculando totales y balance de caja...
            </p>
          ) : (
            <>
              {/* RESUMEN DE ROTACIÓN */}
              <div style={styles.summaryBar}>
                <span>Ventas registradas en el turno:</span>
                <strong style={{ color: "#261d60", fontSize: "1.1em" }}>
                  {resumen.cantidad} {resumen.cantidad === 1 ? "operación" : "operaciones"}
                </strong>
              </div>

              {/* TARJETA DESGLOSE EFECTIVO EN CAJÓN */}
              <div style={styles.cardEfectivo}>
                <div style={styles.cardHeaderEfectivo}>
                  <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
                    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#2e7d32" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
                      <rect x="2" y="6" width="20" height="12" rx="2"></rect>
                      <circle cx="12" cy="12" r="2"></circle>
                      <path d="M6 12h.01M18 12h.01"></path>
                    </svg>
                    <strong style={{ color: "#1b5e20", fontSize: "0.95em" }}>Efectivo Físico en Cajón</strong>
                  </div>
                  <strong style={{ fontSize: "1.25em", color: "#1b5e20" }}>
                    ${resumen.totalEfectivo.toFixed(2)}
                  </strong>
                </div>

                <div style={styles.desgloseList}>
                  <div style={styles.desgloseRow}>
                    <span style={styles.desgloseLabel}>• Fondo inicial (apertura):</span>
                    <span style={styles.desgloseValor}>${resumen.fondoInicial.toFixed(2)}</span>
                  </div>
                  <div style={styles.desgloseRow}>
                    <span style={styles.desgloseLabel}>• Ventas en efectivo cobradas:</span>
                    <span style={styles.desgloseValor}>+${resumen.ventasEfectivo.toFixed(2)}</span>
                  </div>
                </div>
              </div>

              {/* TARJETA DIGITAL / POSNET */}
              <div style={styles.cardTarjeta}>
                <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
                  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#1565c0" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
                    <rect x="1" y="4" width="22" height="16" rx="2" ry="2"></rect>
                    <line x1="1" y1="10" x2="23" y2="10"></line>
                  </svg>
                  <strong style={{ color: "#0d47a1", fontSize: "0.95em" }}>Medios Electrónicos / POSNET</strong>
                </div>
                <strong style={{ fontSize: "1.25em", color: "#0d47a1" }}>
                  ${resumen.tarjeta.toFixed(2)}
                </strong>
              </div>

              {/* TOTAL FACTURADO (INGRESOS NETOS DEL TURNO) */}
              <div style={styles.totalFinal}>
                <div>
                  <span style={styles.labelFinal}>Total Facturado</span>
                  <p style={{ margin: "2px 0 0", fontSize: "0.8em", color: "#7f8c8d" }}>
                    (Ventas efect. + electrónicas)
                  </p>
                </div>
                <span style={styles.montoFinal}>
                  ${totalFacturadoTurno.toFixed(2)}
                </span>
              </div>

              <div style={styles.warningBox}>
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#b91c1c" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" style={{ flexShrink: 0 }}>
                  <circle cx="12" cy="12" r="10"></circle>
                  <line x1="12" y1="8" x2="12" y2="12"></line>
                  <line x1="12" y1="16" x2="12.01" y2="16"></line>
                </svg>
                <span>
                  Al confirmar el arqueo, la caja se bloqueará y se cerrará la sesión del turno de forma irreversible.
                </span>
              </div>

              {/* BOTONERA */}
              <div style={styles.actions}>
                <button
                  type="button"
                  onClick={onClose}
                  disabled={procesando}
                  style={styles.btnCancel}
                >
                  Cancelar y Volver
                </button>
                <button
                  type="button"
                  onClick={confirmarCierre}
                  disabled={procesando}
                  style={{
                    ...styles.btnConfirm,
                    opacity: procesando ? 0.75 : 1,
                    cursor: procesando ? "not-allowed" : "pointer",
                  }}
                >
                  {procesando ? "Guardando cierre..." : "Confirmar Cierre"}
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
    position: "fixed",
    top: 0,
    left: 0,
    width: "100%",
    height: "100%",
    backgroundColor: "rgba(15, 12, 41, 0.75)",
    backdropFilter: "blur(5px)",
    display: "flex",
    justifyContent: "center",
    alignItems: "center",
    zIndex: 2000,
    padding: "20px",
    boxSizing: "border-box", // Evita desbordes por padding
    overflowY: "auto",       // Permite scroll si la pantalla es enana
  },
  modal: {
    backgroundColor: "#ffffff",
    width: "100%",
    maxWidth: "480px",
    maxHeight: "90vh",       // Nunca supera el 90% del alto de la ventana
    borderRadius: "20px",
    boxShadow: "0 25px 50px rgba(0, 0, 0, 0.35)",
    overflow: "hidden",
    border: "1px solid #edf0f2",
    display: "flex",         // Mantiene el header arriba
    flexDirection: "column",
  },
  header: {
    backgroundColor: "#261d60",
    padding: "18px 24px",
    display: "flex",
    alignItems: "center",
    gap: "14px",
    color: "white",
    borderBottom: "3px solid #f39c12",
    flexShrink: 0,          // No se achica nunca
  },
  headerIcon: {
    width: "42px",
    height: "42px",
    borderRadius: "12px",
    backgroundColor: "rgba(243, 156, 18, 0.2)",
    color: "#f39c12",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    flexShrink: 0,
  },
  title: {
    margin: 0,
    fontSize: "1.35rem",
    fontWeight: "800",
  },
  subtitle: {
    margin: "3px 0 0",
    fontSize: "0.85rem",
    color: "#b0a9d8",
  },
  body: {
    padding: "24px",
    overflowY: "auto",      // Activa scroll interno si no entra todo
    flex: "1 1 auto",
  },
  summaryBar: {
    display: "flex",
    justifyContent: "space-between",
    alignItems: "center",
    backgroundColor: "#f8fafc",
    padding: "10px 16px",
    borderRadius: "10px",
    border: "1px solid #edf0f2",
    marginBottom: "16px",
    fontSize: "0.9em",
    color: "#64748b",
  },
  cardEfectivo: {
    backgroundColor: "#f0fdf4",
    border: "1.5px solid #bbf7d0",
    borderRadius: "12px",
    padding: "14px 16px",
    marginBottom: "12px",
  },
  cardHeaderEfectivo: {
    display: "flex",
    justifyContent: "space-between",
    alignItems: "center",
    borderBottom: "1px dashed #86efac",
    paddingBottom: "8px",
    marginBottom: "8px",
  },
  desgloseList: {
    display: "flex",
    flexDirection: "column",
    gap: "4px",
    paddingLeft: "4px",
  },
  desgloseRow: {
    display: "flex",
    justifyContent: "space-between",
    fontSize: "0.85em",
  },
  desgloseLabel: {
    color: "#374151",
  },
  desgloseValor: {
    fontWeight: "700",
    color: "#166534",
  },
  cardTarjeta: {
    display: "flex",
    justifyContent: "space-between",
    alignItems: "center",
    backgroundColor: "#eff6ff",
    border: "1.5px solid #bfdbfe",
    borderRadius: "12px",
    padding: "14px 16px",
    marginBottom: "18px",
  },
  totalFinal: {
    display: "flex",
    justifyContent: "space-between",
    alignItems: "center",
    padding: "16px 0",
    borderTop: "2px solid #edf0f2",
    borderBottom: "2px solid #edf0f2",
    marginBottom: "16px",
  },
  labelFinal: {
    fontSize: "1.1rem",
    fontWeight: "800",
    color: "#1e293b",
    display: "block",
  },
  montoFinal: {
    fontSize: "1.85rem",
    fontWeight: "900",
    color: "#261d60",
  },
  warningBox: {
    display: "flex",
    alignItems: "center",
    gap: "10px",
    backgroundColor: "#fef2f2",
    border: "1px solid #fecaca",
    color: "#b91c1c",
    padding: "10px 14px",
    borderRadius: "10px",
    fontSize: "0.82em",
    lineHeight: "1.35",
    marginBottom: "20px",
  },
  actions: {
    display: "flex",
    gap: "12px",
  },
  btnCancel: {
    flex: 1,
    padding: "12px",
    backgroundColor: "#ffffff",
    color: "#64748b",
    border: "1.5px solid #cbd5e1",
    borderRadius: "10px",
    fontWeight: "700",
    fontSize: "0.9em",
    cursor: "pointer",
    transition: "all 0.15s ease",
  },
  btnConfirm: {
    flex: 1.6,
    padding: "12px",
    backgroundColor: "#261d60",
    color: "#ffffff",
    border: "none",
    borderRadius: "10px",
    fontWeight: "700",
    fontSize: "0.95em",
    boxShadow: "0 6px 16px rgba(38, 29, 96, 0.25)",
    transition: "all 0.15s ease",
  },
};