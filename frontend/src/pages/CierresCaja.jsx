// pages/CierresCaja.jsx
// Pantalla exclusiva del Administrador: historial de turnos de caja con el
// usuario responsable, lo esperado por sistema, lo contado físicamente y la
// diferencia (faltante / sobrante) de cada cierre.
import { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import api from "../services/api";
import "../styles/common.css";

const pesos = (valor) => `$${Number(valor || 0).toFixed(2)}`;

function nombreResponsable(turno) {
  const u = turno.Usuario;
  if (!u) return `Usuario #${turno.id_Usuario}`;
  return `${u.Nombre || ""} ${u.Apellido || ""}`.trim() || u.Usuario;
}

export default function CierresCaja() {
  const [turnos, setTurnos] = useState([]);
  const [cargando, setCargando] = useState(true);
  const [error, setError] = useState("");
  const [filtro, setFiltro] = useState("");
  const [soloFaltantes, setSoloFaltantes] = useState(false);

  useEffect(() => {
    async function obtenerTurnos() {
      try {
        const res = await api.get("/turnos");
        setTurnos(res.data);
      } catch (err) {
        console.error("Error al cargar los cierres de caja:", err);
        setError(err.response?.data?.error || "No se pudieron cargar los cierres de caja.");
      } finally {
        setCargando(false);
      }
    }
    obtenerTurnos();
  }, []);

  const turnosFiltrados = turnos.filter((t) => {
    if (soloFaltantes && !(Number(t.Diferencia) < 0)) return false;
    return nombreResponsable(t).toLowerCase().includes(filtro.toLowerCase());
  });

  const totalFaltantes = turnos
    .filter((t) => Number(t.Diferencia) < 0)
    .reduce((acc, t) => acc + Number(t.Diferencia), 0);

  const th = { padding: "12px 14px", whiteSpace: "nowrap" };
  const td = { padding: "14px", color: "#2c3e50", fontSize: "0.9em", whiteSpace: "nowrap" };

  return (
    <div style={{ backgroundColor: "#f4f6f8", minHeight: "100vh" }}>
      <header style={{ display: "flex", justifyContent: "space-between", alignItems: "center", flexWrap: "wrap", gap: "12px", padding: "15px 20px", backgroundColor: "#261d60", color: "white" }}>
        <div style={{ display: "flex", alignItems: "center", gap: "15px" }}>
          <div style={{ backgroundColor: "rgba(255, 255, 255, 0.1)", padding: "10px", borderRadius: "8px", display: "flex" }}>
            <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
              <rect x="2" y="6" width="20" height="12" rx="2"></rect>
              <circle cx="12" cy="12" r="2"></circle>
            </svg>
          </div>
          <div>
            <h1 style={{ margin: 0, fontSize: "1.4rem", fontWeight: "bold" }}>Cierres de Caja</h1>
            <span style={{ fontSize: "0.85em", opacity: 0.8 }}>Arqueos por turno, responsable y faltantes</span>
          </div>
        </div>

        <Link to="/admin" style={{ color: "white", textDecoration: "none", display: "flex", alignItems: "center", gap: "8px", backgroundColor: "rgba(255,255,255,0.15)", padding: "8px 16px", borderRadius: "8px", fontWeight: "bold" }}>
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
            <polyline points="15 18 9 12 15 6"></polyline>
          </svg>
          Volver al Panel
        </Link>
      </header>

      <main style={{ padding: "25px 16px", maxWidth: "1200px", margin: "0 auto" }}>
        <section style={{ backgroundColor: "white", padding: "22px", borderRadius: "14px", border: "1px solid #edf0f2", boxShadow: "0 4px 18px rgba(0,0,0,0.03)" }}>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "20px", flexWrap: "wrap", gap: "15px" }}>
            <div>
              <h2 style={{ margin: 0, color: "#2c3e50", fontSize: "1.2em" }}>Turnos registrados ({turnosFiltrados.length})</h2>
              <p style={{ margin: "4px 0 0 0", color: "#7f8c8d", fontSize: "0.88em" }}>
                Faltantes acumulados: <strong style={{ color: "#c62828" }}>{pesos(Math.abs(totalFaltantes))}</strong>
              </p>
            </div>

            <div style={{ display: "flex", gap: "12px", alignItems: "center", flexWrap: "wrap" }}>
              <label style={{ display: "flex", alignItems: "center", gap: "6px", color: "#2c3e50", fontSize: "0.9em", cursor: "pointer" }}>
                <input type="checkbox" checked={soloFaltantes} onChange={(e) => setSoloFaltantes(e.target.checked)} />
                Solo con faltante
              </label>
              <input
                type="text"
                placeholder="Buscar por usuario..."
                value={filtro}
                onChange={(e) => setFiltro(e.target.value)}
                style={{ padding: "8px 16px", borderRadius: "20px", border: "1px solid #dcdde1", fontSize: "0.9em", minWidth: "220px", maxWidth: "100%", outline: "none" }}
              />
            </div>
          </div>

          {cargando ? (
            <p style={{ textAlign: "center", color: "#7f8c8d", padding: "30px 0" }}>Cargando cierres de caja...</p>
          ) : error ? (
            <p style={{ textAlign: "center", color: "#c62828", padding: "30px 0" }}>{error}</p>
          ) : turnosFiltrados.length === 0 ? (
            <p style={{ textAlign: "center", color: "#7f8c8d", padding: "30px 0" }}>No hay turnos para mostrar.</p>
          ) : (
            <div style={{ overflowX: "auto" }}>
              <table style={{ width: "100%", borderCollapse: "collapse", textAlign: "left" }}>
                <thead>
                  <tr style={{ backgroundColor: "#261d60", color: "white" }}>
                    <th style={{ ...th, borderRadius: "8px 0 0 0" }}>Turno</th>
                    <th style={th}>Responsable</th>
                    <th style={th}>Apertura</th>
                    <th style={th}>Cierre</th>
                    <th style={{ ...th, textAlign: "right" }}>Fondo inicial</th>
                    <th style={{ ...th, textAlign: "right" }}>Efectivo esperado</th>
                    <th style={{ ...th, textAlign: "right" }}>Efectivo contado</th>
                    <th style={{ ...th, textAlign: "right" }}>Electrónicos</th>
                    <th style={{ ...th, textAlign: "center", borderRadius: "0 8px 0 0" }}>Diferencia</th>
                  </tr>
                </thead>
                <tbody>
                  {turnosFiltrados.map((t) => {
                    const abierto = t.Estado !== "Cerrado";
                    const tieneArqueo = t.Diferencia !== null && t.Diferencia !== undefined;
                    const diff = Number(t.Diferencia || 0);

                    let badge = { texto: "Sin arqueo", bg: "#f0f0f0", color: "#7f8c8d" };
                    if (abierto) badge = { texto: "Turno abierto", bg: "#fff8e1", color: "#8d6e00" };
                    else if (tieneArqueo && diff < -0.005) badge = { texto: `Faltante -${pesos(Math.abs(diff))}`, bg: "#ffebee", color: "#c62828" };
                    else if (tieneArqueo && diff > 0.005) badge = { texto: `Sobrante +${pesos(diff)}`, bg: "#e3f2fd", color: "#1565c0" };
                    else if (tieneArqueo) badge = { texto: "Exacta", bg: "#e8f5e9", color: "#2e7d32" };

                    return (
                      <tr key={t.idturnos_caja} style={{ borderBottom: "1px solid #f0f0f0" }}>
                        <td style={{ ...td, fontWeight: "bold" }}>#{t.idturnos_caja}</td>
                        <td style={{ ...td, fontWeight: "bold", color: "#261d60" }}>{nombreResponsable(t)}</td>
                        <td style={td}>{t.Hora_Apertura ? new Date(t.Hora_Apertura).toLocaleString("es-AR") : "-"}</td>
                        <td style={td}>{t.Hora_Cierre ? new Date(t.Hora_Cierre).toLocaleString("es-AR") : "-"}</td>
                        <td style={{ ...td, textAlign: "right" }}>{pesos(t.Fondo_Inicial)}</td>
                        <td style={{ ...td, textAlign: "right" }}>{abierto ? "-" : pesos(t.Total_Efectivo)}</td>
                        <td style={{ ...td, textAlign: "right" }}>{tieneArqueo ? pesos(t.Efectivo_Contado) : "-"}</td>
                        <td style={{ ...td, textAlign: "right" }}>{abierto ? "-" : pesos(t.Total_Tarjeta)}</td>
                        <td style={{ ...td, textAlign: "center" }}>
                          <span style={{ padding: "3px 10px", borderRadius: "12px", fontSize: "0.85em", fontWeight: "bold", backgroundColor: badge.bg, color: badge.color }}>
                            {badge.texto}
                          </span>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}
        </section>
      </main>
    </div>
  );
}
