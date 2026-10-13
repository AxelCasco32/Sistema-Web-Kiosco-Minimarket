import { useState, useEffect } from "react";
import api from "../services/api";
import { Link } from "react-router-dom";
import "../styles/common.css";

export default function HistorialVentas() {
  const [ventas, setVentas] = useState([]);
  const [cargando, setCargando] = useState(true);

  useEffect(() => {
    const cargarHistorial = async () => {
      try {
        // En el Sprint 4 el backend devolverá la lista acá
        const respuesta = await api.get('/ventas'); 
        setVentas(respuesta.data);
      } catch (err) {
        console.error("Error al cargar ventas (o backend no conectado aún):", err);
      } finally {
        setCargando(false);
      }
    };
    cargarHistorial();
  }, []);

  return (
    <div className="pagina" style={{ padding: "40px 20px" }}>
      <div className="card" style={{ maxWidth: "1000px", margin: "0 auto", padding: "30px", borderRadius: "12px", boxShadow: "0 4px 15px rgba(0,0,0,0.05)" }}>
        
        {/* Encabezado */}
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "25px", paddingBottom: "15px", borderBottom: "2px solid #f0f0f0" }}>
          <div>
            <h2 style={{ margin: 0, color: "#2c3e50" }}>Historial de Ventas</h2>
            <p style={{ margin: "5px 0 0 0", color: "#7f8c8d", fontSize: "0.9em" }}>Registro de todas las operaciones realizadas por los cajeros.</p>
          </div>
          <Link to="/admin" className="btn-volver-interactivo">
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><line x1="19" y1="12" x2="5" y2="12"></line><polyline points="12 19 5 12 12 5"></polyline></svg>
            Volver al Panel
          </Link>
        </div>

        {/* Tabla de ventas */}
        <div style={{ overflowX: "auto", borderRadius: "8px", border: "1px solid #e9ecef" }}>
          <table style={{ width: "100%", borderCollapse: "collapse", textAlign: "left" }}>
            <thead style={{ backgroundColor: "#f8f9fa", color: "#2c3e50", borderBottom: "2px solid #ddd" }}>
              <tr>
                <th style={{ padding: "12px 15px" }}>Fecha y Hora</th>
                <th style={{ padding: "12px 15px" }}>Cajero</th>
                <th style={{ padding: "12px 15px" }}>Método de Pago</th>
                <th style={{ padding: "12px 15px" }}>Total</th>
                <th style={{ padding: "12px 15px" }}>Detalle (Qué vendió)</th>
              </tr>
            </thead>
            <tbody>
              {cargando ? (
                <tr>
                  <td colSpan="5" style={{ padding: "30px", textAlign: "center", color: "#7f8c8d" }}>Cargando historial...</td>
                </tr>
              ) : ventas.length === 0 ? (
                <tr>
                  <td colSpan="5" style={{ padding: "40px 20px", textAlign: "center" }}>
                    <p style={{ margin: 0, color: "#95a5a6", fontSize: "1.1em" }}>No hay ventas registradas.</p>
                    <p style={{ margin: "5px 0 0 0", color: "#b0bec5", fontSize: "0.85em", fontStyle: "italic" }}>* Nota: Conectar la ruta GET /api/ventas en el backend (Sprint 4).</p>
                  </td>
                </tr>
              ) : (
                ventas.map((venta) => (
                  <tr key={venta.idVenta} className="fila-dashboard-interactiva" style={{ borderBottom: "1px solid #f0f0f0" }}>
                    <td style={{ padding: "12px 15px", color: "#555" }}>{new Date(venta.fecha).toLocaleString()}</td>
                    <td style={{ padding: "12px 15px", fontWeight: "bold", color: "#2c3e50" }}>{venta.Cajero?.Nombre || 'Desconocido'}</td>
                    <td style={{ padding: "12px 15px" }}>
                      <span style={{ backgroundColor: "#e3f2fd", color: "#1565c0", padding: "4px 8px", borderRadius: "4px", fontSize: "0.85em", fontWeight: "bold", textTransform: "capitalize" }}>
                        {venta.metodo_pago}
                      </span>
                    </td>
                    <td style={{ padding: "12px 15px", fontWeight: "bold", color: "#2e7d32" }}>${venta.total}</td>
                    <td style={{ padding: "12px 15px", fontSize: "0.9em", color: "#555" }}>
                      {venta.Detalles?.map(d => `${d.cantidad}x ${d.Producto?.Nombre}`).join(", ") || 'Ver detalle...'}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>

      </div>
    </div>
  );
}