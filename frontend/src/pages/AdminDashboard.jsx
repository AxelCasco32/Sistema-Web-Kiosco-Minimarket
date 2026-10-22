import { useState, useEffect } from "react";
import { useAuth } from "../context/AuthContext";
import api from "../services/api";
import { Link } from "react-router-dom";
import "../styles/common.css";
import "../styles/pos.css"; 

export default function AdminDashboard() {
  const { logout, usuario: usuarioActual } = useAuth();
  const [usuarios, setUsuarios] = useState([]);
  const [roles, setRoles] = useState([]);
  const [productos, setProductos] = useState([]); 
  
  // Estado para saber si estamos editando
  const [idSeleccionado, setIdSeleccionado] = useState(null);

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

  const limpiarFormulario = () => {
    setIdSeleccionado(null);
    setNombre("");
    setApellido("");
    setUser("");
    setPassword("");
    setIdRol(1);
  };

  const seleccionarParaEditar = (u) => {
    setIdSeleccionado(u.id_Usuario || u.id);
    setNombre(u.Nombre || "");
    setApellido(u.Apellido || "");
    setUser(u.Usuario || "");
    setPassword(""); // Se deja vacío para no cambiar contraseña a menos que se quiera
    setIdRol(u.id_Rol || u.Rol?.id_Rol || 1);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      if (idSeleccionado) {
        // MODO EDICIÓN (PUT)
        await api.put(`/usuarios/${idSeleccionado}`, {
          Nombre: nombre,
          Apellido: apellido,
          Usuario: user,
          password: password,
          id_Rol: Number(idRol)
        });
        alert("¡Usuario modificado con éxito!");
      } else {
        // MODO CREACIÓN (POST)
        await api.post("/usuarios", {
          Nombre: nombre,
          Apellido: apellido,
          Usuario: user,
          password: password,
          id_Rol: Number(idRol)
        });
        alert("¡Usuario creado con éxito!");
      }

      limpiarFormulario();
      cargarDatos(); 
    } catch (error) {
      alert(error.response?.data?.error || "Error al procesar la solicitud.");
    }
  };

  const handleEliminar = async () => {
    if (!idSeleccionado) return;

    // Validación: no auto-eliminarse
    const idLogueado = usuarioActual?.id || usuarioActual?.id_Usuario;
    if (String(idSeleccionado) === String(idLogueado)) {
      alert("No podés eliminar tu propia cuenta mientras estás logueado.");
      return;
    }

    const confirmar = window.confirm(`¿Estás seguro de que querés eliminar al usuario "${user}"? Esta acción no se puede deshacer.`);
    if (!confirmar) return;

    try {
      await api.delete(`/usuarios/${idSeleccionado}`);
      alert("Usuario eliminado correctamente.");
      limpiarFormulario();
      cargarDatos();
    } catch (error) {
      alert(error.response?.data?.error || "Error al eliminar el usuario.");
    }
  };

  const obtenerEstiloStock = (stock) => {
    if (stock <= 5) return { 
      bg: "#ffebee", text: "#c62828", etiqueta: "Faltan unidades",
      icono: (
        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#c62828" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
          <path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z"></path>
          <line x1="12" y1="9" x2="12" y2="13"></line>
          <line x1="12" y1="17" x2="12.01" y2="17"></line>
        </svg>
      )
    }; 
    if (stock <= 15) return { 
      bg: "#fff8e1", text: "#b78103", etiqueta: "Stock moderado",
      icono: (
        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#b78103" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
          <circle cx="12" cy="12" r="10"></circle><line x1="12" y1="8" x2="12" y2="12"></line><line x1="12" y1="16" x2="12.01" y2="16"></line>
        </svg>
      )
    }; 
    return { 
      bg: "#e8f5e9", text: "#2e7d32", etiqueta: "Stock óptimo",
      icono: (
        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#2e7d32" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
          <path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"></path><polyline points="22 4 12 14.01 9 11.01"></polyline>
        </svg>
      )
    }; 
  };

  return (
    <div className="caja" style={{ backgroundColor: "#f4f6f8", minHeight: "100vh" }}>
      
      {/* HEADER DEL ADMIN */}
      <header className="caja-header" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '15px 30px', backgroundColor: '#261d60', color: 'white' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '15px' }}>
          <div style={{ backgroundColor: "rgba(255, 255, 255, 0.1)", padding: "10px", borderRadius: "8px", display: "flex" }}>
            <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
              <rect x="3" y="3" width="7" height="7"></rect><rect x="14" y="3" width="7" height="7"></rect><rect x="14" y="14" width="7" height="7"></rect><rect x="3" y="14" width="7" height="7"></rect>
            </svg>
          </div>
          <h1 style={{ margin: 0, fontSize: "1.6rem", fontWeight: "bold" }}>Panel de Administración</h1>
        </div>
        
        <div style={{ display: 'flex', alignItems: 'center', gap: '20px', backgroundColor: 'rgba(255,255,255,0.1)', padding: '8px 20px', borderRadius: '40px', border: '1px solid rgba(255,255,255,0.1)' }}>
          <span style={{ color: 'white', fontSize: '1.05em', display: 'flex', alignItems: 'center', gap: '8px' }}>
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"></path><circle cx="12" cy="7" r="4"></circle></svg>
            <strong>{usuarioActual?.nombre || 'Admin'}</strong>
          </span>
          <div style={{ width: '1px', height: '18px', backgroundColor: 'rgba(255,255,255,0.3)' }}></div>
          <button onClick={logout} style={{ background: 'transparent', color: 'white', border: 'none', padding: '4px', fontSize: '0.9em', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '6px', opacity: 0.8 }} onMouseOver={(e) => e.currentTarget.style.opacity = "1"} onMouseOut={(e) => e.currentTarget.style.opacity = "0.8"}>
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4"></path><polyline points="16 17 21 12 16 7"></polyline><line x1="21" y1="12" x2="9" y2="12"></line></svg>
            Salir
          </button>
        </div>
      </header>

      <div style={{ padding: "40px 30px", maxWidth: "1200px", margin: "0 auto" }}>
        
        {/* =========================================
            SECCIÓN 1: FORMULARIO Y LISTA DE USUARIOS
           ========================================= */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(350px, 1fr))', gap: '30px', marginBottom: "40px" }}>
          
          {/* FORMULARIO DINÁMICO (CREAR / EDITAR) */}
          <section className="card" style={{ padding: "30px", borderRadius: "12px", boxShadow: "0 4px 15px rgba(0,0,0,0.05)", border: "1px solid #f0f0f0", backgroundColor: "white" }}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "25px", paddingBottom: "10px", borderBottom: "2px solid #f4f6f8" }}>
              <h2 style={{ margin: 0, color: idSeleccionado ? "#261d60" : "#2c3e50" }}>
                {idSeleccionado ? "Editar usuario" : "Crear usuario"}
              </h2>
              {idSeleccionado && (
                <button 
                  type="button" 
                  onClick={limpiarFormulario}
                  style={{ background: "none", border: "none", color: "#7f8c8d", cursor: "pointer", fontSize: "0.85rem", textDecoration: "underline" }}
                >
                  Cancelar edición
                </button>
              )}
            </div>

            <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '15px' }}>
              <input className="input input-interactivo" style={styles.inputOverride} type="text" placeholder="Nombre" value={nombre} onChange={e => setNombre(e.target.value)} required />
              <input className="input input-interactivo" style={styles.inputOverride} type="text" placeholder="Apellido" value={apellido} onChange={e => setApellido(e.target.value)} required />
              <input className="input input-interactivo" style={styles.inputOverride} type="text" placeholder="Usuario" value={user} onChange={e => setUser(e.target.value)} required />
              <input 
                className="input input-interactivo" 
                style={styles.inputOverride} 
                type="password" 
                placeholder={idSeleccionado ? "Contraseña (dejar en blanco para no cambiar)" : "Contraseña (mínimo 6)"} 
                value={password} 
                onChange={e => setPassword(e.target.value)} 
                required={!idSeleccionado} 
              />
              
              <select className="input input-interactivo" style={styles.inputOverride} value={idRol} onChange={e => setIdRol(e.target.value)}>
                {roles.map(r => (
                  <option key={r.id_Rol} value={r.id_Rol}>{r.Nombre}</option>
                ))}
              </select>
              
              <div style={{ display: "flex", flexDirection: "column", gap: "10px", marginTop: "10px" }}>
                <button type="submit" style={styles.actionBtnSolid}>
                  {idSeleccionado ? (
                    <>
                      <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><path d="M19 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h11l5 5v11a2 2 0 0 1-2 2z"></path><polyline points="17 21 17 13 7 13 7 21"></polyline><polyline points="7 3 7 8 15 8"></polyline></svg>
                      Guardar Cambios
                    </>
                  ) : (
                    <>
                      <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><path d="M16 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"></path><circle cx="8.5" cy="7" r="4"></circle><line x1="20" y1="8" x2="20" y2="14"></line><line x1="23" y1="11" x2="17" y2="11"></line></svg>
                      Crear usuario
                    </>
                  )}
                </button>

                {idSeleccionado && (
                  <button 
                    type="button" 
                    onClick={handleEliminar}
                    style={styles.deleteBtn}
                  >
                    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><polyline points="3 6 5 6 21 6"></polyline><path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"></path><line x1="10" y1="11" x2="10" y2="17"></line><line x1="14" y1="11" x2="14" y2="17"></line></svg>
                    Eliminar Usuario
                  </button>
                )}
              </div>
            </form>
          </section>

          {/* LISTA DE USUARIOS EXISTENTES */}
          <section className="card" style={{ padding: "30px", borderRadius: "12px", boxShadow: "0 4px 15px rgba(0,0,0,0.05)", border: "1px solid #f0f0f0", backgroundColor: "white" }}>
            <h2 style={{ marginTop: 0, marginBottom: "10px", color: "#2c3e50" }}>
              Usuarios existentes
            </h2>
            <p style={{ color: "#7f8c8d", fontSize: "0.85rem", marginTop: 0, marginBottom: "20px" }}>
              Hacé clic en cualquier usuario para modificarlo o eliminarlo.
            </p>
            <ul style={{ listStyle: 'none', padding: 0, margin: 0, maxHeight: "350px", overflowY: "auto", paddingRight: "10px" }}>
              {usuarios.map(u => {
                const idU = u.id_Usuario || u.id;
                const seleccionado = String(idSeleccionado) === String(idU);

                return (
                  <li 
                    key={idU} 
                    onClick={() => seleccionarParaEditar(u)}
                    style={{ 
                      padding: '15px', 
                      marginBottom: '10px', 
                      backgroundColor: seleccionado ? "rgba(38, 29, 96, 0.08)" : "#f8f9fa", 
                      borderRadius: '8px', 
                      border: seleccionado ? "1.5px solid #261d60" : "1px solid #eef0f2", 
                      display: 'flex', 
                      justifyContent: 'space-between', 
                      alignItems: 'center',
                      cursor: "pointer",
                      transition: "all 0.2s"
                    }}
                  >
                    <div style={{ display: 'flex', alignItems: 'center', gap: '15px' }}>
                      <div style={{ width: "40px", height: "40px", borderRadius: "50%", backgroundColor: seleccionado ? "#261d60" : "#e6e4f4", display: "flex", justifyContent: "center", alignItems: "center" }}>
                        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke={seleccionado ? "white" : "#261d60"} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"></path><circle cx="12" cy="7" r="4"></circle></svg>
                      </div>
                      <div>
                        <strong style={{ fontSize: '1.05em', color: seleccionado ? "#261d60" : "#2c3e50", display: "block" }}>{u.Nombre} {u.Apellido}</strong> 
                        <p style={{ margin: '2px 0 0 0', color: '#7f8c8d', fontSize: '0.85em' }}>Usuario: {u.Usuario}</p>
                      </div>
                    </div>
                    
                    {u.Rol?.Nombre === 'Admin' ? (
                      <span style={{ backgroundColor: "rgba(38, 29, 96, 0.1)", color: "#261d60", padding: "4px 12px", borderRadius: "20px", fontSize: "0.85em", fontWeight: "bold", border: "1px solid rgba(38, 29, 96, 0.2)" }}>
                        Admin
                      </span>
                    ) : (
                      <span style={{ backgroundColor: "transparent", color: "#666", padding: "4px 12px", borderRadius: "20px", fontSize: "0.85em", fontWeight: "bold", border: "1px solid #ccc" }}>
                        Cajero
                      </span>
                    )}
                  </li>
                );
              })}
            </ul>
          </section>
        </div>

        {/* =========================================
            SECCIÓN 2: ACCIONES RÁPIDAS
           ========================================= */}
        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(250px, 1fr))", gap: "20px", marginBottom: "40px" }}>
          <Link to="/crear-producto" style={{ ...styles.actionBtnSolid, textDecoration: "none" }}>
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="9" cy="21" r="1"></circle><circle cx="20" cy="21" r="1"></circle><path d="M1 1h4l2.68 13.39a2 2 0 0 0 2 1.61h9.72a2 2 0 0 0 2-1.61L23 6H6"></path><line x1="12" y1="5" x2="12" y2="15"></line><line x1="8" y1="10" x2="16" y2="10"></line></svg>
            Registrar Producto Nuevo
          </Link>
          
          <Link to="/editar-producto" style={{ ...styles.actionBtnOutline, textDecoration: "none" }}>
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"></path><path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"></path></svg>
            Editar Producto Existente
          </Link>
          
          <Link to="/historial-ventas" style={{ ...styles.actionBtnSolid, textDecoration: "none" }}>
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"></path><polyline points="14 2 14 8 20 8"></polyline><line x1="16" y1="13" x2="8" y2="13"></line><line x1="16" y1="17" x2="8" y2="17"></line><polyline points="10 9 9 9 8 9"></polyline></svg>
            Historial de Ventas
          </Link>
        </div>

        {/* =========================================
            SECCIÓN 3: ESTADO DEL STOCK (SEMÁFORO)
           ========================================= */}
        <section className="card" style={{ padding: "30px", borderRadius: "12px", boxShadow: "0 4px 15px rgba(0,0,0,0.05)", border: "1px solid #f0f0f0", backgroundColor: "white" }}>
          <h2 style={{ marginTop: 0, marginBottom: "10px", color: "#2c3e50" }}>Estado del Stock</h2>
          <p style={{ color: "#7f8c8d", marginBottom: "25px", paddingBottom: "15px", borderBottom: "2px solid #f4f6f8" }}>Monitoreo en tiempo real de la mercadería.</p>
          
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
                      fontWeight: 'bold', color: estilo.text, fontSize: "1.05em", 
                      backgroundColor: 'white', padding: '6px 15px', borderRadius: '20px', 
                      border: `1px solid ${estilo.text}20`, display: 'inline-flex', alignItems: 'center', gap: '6px'
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
  );
}

const styles = {
  inputOverride: {
    padding: "12px", borderRadius: "8px", border: "1px solid #dcdde1", fontSize: "0.95rem", outline: "none"
  },
  actionBtnSolid: {
    backgroundColor: "#261d60", color: "white", padding: "14px", border: "none", borderRadius: "8px", fontSize: "1rem", fontWeight: "bold", cursor: "pointer", display: "flex", justifyContent: "center", alignItems: "center", gap: "10px", boxShadow: "0 4px 10px rgba(38, 29, 96, 0.2)", transition: "transform 0.1s"
  },
  actionBtnOutline: {
    backgroundColor: "#e6e4f4", color: "#261d60", padding: "16px", border: "2px solid #261d60", borderRadius: "10px", fontSize: "1rem", fontWeight: "bold", cursor: "pointer", display: "flex", justifyContent: "center", alignItems: "center", gap: "10px", transition: "background 0.2s"
  },
  deleteBtn: {
    backgroundColor: "#ffebee", color: "#c62828", border: "1px solid #ffcdd2", padding: "12px", borderRadius: "8px", fontSize: "0.95rem", fontWeight: "bold", cursor: "pointer", display: "flex", justifyContent: "center", alignItems: "center", gap: "8px", transition: "background 0.2s"
  }
};