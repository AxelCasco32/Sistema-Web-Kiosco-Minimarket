import { useState } from "react";
import api from "../services/api";
import { Link } from "react-router-dom";
import "../styles/common.css";

export default function CrearProducto() {
  const [nombre, setNombre] = useState("");
  const [codigo, setCodigo] = useState("");
  const [precio, setPrecio] = useState("");
  const [costo, setCosto] = useState("");
  const [stock, setStock] = useState("");
  const [mensaje, setMensaje] = useState("");
  const [error, setError] = useState("");

  const handleSubmit = async (event) => {
    event.preventDefault();
    setMensaje("");
    setError("");

    try {
      await api.post('/productos', {
        Nombre: nombre,
        Cod_barra: codigo,
        Precio_Venta: Number(precio),
        Precio_costo: Number(costo),
        Stock: Number(stock)
      });

      setMensaje(`¡El producto "${nombre}" se guardó correctamente!`);
      setNombre("");
      setCodigo("");
      setPrecio("");
      setCosto("");
      setStock("");
    } catch (err) {
      console.error(err);
      setError("Error al crear el producto. Revisá que todos los datos sean correctos.");
    }
  };

  return (
    <div style={styles.pageContainer}>
      <div style={styles.card}>
        {/* ENCABEZADO CON ÍCONO DE VOLVER */}
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", paddingBottom: "20px", borderBottom: "2px solid #f0f0f0", marginBottom: "25px" }}>
          <h2 style={{ margin: 0, color: "#2c3e50", display: "flex", alignItems: "center", gap: "10px" }}>
            <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="#261d60" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><circle cx="9" cy="21" r="1"></circle><circle cx="20" cy="21" r="1"></circle><path d="M1 1h4l2.68 13.39a2 2 0 0 0 2 1.61h9.72a2 2 0 0 0 2-1.61L23 6H6"></path></svg>
            Registrar Producto
          </h2>
          <Link to="/admin" style={styles.actionBtnOutline} onMouseOver={(e) => { e.currentTarget.style.backgroundColor = "#e6e4f4"; }} onMouseOut={(e) => { e.currentTarget.style.backgroundColor = "transparent"; }}>
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><line x1="19" y1="12" x2="5" y2="12"></line><polyline points="12 19 5 12 12 5"></polyline></svg>
            Volver al Panel
          </Link>
        </div>
        
        {mensaje && <div style={{ backgroundColor: "#e8f5e9", color: "#2e7d32", padding: "12px", borderRadius: "8px", fontWeight: "bold", border: "1px solid #c8e6c9", marginBottom: "20px" }}>{mensaje}</div>}
        {error && <div style={{ backgroundColor: "#ffebee", color: "#c62828", padding: "12px", borderRadius: "8px", fontWeight: "bold", border: "1px solid #ffcdd2", marginBottom: "20px" }}>{error}</div>}

        {/* FORMULARIO DE REGISTRO */}
        <form onSubmit={handleSubmit} style={{ display: "flex", flexDirection: "column", gap: "18px" }}>
          <div style={{ display: "flex", flexDirection: "column", gap: "6px" }}>
            <label style={{ fontWeight: "bold", color: "#2c3e50", fontSize: "0.95em" }}>Nombre del producto:</label>
            <input style={styles.inputOverride} type="text" placeholder="Ej: Coca Cola 2.25L" value={nombre} onChange={(e) => setNombre(e.target.value)} required />
          </div>

          <div style={{ display: "flex", flexDirection: "column", gap: "6px" }}>
            <label style={{ fontWeight: "bold", color: "#2c3e50", fontSize: "0.95em" }}>Código de barras (Opcional):</label>
            <input style={styles.inputOverride} type="text" placeholder="Ej: 7791234567890" value={codigo} onChange={(e) => setCodigo(e.target.value)} />
          </div>

          <div style={{ display: 'flex', gap: '20px' }}>
            <div style={{ flex: 1, display: "flex", flexDirection: "column", gap: "6px" }}>
              <label style={{ fontWeight: "bold", color: "#2c3e50", fontSize: "0.95em" }}>Precio Venta ($):</label>
              <input style={styles.inputOverride} type="number" min="0" step="0.01" placeholder="0.00" value={precio} onChange={(e) => setPrecio(e.target.value)} required />
            </div>
            <div style={{ flex: 1, display: "flex", flexDirection: "column", gap: "6px" }}>
              <label style={{ fontWeight: "bold", color: "#2c3e50", fontSize: "0.95em" }}>Costo Compra ($):</label>
              <input style={styles.inputOverride} type="number" min="0" step="0.01" placeholder="0.00" value={costo} onChange={(e) => setCosto(e.target.value)} required />
            </div>
          </div>

          <div style={{ display: "flex", flexDirection: "column", gap: "6px", marginBottom: "15px" }}>
            <label style={{ fontWeight: "bold", color: "#2c3e50", fontSize: "0.95em" }}>Stock inicial:</label>
            <input style={styles.inputOverride} type="number" min="0" placeholder="0" value={stock} onChange={(e) => setStock(e.target.value)} required />
          </div>

          <button type="submit" style={styles.actionBtnSolid} onMouseOver={(e) => e.currentTarget.style.transform = "scale(1.02)"} onMouseOut={(e) => e.currentTarget.style.transform = "scale(1)"}>
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><path d="M19 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h11l5 5v11a2 2 0 0 1-2 2z"></path><polyline points="17 21 17 13 7 13 7 21"></polyline><polyline points="7 3 7 8 15 8"></polyline></svg>
            Guardar Producto en Base de Datos
          </button>
        </form>
      </div>
    </div>
  );
}

const styles = {
  pageContainer: { backgroundColor: "#f4f6f8", minHeight: "100vh", padding: "40px 20px" },
  card: { maxWidth: "600px", margin: "0 auto", padding: "35px", borderRadius: "12px", boxShadow: "0 4px 15px rgba(0,0,0,0.05)", border: "1px solid #f0f0f0", backgroundColor: "white" },
  inputOverride: { width: "100%", padding: "12px", borderRadius: "8px", border: "1px solid #dcdde1", fontSize: "1rem", outline: "none", boxSizing: "border-box" },
  actionBtnSolid: { width: "100%", backgroundColor: "#261d60", color: "white", padding: "16px", border: "none", borderRadius: "8px", fontSize: "1.05rem", fontWeight: "bold", cursor: "pointer", display: "flex", justifyContent: "center", alignItems: "center", gap: "10px", transition: "transform 0.2s" },
  actionBtnOutline: { backgroundColor: "transparent", color: "#261d60", padding: "8px 16px", border: "2px solid #261d60", borderRadius: "8px", fontSize: "0.95rem", fontWeight: "bold", cursor: "pointer", display: "flex", justifyContent: "center", alignItems: "center", gap: "8px", textDecoration: "none", transition: "background 0.2s" }
};