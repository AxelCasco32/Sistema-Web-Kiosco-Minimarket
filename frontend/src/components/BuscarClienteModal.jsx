import { useState } from "react";
import api from "../services/api";

export default function BuscarClienteModal({ onClose, onSeleccionarCliente }) {
  const [cuitBuscado, setCuitBuscado] = useState("");
  const [cargando, setCargando] = useState(false);
  const [error, setError] = useState("");
  
  const [modoCrear, setModoCrear] = useState(false);
  const [nuevoCliente, setNuevoCliente] = useState({ nombre: "", cuit: "", condicion_iva: "responsable_inscripto" });

  const buscarCliente = async (e) => {
    e.preventDefault();
    if (!cuitBuscado.trim()) return;
    
    setCargando(true);
    setError("");
    try {
      const respuesta = await api.get(`/clientes/${cuitBuscado}`);
      
      const clienteReal = {
        id: respuesta.data.id_Cliente,
        Nombre: respuesta.data.Nombre_razon_social,
        CUIT: respuesta.data.Cuit_DNI,
        Condicion: respuesta.data.Tipo_Cliente
      };
      
      onSeleccionarCliente(clienteReal);
      onClose(); 
    } catch (err) {
      if (err.response && err.response.status === 404) {
        setError("Cliente no encontrado. Podés registrarlo ahora mismo.");
        setModoCrear(true);
        setNuevoCliente({ ...nuevoCliente, cuit: cuitBuscado });
      } else {
        setError("Error de conexión al buscar el cliente.");
      }
    } finally {
      setCargando(false);
    }
  };

  const crearCliente = async (e) => {
    e.preventDefault();
    setCargando(true);
    try {
      const respuesta = await api.post("/clientes", nuevoCliente);
      
      const clienteReal = {
        id: respuesta.data.id_Cliente,
        Nombre: respuesta.data.Nombre_razon_social,
        CUIT: respuesta.data.Cuit_DNI,
        Condicion: respuesta.data.Tipo_Cliente
      };
      
      onSeleccionarCliente(clienteReal);
      onClose(); 
    } catch (err) {
      setError(err.response?.data?.mensaje || "Error al crear el cliente en la base de datos.");
    } finally {
      setCargando(false);
    }
  };

  return (
    <div className="modal-overlay">
      <div className="modal-content">
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", borderBottom: "1px solid #ddd", paddingBottom: "10px", marginBottom: "20px" }}>
          <h2 style={{ margin: 0, color: "#2c3e50" }}>Asignar Cliente a la Venta</h2>
          <button onClick={onClose} style={{ background: "none", border: "none", fontSize: "1.5em", cursor: "pointer", color: "#95a5a6" }}>&times;</button>
        </div>

        {!modoCrear ? (
          <form onSubmit={buscarCliente}>
            <label style={{ display: "block", marginBottom: "8px", fontWeight: "bold", color: "#555" }}>Buscar por CUIT o DNI</label>
            <div style={{ display: "flex", gap: "10px" }}>
              <input
                autoFocus
                type="text"
                className="input input-interactivo"
                value={cuitBuscado}
                onChange={(e) => setCuitBuscado(e.target.value)}
                placeholder="Ej: 20351234568"
                style={{ flex: 1, padding: "10px", border: "1px solid #ccc", borderRadius: "6px" }}
              />
              <button type="submit" disabled={cargando} style={{ backgroundColor: "#261d60", color: "white", border: "none", padding: "10px 20px", borderRadius: "6px", cursor: "pointer", display: "flex", alignItems: "center", gap: "6px", fontWeight: "bold" }}>
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="11" cy="11" r="8"></circle><line x1="21" y1="21" x2="16.65" y2="16.65"></line></svg>
                {cargando ? "Buscando..." : "Buscar"}
              </button>
            </div>
            {error && <p style={{ color: "#d32f2f", marginTop: "15px", fontSize: "0.9em", backgroundColor: "#ffebee", padding: "10px", borderRadius: "6px" }}>{error}</p>}
            
            <div style={{ marginTop: "20px", textAlign: "center" }}>
              <button type="button" onClick={() => onSeleccionarCliente(null)} style={{ background: "none", border: "1px solid #ccc", padding: "8px 15px", borderRadius: "6px", cursor: "pointer" }}>
                Volver a Consumidor Final
              </button>
            </div>
          </form>
        ) : (
          <form onSubmit={crearCliente}>
            <p style={{ color: "#261d60", fontWeight: "bold", marginBottom: "15px", display: "flex", alignItems: "center", gap: "8px" }}>
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M16 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"></path><circle cx="8.5" cy="7" r="4"></circle><line x1="20" y1="8" x2="20" y2="14"></line><line x1="23" y1="11" x2="17" y2="11"></line></svg>
              Alta Rápida de Cliente
            </p>
            <div style={{ display: "flex", flexDirection: "column", gap: "12px" }}>
              <div>
                <label style={{ display: "block", fontSize: "0.9em", marginBottom: "5px", color: "#555" }}>Razón Social / Nombre Completo</label>
                <input type="text" className="input" required autoFocus value={nuevoCliente.nombre} onChange={(e) => setNuevoCliente({...nuevoCliente, nombre: e.target.value})} style={{ width: "100%", padding: "10px", border: "1px solid #ccc", borderRadius: "6px" }} />
              </div>
              <div>
                <label style={{ display: "block", fontSize: "0.9em", marginBottom: "5px", color: "#555" }}>CUIT / DNI</label>
                <input type="text" className="input" required value={nuevoCliente.cuit} onChange={(e) => setNuevoCliente({...nuevoCliente, cuit: e.target.value})} style={{ width: "100%", padding: "10px", border: "1px solid #ccc", borderRadius: "6px" }} />
              </div>
              <div>
                <label style={{ display: "block", fontSize: "0.9em", marginBottom: "5px", color: "#555" }}>Condición frente al IVA</label>
                <select className="input" value={nuevoCliente.condicion_iva} onChange={(e) => setNuevoCliente({...nuevoCliente, condicion_iva: e.target.value})} style={{ width: "100%", padding: "10px", border: "1px solid #ccc", borderRadius: "6px" }}>
                  <option value="responsable_inscripto">Responsable Inscripto (Factura A)</option>
                  <option value="monotributo">Monotributo (Factura B)</option>
                  <option value="exento">Exento (Factura B)</option>
                </select>
              </div>
              <div style={{ display: "flex", gap: "10px", marginTop: "10px" }}>
                <button type="button" onClick={() => setModoCrear(false)} style={{ flex: 1, padding: "10px", background: "#f5f5f5", border: "1px solid #ddd", borderRadius: "6px", cursor: "pointer" }}>Cancelar</button>
                <button type="submit" disabled={cargando} style={{ flex: 2, padding: "10px", borderRadius: "6px", backgroundColor: "#261d60", color: "white", border: "none", cursor: "pointer", fontWeight: "bold" }}>
                  {cargando ? "Guardando..." : "Guardar y Asignar"}
                </button>
              </div>
              {error && <p style={{ color: "#d32f2f", marginTop: "15px", fontSize: "0.9em", backgroundColor: "#ffebee", padding: "10px", borderRadius: "6px" }}>{error}</p>}
            </div>
          </form>
        )}
      </div>
    </div>
  );
}