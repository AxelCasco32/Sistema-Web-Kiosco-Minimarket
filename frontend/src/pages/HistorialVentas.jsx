import { useState, useEffect } from "react";
import api from "../services/api";
import { imprimirTicket } from "../utils/ticket";
import "../styles/common.css";

// Reimprime el ticket de una venta del historial
function reimprimir(venta) {
  imprimirTicket({
    idVenta: venta.idVenta,
    fecha: venta.fecha,
    cajero: venta.Cajero?.Nombre,
    cliente: venta.cliente,
    items: (venta.Detalles || []).map((d) => ({
      nombre: d.Producto?.Nombre,
      cantidad: d.cantidad,
      precio: d.precio_unitario ?? (Number(d.subtotal) / Number(d.cantidad || 1)),
    })),
    total: venta.total,
    medioPago: venta.metodo_pago,
    montoRecibido: venta.monto_recibido,
    vuelto: venta.vuelto,
  });
}

export default function HistorialVentas() {
  const [ventas, setVentas] = useState([]);
  const [cargando, setCargando] = useState(true);

  useEffect(() => {
    const cargarHistorial = async () => {
      try {
        const respuesta = await api.get('/ventas'); 
        setVentas(respuesta.data);
      } catch (err) {
        console.error("Error al cargar ventas:", err);
      } finally {
        setCargando(false);
      }
    };
    cargarHistorial();
  }, []);

  return (
    <div className="r-pagina" style={styles.pageContainer}>
      <div className="r-card" style={styles.card}>
        
        {/* Encabezado */}
        <div className="r-encabezado" style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "25px", paddingBottom: "20px", borderBottom: "2px solid #f0f0f0" }}>
          <div style={{ display: "flex", alignItems: "center", gap: "15px" }}>
            <div style={{ backgroundColor: "rgba(38, 29, 96, 0.1)", padding: "10px", borderRadius: "8px", display: "flex" }}>
              <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="#261d60" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"></path><polyline points="14 2 14 8 20 8"></polyline><line x1="16" y1="13" x2="8" y2="13"></line><line x1="16" y1="17" x2="8" y2="17"></line><polyline points="10 9 9 9 8 9"></polyline></svg>
            </div>
            <div>
              <h2 style={{ margin: 0, color: "#261d60" }}>Historial de Ventas</h2>
              <p style={{ margin: "5px 0 0 0", color: "#7f8c8d", fontSize: "0.9em" }}>Registro de todas las operaciones realizadas.</p>
            </div>
          </div>
        </div>

        {/* Tabla de ventas */}
        <div style={{ overflowX: "auto", borderRadius: "8px", border: "1px solid #e9ecef", boxShadow: "0 2px 4px rgba(0,0,0,0.02)" }}>
          <table className="r-tabla" style={{ width: "100%", borderCollapse: "collapse", textAlign: "left" }}>
            <thead style={{ backgroundColor: "#261d60", color: "white" }}>
              <tr>
                <th style={{ padding: "15px", fontWeight: "normal", letterSpacing: "0.5px", fontSize: "0.95em" }}>Fecha y Hora</th>
                <th style={{ padding: "15px", fontWeight: "normal", letterSpacing: "0.5px", fontSize: "0.95em" }}>Cajero</th>
                <th style={{ padding: "15px", fontWeight: "normal", letterSpacing: "0.5px", fontSize: "0.95em" }}>Método de Pago</th>
                <th style={{ padding: "15px", fontWeight: "normal", letterSpacing: "0.5px", fontSize: "0.95em" }}>Total</th>
                <th style={{ padding: "15px", fontWeight: "normal", letterSpacing: "0.5px", fontSize: "0.95em" }}>Detalle</th>
                <th style={{ padding: "15px", fontWeight: "normal", letterSpacing: "0.5px", fontSize: "0.95em", textAlign: "center" }}>Ticket</th>
              </tr>
            </thead>
            <tbody>
              {cargando ? (
                <tr>
                  <td colSpan="6" style={{ padding: "40px", textAlign: "center", color: "#7f8c8d" }}>
                    <div style={{ display: "flex", justifyContent: "center", alignItems: "center", gap: "10px" }}>
                      <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="spin"><line x1="12" y1="2" x2="12" y2="6"></line><line x1="12" y1="18" x2="12" y2="22"></line><line x1="4.93" y1="4.93" x2="7.76" y2="7.76"></line><line x1="16.24" y1="16.24" x2="19.07" y2="19.07"></line><line x1="2" y1="12" x2="6" y2="12"></line><line x1="18" y1="12" x2="22" y2="12"></line><line x1="4.93" y1="19.07" x2="7.76" y2="16.24"></line><line x1="16.24" y1="7.76" x2="19.07" y2="4.93"></line></svg>
                      Cargando historial...
                    </div>
                  </td>
                </tr>
              ) : ventas.length === 0 ? (
                <tr>
                  <td colSpan="6" style={{ padding: "50px 20px", textAlign: "center" }}>
                    <svg width="40" height="40" viewBox="0 0 24 24" fill="none" stroke="#dcdde1" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" style={{ marginBottom: "15px" }}><rect x="3" y="3" width="18" height="18" rx="2" ry="2"></rect><line x1="3" y1="9" x2="21" y2="9"></line><line x1="9" y1="21" x2="9" y2="9"></line></svg>
                    <p style={{ margin: 0, color: "#95a5a6", fontSize: "1.1em", fontWeight: "bold" }}>No hay ventas registradas.</p>
                  </td>
                </tr>
              ) : (
                ventas.map((venta, index) => (
                  <tr key={venta.idVenta} style={{ backgroundColor: index % 2 === 0 ? "white" : "#f8f9fa", borderBottom: "1px solid #f0f0f0", transition: "background 0.2s" }} onMouseOver={(e) => e.currentTarget.style.backgroundColor = "#e6e4f4"} onMouseOut={(e) => e.currentTarget.style.backgroundColor = index % 2 === 0 ? "white" : "#f8f9fa"}>
                    <td style={{ padding: "14px 15px", color: "#555", fontSize: "0.95em" }}>{new Date(venta.fecha).toLocaleString()}</td>
                    <td style={{ padding: "14px 15px", fontWeight: "bold", color: "#2c3e50" }}>{venta.Cajero?.Nombre || 'Desconocido'}</td>
                    <td style={{ padding: "14px 15px" }}>
                      {/* Insignia dinámica según método de pago */}
                      <span style={{ 
                        backgroundColor: venta.metodo_pago === 'efectivo' ? "#e8f5e9" : "#e3f2fd", 
                        color: venta.metodo_pago === 'efectivo' ? "#2e7d32" : "#1565c0", 
                        padding: "6px 12px", borderRadius: "20px", fontSize: "0.85em", fontWeight: "bold", textTransform: "capitalize", border: `1px solid ${venta.metodo_pago === 'efectivo' ? '#c8e6c9' : '#90caf9'}` 
                      }}>
                        {venta.metodo_pago}
                      </span>
                    </td>
                    <td style={{ padding: "14px 15px", fontWeight: "bold", color: "#261d60", fontSize: "1.05em" }}>${venta.total}</td>
                    <td style={{ padding: "14px 15px", fontSize: "0.9em", color: "#555" }}>
                      {venta.Detalles?.map(d => `${d.cantidad}x ${d.Producto?.Nombre}`).join(", ") || 'Ver detalle...'}
                    </td>
                    <td style={{ padding: "14px 15px", textAlign: "center" }}>
                      <button
                        type="button"
                        onClick={() => reimprimir(venta)}
                        title="Reimprimir el ticket de esta venta"
                        style={{ display: "inline-flex", alignItems: "center", gap: "6px", padding: "6px 12px", borderRadius: "8px", border: "1px solid #261d60", backgroundColor: "white", color: "#261d60", fontWeight: "bold", fontSize: "0.85em", cursor: "pointer", whiteSpace: "nowrap" }}
                      >
                        <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.4" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true"><polyline points="6 9 6 2 18 2 18 9" /><path d="M6 18H4a2 2 0 0 1-2-2v-5a2 2 0 0 1 2-2h16a2 2 0 0 1 2 2v5a2 2 0 0 1-2 2h-2" /><rect x="6" y="14" width="12" height="8" /></svg>
                        Imprimir
                      </button>
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

const styles = {
  pageContainer: { backgroundColor: "#f4f6f8", minHeight: "100vh", padding: "40px 20px" },
  card: { maxWidth: "1000px", margin: "0 auto", padding: "35px", borderRadius: "12px", boxShadow: "0 4px 15px rgba(0,0,0,0.05)", border: "1px solid #f0f0f0", backgroundColor: "white" },
  actionBtnOutline: { backgroundColor: "transparent", color: "#261d60", padding: "8px 16px", border: "2px solid #261d60", borderRadius: "8px", fontSize: "0.95rem", fontWeight: "bold", cursor: "pointer", display: "flex", justifyContent: "center", alignItems: "center", gap: "8px", textDecoration: "none", transition: "background 0.2s" }
};