import { useState, useEffect } from "react";
import { useAuth } from "../context/AuthContext";
import api from "../services/api";
import { Link } from "react-router-dom";
import "../styles/common.css";
import "../styles/pos.css"; 

export default function AdminDashboard() {
  const { logout, usuario } = useAuth();
  const [usuarios, setUsuarios] = useState([]);
  const [roles, setRoles] = useState([]);
  const [productos, setProductos] = useState([]); 
  
  const [nombre, setNombre] = useState("");
  const [apellido, setApellido] = useState("");
  const [user, setUser] = useState("");
  const [password, setPassword] = useState("");
  const [idRol, setIdRol] = useState(1);
  
  const cargarDatos = async () => {
    try {
      const resUsuarios = await api.get("/usuarios");
      setUsuarios(resUsuarios.data);
      const resRoles = await api.get("/usuarios/roles");
      setRoles(resRoles.data);
      
      const resProductos = await api.get("/productos");
      setProductos(resProductos.data);
    } catch (error) {
      console.error("Fallo al descargar datos:", error);
    }
  };

  useEffect(() => {
    cargarDatos();
  }, []);

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      await api.post("/usuarios", {
        Nombre: nombre,
        Apellido: apellido,
        Usuario: user,
        password: password,
        id_Rol: idRol
      });
      alert("¡Usuario creado con éxito!");
      setNombre(""); setApellido(""); setUser(""); setPassword("");
      cargarDatos(); 
    } catch (error) {
      alert("Error al crear el usuario. Revisa que la contraseña tenga 6 letras/números.");
    }
  };

  // Íconos SVG para cada estado
  const obtenerEstiloStock = (stock) => {
    if (stock <= 5) return { 
      bg: "#ffebee", 
      text: "#c62828", 
      etiqueta: "Faltan unidades",
      icono: (
        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#c62828" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
          <path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z"></path>
          <line x1="12" y1="9" x2="12" y2="13"></line>
          <line x1="12" y1="17" x2="12.01" y2="17"></line>
        </svg>
      )
    }; 
    if (stock <= 15) return { 
      bg: "#fff8e1", 
      text: "#b78103", 
      etiqueta: "Stock moderado",
      icono: (
        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#b78103" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
          <circle cx="12" cy="12" r="10"></circle>
          <line x1="12" y1="8" x2="12" y2="12"></line>
          <line x1="12" y1="16" x2="12.01" y2="16"></line>
        </svg>
      )
    }; 
    return { 
      bg: "#e8f5e9", 
      text: "#2e7d32", 
      etiqueta: "Stock óptimo",
      icono: (
        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#2e7d32" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
          <path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"></path>
          <polyline points="22 4 12 14.01 9 11.01"></polyline>
        </svg>
      )
    }; 
  };

  return (
    <div className="caja">
      <header className="caja-header" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '20px 30px' }}>
        <h1 style={{ margin: 0 }}>Panel de Administrador</h1>
        
        {/* Modernización con SVG para cerrar sesión */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '20px', backgroundColor: 'rgba(255,255,255,0.1)', padding: '10px 25px', borderRadius: '40px' }}>
          <span style={{ color: 'white', fontSize: '1.1em', display: 'flex', alignItems: 'center', gap: '8px' }}>
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"></path><circle cx="12" cy="7" r="4"></circle></svg>
            Bienvenido, <strong>{usuario?.nombre || 'Admin'}</strong>
          </span>
          <button onClick={logout} className="btn-cerrar-sesion">
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4"></path><polyline points="16 17 21 12 16 7"></polyline><line x1="21" y1="12" x2="9" y2="12"></line></svg>
            Cerrar sesión
          </button>
        </div>
      </header>

      <div style={{ padding: "40px 20px" }}>
        
        {/* =========================================
            SECCIÓN 1: GESTIÓN DE USUARIOS
           ========================================= */}
        <div style={{ display: 'flex', gap: '25px', alignItems: 'flex-start', flexWrap: "wrap", marginBottom: "40px" }}>
          
          <section className="card" style={{ flex: 1, minWidth: "350px", padding: "30px", borderRadius: "12px", boxShadow: "0 4px 15px rgba(0,0,0,0.02)" }}>
            <h2 style={{ marginTop: 0, marginBottom: "25px", paddingBottom: "10px", borderBottom: "2px solid #f0f0f0", color: "#2c3e50" }}>
              Crear usuario
            </h2>
            <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '15px' }}>
              <input className="input input-interactivo" type="text" placeholder="Nombre" value={nombre} onChange={e => setNombre(e.target.value)} required />
              <input className="input input-interactivo" type="text" placeholder="Apellido" value={apellido} onChange={e => setApellido(e.target.value)} required />
              <input className="input input-interactivo" type="text" placeholder="Usuario" value={user} onChange={e => setUser(e.target.value)} required />
              <input className="input input-interactivo" type="password" placeholder="Contraseña (mínimo 6)" value={password} onChange={e => setPassword(e.target.value)} required />
              
              <select className="input input-interactivo" value={idRol} onChange={e => setIdRol(e.target.value)}>
                {roles.map(r => (
                  <option key={r.id_Rol} value={r.id_Rol}>{r.Nombre}</option>
                ))}
              </select>
              <button className="btn btn-primary" type="submit" style={{ marginTop: "10px", display: "inline-flex", justifyContent: "center", alignItems: "center", gap: "8px" }}>
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M16 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"></path><circle cx="8.5" cy="7" r="4"></circle><line x1="20" y1="8" x2="20" y2="14"></line><line x1="23" y1="11" x2="17" y2="11"></line></svg>
                Crear usuario
              </button>
            </form>
          </section>

          <section className="card" style={{ flex: 1, minWidth: "350px", padding: "30px", borderRadius: "12px", boxShadow: "0 4px 15px rgba(0,0,0,0.02)" }}>
            <h2 style={{ marginTop: 0, marginBottom: "25px", paddingBottom: "10px", borderBottom: "2px solid #f0f0f0", color: "#2c3e50" }}>
              Usuarios existentes
            </h2>
            <ul style={{ listStyle: 'none', padding: 0, margin: 0, maxHeight: "350px", overflowY: "auto", paddingRight: "10px" }}>
              {usuarios.map(u => (
                <li key={u.id_Usuario} className="fila-dashboard-interactiva" style={{ padding: '15px', marginBottom: '10px', backgroundColor: '#f8f9fa', borderRadius: '8px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                    <div style={{ color: '#7f8c8d' }}>
                      <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"></path><circle cx="12" cy="7" r="4"></circle></svg>
                    </div>
                    <div>
                      <strong style={{ fontSize: '1.1em', color: '#2c3e50' }}>{u.Nombre} {u.Apellido}</strong> 
                      <p style={{ margin: '3px 0 0 0', color: '#7f8c8d', fontSize: '0.9em' }}>Usuario: {u.Usuario}</p>
                    </div>
                  </div>
                  <span style={{ backgroundColor: u.Rol?.Nombre === 'Admin' ? '#ff9800' : '#4caf50', color: 'white', padding: '6px 12px', borderRadius: '20px', fontWeight: 'bold', fontSize: '0.85em' }}>
                    {u.Rol?.Nombre}
                  </span>
                </li>
              ))}
            </ul>
          </section>
        </div>

        <hr style={{ border: "0", borderTop: "2px solid #e0e0e0", margin: "40px 0" }} />

        {/* =========================================
            SECCIÓN 2: GESTIÓN DE PRODUCTOS
           ========================================= */}
        <div>
          <div style={{ marginBottom: "25px", display: "flex", gap: "15px" }}>
            <Link to="/crear-producto" className="btn-gestion-interactivo" style={{ backgroundColor: "#ff9800" }}>
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="9" cy="21" r="1"></circle><circle cx="20" cy="21" r="1"></circle><path d="M1 1h4l2.68 13.39a2 2 0 0 0 2 1.61h9.72a2 2 0 0 0 2-1.61L23 6H6"></path></svg>
               Registrar Producto Nuevo
            </Link>
            <Link to="/editar-producto" className="btn-gestion-interactivo" style={{ backgroundColor: "#1976d2" }}>
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M12 20h9"></path><path d="M16.5 3.5a2.121 2.121 0 0 1 3 3L7 19l-4 1 1-4L16.5 3.5z"></path></svg>
               Editar Producto Existente
            </Link>
            <Link to="/historial-ventas" className="btn-gestion-interactivo" style={{ backgroundColor: "#4caf50" }}>
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"></path><polyline points="14 2 14 8 20 8"></polyline><line x1="16" y1="13" x2="8" y2="13"></line><line x1="16" y1="17" x2="8" y2="17"></line><polyline points="10 9 9 9 8 9"></polyline></svg>
               Historial de Ventas
            </Link>


          </div>

          <section className="card" style={{ padding: "30px", borderRadius: "12px", boxShadow: "0 4px 15px rgba(0,0,0,0.02)" }}>
            <h2 style={{ marginTop: 0, marginBottom: "10px", color: "#2c3e50" }}>Estado del Stock</h2>
            <p style={{ color: "#7f8c8d", marginBottom: "25px", paddingBottom: "15px", borderBottom: "2px solid #f0f0f0" }}>Monitoreo en tiempo real de la mercadería.</p>
            
            <ul style={{ listStyle: 'none', padding: 0, margin: 0, maxHeight: "400px", overflowY: "auto", paddingRight: "10px" }}>
              {productos.map(p => {
                const estilo = obtenerEstiloStock(p.Stock);
                return (
                  <li 
                    key={p.idProductos || p.Cod_barra} 
                    className="alerta-stock-interactiva"
                    style={{ 
                      padding: '15px 20px', 
                      marginBottom: '12px', 
                      borderRadius: '10px', 
                      backgroundColor: estilo.bg,
                      display: 'flex', 
                      justifyContent: 'space-between', 
                      alignItems: 'center',
                      border: `1px solid ${estilo.text}30`,
                      boxShadow: '0 2px 4px rgba(0,0,0,0.01)'
                    }}
                  >
                    <div>
                      <strong style={{ fontSize: '1.1em', color: '#2c3e50' }}>{p.Nombre}</strong> 
                      <p style={{ margin: '5px 0 0 0', color: '#7f8c8d', fontSize: "0.9em" }}>Cod: {p.Cod_barra}</p>
                    </div>
                    <div style={{ textAlign: "right" }}>
                      <span style={{ 
                        fontWeight: 'bold', 
                        color: estilo.text, 
                        fontSize: "1.05em", 
                        backgroundColor: 'white', 
                        padding: '6px 15px', 
                        borderRadius: '20px', 
                        border: `1px solid ${estilo.text}20`,
                        display: 'inline-flex',
                        alignItems: 'center',
                        gap: '6px'
                      }}>
                        {estilo.icono}
                        Stock: {p.Stock}
                      </span>
                    </div>
                  </li>
                );
              })}
              {productos.length === 0 && <p style={{ color: "#7f8c8d", fontStyle: "italic" }}>No hay productos cargados aún.</p>}
            </ul>
          </section>
        </div>

      </div>
    </div>
  );
}