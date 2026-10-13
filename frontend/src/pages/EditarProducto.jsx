import { useState, useEffect } from "react";
import api from "../services/api";
import { Link } from "react-router-dom";
import "../styles/common.css";

export default function EditarProducto() {
  const [productos, setProductos] = useState([]);
  const [idSeleccionado, setIdSeleccionado] = useState("");
  
  const [nombre, setNombre] = useState("");
  const [codigo, setCodigo] = useState("");
  const [precio, setPrecio] = useState("");
  const [costo, setCosto] = useState("");
  const [stock, setStock] = useState("");
  
  const [mensaje, setMensaje] = useState("");
  const [error, setError] = useState("");
  const [busqueda, setBusqueda] = useState("");

  const cargarProductos = async () => {
    try {
      const respuesta = await api.get('/productos');
      setProductos(respuesta.data);
    } catch (err) {
      console.error("Error al cargar productos:", err);
    }
  };

  useEffect(() => {
    cargarProductos();
  }, []);

  const handleSeleccion = (id) => {
    setIdSeleccionado(String(id));
    
    const prod = productos.find(p => String(p.idProductos) === String(id) || String(p.Cod_barra) === String(id));
    
    if (prod) {
      setNombre(prod.Nombre || "");
      setCodigo(prod.Cod_barra || "");
      setPrecio(prod.Precio_Venta || 0);
      setCosto(prod.Precio_costo || 0);
      setStock(prod.Stock || 0);
      setMensaje("");
      setError("");
    }
  };

  const handleSubmit = async (event) => {
    event.preventDefault();
    setMensaje(""); setError("");

    if (!idSeleccionado) {
      setError("Por favor seleccioná un producto primero.");
      return;
    }

    try {
      const productoReal = productos.find(p => String(p.idProductos) === idSeleccionado || String(p.Cod_barra) === idSeleccionado);
      
      await api.put(`/productos/${productoReal.idProductos}`, {
        Nombre: nombre,
        Cod_barra: codigo,
        Precio_Venta: Number(precio),
        Precio_costo: Number(costo),
        Stock: Number(stock)
      });

      setMensaje(`¡El producto se actualizó correctamente!`);
      cargarProductos(); 
    } catch (err) {
      console.error(err);
      setError("Error al editar el producto. Revisá la consola.");
    }
  };

  const productosFiltrados = productos.filter(p => 
    p.Nombre.toLowerCase().includes(busqueda.toLowerCase()) || 
    (p.Cod_barra && p.Cod_barra.includes(busqueda))
  );

  return (
    <div className="pagina" style={{ padding: "40px 20px" }}>
      <div className="card" style={{ maxWidth: "800px", margin: "0 auto", padding: "30px", borderRadius: "12px", boxShadow: "0 4px 15px rgba(0,0,0,0.05)" }}>
        
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "25px", paddingBottom: "15px", borderBottom: "2px solid #f0f0f0" }}>
          <h2 style={{ margin: 0, color: "#2c3e50" }}>Editar Producto</h2>
          <Link to="/admin" className="btn-volver-interactivo">
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><line x1="19" y1="12" x2="5" y2="12"></line><polyline points="12 19 5 12 12 5"></polyline></svg>
            Volver al Panel
          </Link>
        </div>
        
        {mensaje && <div style={{ backgroundColor: "#e8f5e9", color: "#2e7d32", padding: "12px", borderRadius: "8px", fontWeight: "bold", marginBottom: "15px", border: "1px solid #c8e6c9" }}>{mensaje}</div>}
        {error && <div style={{ backgroundColor: "#ffebee", color: "#c62828", padding: "12px", borderRadius: "8px", fontWeight: "bold", marginBottom: "15px", border: "1px solid #ffcdd2" }}>{error}</div>}

        <div style={{ display: "flex", flexDirection: "column", gap: "10px", backgroundColor: "#f8f9fa", padding: "20px", borderRadius: "10px", marginBottom: "25px", border: "1px solid #e9ecef" }}>
          <label style={{ fontWeight: "bold", color: "#2c3e50" }}>Buscar y seleccionar producto:</label>
          
          <div style={{ position: "relative" }}>
            <div style={{ position: "absolute", left: "12px", top: "10px", color: "#95a5a6" }}>
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="11" cy="11" r="8"></circle><line x1="21" y1="21" x2="16.65" y2="16.65"></line></svg>
            </div>
            <input 
              className="input input-interactivo" 
              type="text" 
              placeholder="Escribí el nombre o código..." 
              value={busqueda}
              onChange={(e) => setBusqueda(e.target.value)}
              style={{ paddingLeft: "40px" }}
            />
          </div>

          <div style={{ maxHeight: "250px", overflowY: "auto", overflowX: "hidden", border: "1px solid #ddd", borderRadius: "8px", backgroundColor: "#fff", marginTop: "10px" }}>
            {productosFiltrados.map(p => {
              const seleccionado = idSeleccionado === String(p.idProductos || p.Cod_barra);
              return (
                <div 
                  key={p.idProductos || p.Cod_barra} 
                  className="item-producto-interactivo"
                  onClick={() => handleSeleccion(p.idProductos || p.Cod_barra)}
                  style={{ 
                    padding: "12px 15px", 
                    borderBottom: "1px solid #f0f0f0", 
                    cursor: "pointer", 
                    backgroundColor: seleccionado ? "#e3f2fd" : "transparent",
                    display: "flex", 
                    justifyContent: "space-between", 
                    alignItems: "center",
                    gap: "15px"
                  }}
                >
                  <div style={{ flex: 1, minWidth: 0, display: "flex", flexDirection: "column", gap: "2px" }}>
                    <strong style={{ color: "#2c3e50", whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }} title={p.Nombre}>
                      {p.Nombre}
                    </strong> 
                    <span style={{ color: "#7f8c8d", fontSize: "0.85em" }}>Cod: {p.Cod_barra}</span>
                  </div>
                  
                  <div style={{ display: "flex", alignItems: "center", gap: "15px", flexShrink: 0 }}>
                    <span style={{ fontWeight: "bold", color: "#2c3e50", fontSize: "1.1em" }}>${p.Precio_Venta}</span>
                    {p.stockBajo ? (
                      <span style={{ display: "flex", alignItems: "center", gap: "5px", color: "#c62828", fontSize: "0.85em", fontWeight: "bold", backgroundColor: "#ffebee", padding: "4px 10px", borderRadius: "20px" }}>
                        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z"></path><line x1="12" y1="9" x2="12" y2="13"></line><line x1="12" y1="17" x2="12.01" y2="17"></line></svg>
                        Stock: {p.Stock}
                      </span>
                    ) : (
                      <span style={{ color: "#388e3c", fontSize: "0.85em", fontWeight: "bold", backgroundColor: "#e8f5e9", padding: "4px 10px", borderRadius: "20px" }}>
                        Stock: {p.Stock}
                      </span>
                    )}
                  </div>
                </div>
              );
            })}
            {productosFiltrados.length === 0 && (
              <div style={{ padding: "15px", textAlign: "center", color: "#95a5a6" }}>No se encontraron productos.</div>
            )}
          </div>
        </div>

        {idSeleccionado && (
          <form onSubmit={handleSubmit} style={{ display: "flex", flexDirection: "column", gap: "15px" }}>
            <div style={{ display: "flex", flexDirection: "column", gap: "5px" }}>
              <label style={{ fontWeight: "bold", color: "#333" }}>Nombre del producto:</label>
              <input className="input input-interactivo" type="text" value={nombre} onChange={(e) => setNombre(e.target.value)} required />
            </div>

            <div style={{ display: "flex", flexDirection: "column", gap: "5px" }}>
              <label style={{ fontWeight: "bold", color: "#333" }}>Código de barras:</label>
              <input className="input input-interactivo" type="text" value={codigo} onChange={(e) => setCodigo(e.target.value)} />
            </div>

            <div style={{ display: 'flex', gap: '20px' }}>
              <div style={{ flex: 1, display: "flex", flexDirection: "column", gap: "5px" }}>
                <label style={{ fontWeight: "bold", color: "#333" }}>Precio Venta ($):</label>
                <input className="input input-interactivo" type="number" min="0" step="0.01" value={precio} onChange={(e) => setPrecio(e.target.value)} required />
              </div>
              <div style={{ flex: 1, display: "flex", flexDirection: "column", gap: "5px" }}>
                <label style={{ fontWeight: "bold", color: "#333" }}>Costo Compra ($):</label>
                <input className="input input-interactivo" type="number" min="0" step="0.01" value={costo} onChange={(e) => setCosto(e.target.value)} required />
              </div>
            </div>

            <div style={{ display: "flex", flexDirection: "column", gap: "5px", marginBottom: "10px" }}>
              <label style={{ fontWeight: "bold", color: "#333" }}>Stock:</label>
              <input className="input input-interactivo" type="number" min="0" value={stock} onChange={(e) => setStock(e.target.value)} required />
            </div>

            <button className="btn btn-primary" type="submit" style={{ padding: "14px", fontSize: "1.1em", backgroundColor: "#1976d2", display: "flex", justifyContent: "center", alignItems: "center", gap: "10px", borderRadius: "8px", cursor: "pointer", transition: "transform 0.2s" }} onMouseOver={(e) => e.currentTarget.style.transform = "scale(1.02)"} onMouseOut={(e) => e.currentTarget.style.transform = "scale(1)"}>
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M19 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h11l5 5v11a2 2 0 0 1-2 2z"></path><polyline points="17 21 17 13 7 13 7 21"></polyline><polyline points="7 3 7 8 15 8"></polyline></svg>
              Guardar Cambios
            </button>
          </form>
        )}
      </div>
    </div>
  );
}