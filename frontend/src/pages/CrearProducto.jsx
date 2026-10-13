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
    <div className="pagina" style={{ padding: "40px 20px" }}>
      <div 
        className="card" 
        style={{ 
          maxWidth: "600px", 
          margin: "0 auto", 
          padding: "30px", 
          borderRadius: "12px", 
          boxShadow: "0 4px 15px rgba(0,0,0,0.05)",
          display: "flex", 
          flexDirection: "column", 
          gap: "20px"
        }}
      >
        {/* ENCABEZADO CON ÍCONO DE VOLVER */}
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", paddingBottom: "15px", borderBottom: "2px solid #f0f0f0" }}>
          <h2 style={{ margin: 0, color: "#2c3e50" }}>Registrar Producto</h2>
          <Link to="/admin" className="btn-volver-interactivo">
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <line x1="19" y1="12" x2="5" y2="12"></line>
              <polyline points="12 19 5 12 12 5"></polyline>
            </svg>
            Volver al Panel
          </Link>
        </div>
        
        {mensaje && <div style={{ backgroundColor: "#e8f5e9", color: "#2e7d32", padding: "12px", borderRadius: "8px", fontWeight: "bold", border: "1px solid #c8e6c9" }}>{mensaje}</div>}
        {error && <div style={{ backgroundColor: "#ffebee", color: "#c62828", padding: "12px", borderRadius: "8px", fontWeight: "bold", border: "1px solid #ffcdd2" }}>{error}</div>}

        {/* FORMULARIO DE REGISTRO */}
        <form onSubmit={handleSubmit} style={{ display: "flex", flexDirection: "column", gap: "15px" }}>
          <div style={{ display: "flex", flexDirection: "column", gap: "5px" }}>
            <label style={{ fontWeight: "bold", color: "#2c3e50" }}>Nombre del producto:</label>
            <input 
              className="input input-interactivo" 
              type="text" 
              placeholder="Ej: Coca Cola 2.25L" 
              value={nombre} 
              onChange={(e) => setNombre(e.target.value)} 
              required 
            />
          </div>

          <div style={{ display: "flex", flexDirection: "column", gap: "5px" }}>
            <label style={{ fontWeight: "bold", color: "#2c3e50" }}>Código de barras (Opcional):</label>
            <input 
              className="input input-interactivo" 
              type="text" 
              placeholder="Ej: 7791234567890" 
              value={codigo} 
              onChange={(e) => setCodigo(e.target.value)} 
            />
          </div>

          <div style={{ display: 'flex', gap: '20px' }}>
            <div style={{ flex: 1, display: "flex", flexDirection: "column", gap: "5px" }}>
              <label style={{ fontWeight: "bold", color: "#2c3e50" }}>Precio Venta ($):</label>
              <input 
                className="input input-interactivo" 
                type="number" 
                min="0" 
                step="0.01" 
                placeholder="0.00" 
                value={precio} 
                onChange={(e) => setPrecio(e.target.value)} 
                required 
              />
            </div>
            <div style={{ flex: 1, display: "flex", flexDirection: "column", gap: "5px" }}>
              <label style={{ fontWeight: "bold", color: "#2c3e50" }}>Costo Compra ($):</label>
              <input 
                className="input input-interactivo" 
                type="number" 
                min="0" 
                step="0.01" 
                placeholder="0.00" 
                value={costo} 
                onChange={(e) => setCosto(e.target.value)} 
                required 
              />
            </div>
          </div>

          <div style={{ display: "flex", flexDirection: "column", gap: "5px", marginBottom: "10px" }}>
            <label style={{ fontWeight: "bold", color: "#2c3e50" }}>Stock inicial:</label>
            <input 
              className="input input-interactivo" 
              type="number" 
              min="0" 
              placeholder="0" 
              value={stock} 
              onChange={(e) => setStock(e.target.value)} 
              required 
            />
          </div>

          <button 
            className="btn btn-primary" 
            type="submit" 
            style={{ 
              padding: "14px", 
              fontSize: "1.1em", 
              backgroundColor: "#1976d2", 
              display: "flex", 
              justifyContent: "center", 
              alignItems: "center", 
              gap: "10px", 
              borderRadius: "8px", 
              cursor: "pointer", 
              transition: "transform 0.2s" 
            }}
            onMouseOver={(e) => e.currentTarget.style.transform = "scale(1.02)"}
            onMouseOut={(e) => e.currentTarget.style.transform = "scale(1)"}
          >
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M19 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h11l5 5v11a2 2 0 0 1-2 2z"></path>
              <polyline points="17 21 17 13 7 13 7 21"></polyline>
              <polyline points="7 3 7 8 15 8"></polyline>
            </svg>
            Guardar Producto en Base de Datos
          </button>
        </form>
      </div>
    </div>
  );
}