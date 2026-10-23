import { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import api from "../services/api";
import "../styles/common.css";

export default function AuditoriaStock() {
  const [logs, setLogs] = useState([]);
  const [cargando, setCargando] = useState(true);
  const [filtro, setFiltro] = useState("");

  useEffect(() => {
    async function obtenerLogs() {
      try {
        const res = await api.get("/productos/auditorias");
        setLogs(res.data);
      } catch (err) {
        console.error("Error al cargar auditorías:", err);
      } finally {
        setCargando(false);
      }
    }
    obtenerLogs();
  }, []);

  const logsFiltrados = logs.filter((l) =>
    (l.nombre_producto || "").toLowerCase().includes(filtro.toLowerCase()) ||
    (l.nombre_usuario || "").toLowerCase().includes(filtro.toLowerCase()) ||
    (l.campo_modificado || "").toLowerCase().includes(filtro.toLowerCase())
  );

  return (
    <div style={{ backgroundColor: "#f4f6f8", minHeight: "100vh" }}>
      {/* Header Corporativo */}
      <header style={{ display: "flex", justifyContent: "space-between", alignItems: "center", padding: "15px 30px", backgroundColor: "#261d60", color: "white" }}>
        <div style={{ display: "flex", alignItems: "center", gap: "15px" }}>
          <div style={{ backgroundColor: "rgba(255, 255, 255, 0.1)", padding: "10px", borderRadius: "8px", display: "flex" }}>
            <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
              <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"></path>
            </svg>
          </div>
          <div>
            <h1 style={{ margin: 0, fontSize: "1.5rem", fontWeight: "bold" }}>Auditoría de Modificaciones</h1>
            <span style={{ fontSize: "0.85em", opacity: 0.8 }}>Registro histórico de cambios manuales de stock y precios</span>
          </div>
        </div>

        <Link to="/admin" style={{ color: "white", textDecoration: "none", display: "flex", alignItems: "center", gap: "8px", backgroundColor: "rgba(255,255,255,0.15)", padding: "8px 16px", borderRadius: "8px", fontWeight: "bold" }}>
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
            <polyline points="15 18 9 12 15 6"></polyline>
          </svg>
          Volver al Panel
        </Link>
      </header>

      <main style={{ padding: "35px 25px", maxWidth: "1200px", margin: "0 auto" }}>
        <section style={{ backgroundColor: "white", padding: "26px", borderRadius: "14px", border: "1px solid #edf0f2", boxShadow: "0 4px 18px rgba(0,0,0,0.03)" }}>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "20px", flexWrap: "wrap", gap: "15px" }}>
            <div>
              <h2 style={{ margin: 0, color: "#2c3e50", fontSize: "1.25em" }}>Movimientos registrados ({logsFiltrados.length})</h2>
              <p style={{ margin: "4px 0 0 0", color: "#7f8c8d", fontSize: "0.88em" }}>Control interno anti-fraude para modificaciones manuales de productos.</p>
            </div>

            <input
              type="text"
              placeholder="Buscar por producto, admin o campo..."
              value={filtro}
              onChange={(e) => setFiltro(e.target.value)}
              style={{ padding: "8px 16px", borderRadius: "20px", border: "1px solid #dcdde1", fontSize: "0.9em", minWidth: "280px", outline: "none" }}
            />
          </div>

          {cargando ? (
            <p style={{ textAlign: "center", color: "#7f8c8d", padding: "30px 0" }}>Cargando registros de auditoría...</p>
          ) : logsFiltrados.length === 0 ? (
            <p style={{ textAlign: "center", color: "#7f8c8d", padding: "30px 0" }}>No hay registros de modificaciones manuales aún.</p>
          ) : (
            <div style={{ overflowX: "auto" }}>
              <table style={{ width: "100%", borderCollapse: "collapse", textAlign: "left" }}>
                <thead>
                  <tr style={{ backgroundColor: "#261d60", color: "white" }}>
                    <th style={{ padding: "12px 14px", borderRadius: "8px 0 0 0" }}>Fecha y Hora</th>
                    <th style={{ padding: "12px 14px" }}>Admin Responsable</th>
                    <th style={{ padding: "12px 14px" }}>Producto</th>
                    <th style={{ padding: "12px 14px" }}>Campo</th>
                    <th style={{ padding: "12px 14px", textAlign: "center" }}>Valor Anterior</th>
                    <th style={{ padding: "12px 14px", textAlign: "center" }}>Valor Nuevo</th>
                    <th style={{ padding: "12px 14px", borderRadius: "0 8px 0 0", textAlign: "center" }}>Diferencia</th>
                  </tr>
                </thead>
                <tbody>
                  {logsFiltrados.map((log) => {
                    const diff = Number(log.valor_nuevo) - Number(log.valor_anterior);
                    const esPrecio = log.campo_modificado.includes("Precio");

                    return (
                      <tr key={log.id} style={{ borderBottom: "1px solid #f0f0f0" }}>
                        <td style={{ padding: "14px", color: "#2c3e50", fontSize: "0.9em", whiteSpace: "nowrap" }}>
                          {new Date(log.fecha_hora).toLocaleString("es-AR")}
                        </td>
                        <td style={{ padding: "14px", fontWeight: "bold", color: "#261d60" }}>
                          {log.nombre_usuario}
                        </td>
                        <td style={{ padding: "14px", color: "#2c3e50" }}>
                          {log.nombre_producto}
                        </td>
                        <td style={{ padding: "14px" }}>
                          <span style={{ backgroundColor: "#f0edfd", color: "#261d60", padding: "3px 8px", borderRadius: "6px", fontSize: "0.82em", fontWeight: "bold" }}>
                            {log.campo_modificado}
                          </span>
                        </td>
                        <td style={{ padding: "14px", textAlign: "center", color: "#7f8c8d" }}>
                          {esPrecio ? `$${Number(log.valor_anterior).toFixed(2)}` : log.valor_anterior}
                        </td>
                        <td style={{ padding: "14px", textAlign: "center", fontWeight: "bold", color: "#2c3e50" }}>
                          {esPrecio ? `$${Number(log.valor_nuevo).toFixed(2)}` : log.valor_nuevo}
                        </td>
                        <td style={{ padding: "14px", textAlign: "center" }}>
                          <span style={{
                            padding: "3px 10px",
                            borderRadius: "12px",
                            fontSize: "0.85em",
                            fontWeight: "bold",
                            backgroundColor: diff >= 0 ? "#e8f5e9" : "#ffebee",
                            color: diff >= 0 ? "#2e7d32" : "#c62828",
                          }}>
                            {diff >= 0 ? `+${esPrecio ? "$" : ""}${diff}` : `${esPrecio ? "$" : ""}${diff}`}
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