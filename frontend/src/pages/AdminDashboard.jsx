import { useState, useEffect, useMemo } from "react";
import { useAuth } from "../context/AuthContext";
import api from "../services/api";
import { Link } from "react-router-dom";
import "../styles/common.css";
import "../styles/pos.css"; 

// Isotipos oficiales de KiosquitoYa
import iconoMorado from "../assets/IconoKiosquitoYa_morado.png";
import iconoBlanco from "../assets/IconoKiosquitoYa_blanco.png";

export default function AdminDashboard() {
  const { logout, usuario: usuarioActual } = useAuth();
  const [usuarios, setUsuarios] = useState([]);
  const [roles, setRoles] = useState([]);
  const [productos, setProductos] = useState([]); 
  
  // Estado para alternar la variante del isotipo al hacer clic
  const [mostrarIconoBlanco, setMostrarIconoBlanco] = useState(false);

  // Estado para saber si estamos editando
  const [idSeleccionado, setIdSeleccionado] = useState(null);

  const [nombre, setNombre] = useState("");
  const [apellido, setApellido] = useState("");
  const [user, setUser] = useState("");
  const [password, setPassword] = useState("");
  const [idRol, setIdRol] = useState(1);

  // Estados de control para la sección de Stock
  const [busquedaStock, setBusquedaStock] = useState("");
  const [filtroAlerta, setFiltroAlerta] = useState("todos"); // 'todos', 'critico', 'moderado', 'optimo'
  const [ordenStock, setOrdenStock] = useState("menor"); // 'menor', 'mayor', 'nombre'
  
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
    setPassword("");
    setIdRol(u.id_Rol || u.Rol?.id_Rol || 1);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      if (idSeleccionado) {
        await api.put(`/usuarios/${idSeleccionado}`, {
          Nombre: nombre,
          Apellido: apellido,
          Usuario: user,
          password: password,
          id_Rol: Number(idRol)
        });
        alert("¡Usuario modificado con éxito!");
      } else {
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

  // Conteo reactivo para las píldoras de semáforo
  const conteoAlertas = useMemo(() => {
    return {
      critico: productos.filter((p) => p.Stock <= 5).length,
      moderado: productos.filter((p) => p.Stock > 5 && p.Stock <= 15).length,
      optimo: productos.filter((p) => p.Stock > 15).length,
    };
  }, [productos]);

  // Filtrado y ordenamiento de inventario
  const productosStockProcesados = useMemo(() => {
    return productos
      .filter((prod) => {
        const coincideTexto =
          (prod.Nombre || "").toLowerCase().includes(busquedaStock.toLowerCase()) ||
          (prod.Cod_barra && String(prod.Cod_barra).includes(busquedaStock));

        let coincideAlerta = true;
        if (filtroAlerta === "critico") coincideAlerta = prod.Stock <= 5;
        else if (filtroAlerta === "moderado") coincideAlerta = prod.Stock > 5 && prod.Stock <= 15;
        else if (filtroAlerta === "optimo") coincideAlerta = prod.Stock > 15;

        return coincideTexto && coincideAlerta;
      })
      .sort((a, b) => {
        if (ordenStock === "menor") return a.Stock - b.Stock;
        if (ordenStock === "mayor") return b.Stock - a.Stock;
        if (ordenStock === "nombre") return (a.Nombre || "").localeCompare(b.Nombre || "");
        return 0;
      });
  }, [productos, busquedaStock, filtroAlerta, ordenStock]);

  return (
    <div className="caja" style={{ backgroundColor: "#f4f6f8", minHeight: "100vh" }}>
      
      {/* HEADER DEL ADMIN CON ISOTIPO INTERACTIVO */}
{/* HEADER DEL ADMIN CON ISOTIPO INTERACTIVO (FIJO AL HACER SCROLL) */}
      <header
        className="caja-header"
        style={{
          position: "sticky",
          top: 0,
          zIndex: 100,
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
          padding: "14px 30px",
          backgroundColor: "#261d60",
          color: "white",
          boxShadow: "0 4px 15px rgba(0, 0, 0, 0.15)", // Sombra suave para separar del contenido al scrollear
        }}
      >        
      <div style={{ display: 'flex', alignItems: 'center', gap: '14px' }}>
          
          {/* Contenedor del Isotipo Oficial */}
          <div 
            onClick={() => setMostrarIconoBlanco(!mostrarIconoBlanco)}
            title="Hacé clic para alternar el estilo del ícono"
            style={{ 
              width: "44px", 
              height: "44px", 
              borderRadius: "10px", 
              overflow: "hidden", 
              cursor: "pointer", 
              display: "flex", 
              alignItems: "center", 
              justifyContent: "center",
              boxShadow: "0 3px 10px rgba(0,0,0,0.25)",
              border: "1px solid rgba(255, 255, 255, 0.2)",
              backgroundColor: mostrarIconoBlanco ? "#ffffff" : "transparent",
              transition: "transform 0.15s ease",
            }}
            onMouseEnter={(e) => (e.currentTarget.style.transform = "scale(1.05)")}
            onMouseLeave={(e) => (e.currentTarget.style.transform = "scale(1)")}
          >
            <img 
              src={mostrarIconoBlanco ? iconoBlanco : iconoMorado} 
              alt="KiosquitoYa Icon" 
              style={{ width: "100%", height: "100%", objectFit: "cover", display: "block" }}
            />
          </div>

          <div>
            <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
              <h1 style={{ margin: 0, fontSize: "1.45rem", fontWeight: "800", letterSpacing: "0.3px" }}>
                KiosquitoYa
              </h1>
              <span style={{ fontSize: "0.72em", backgroundColor: "rgba(255,255,255,0.18)", padding: "2px 8px", borderRadius: "10px", fontWeight: "600" }}>
                ADMIN
              </span>
            </div>
            <p style={{ margin: "2px 0 0 0", fontSize: "0.82em", opacity: 0.8 }}>
              Panel de control y administración central
            </p>
          </div>
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
            SECCIÓN 2: ACCIONES RÁPIDAS (ACTION CARDS)
           ========================================= */}
        <div style={{ marginBottom: "35px" }}>
          <div
            style={{
              display: "grid",
              gridTemplateColumns: "repeat(auto-fit, minmax(200px, 1fr))",
              gap: "16px",
            }}
          >
            {/* 1. Registrar Producto */}
            <Link
              to="/crear-producto"
              style={actionCardStyle}
              onMouseEnter={handleCardHover}
              onMouseLeave={handleCardLeave}
            >
              <div style={iconBadgeStyle}>
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#261d60" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
                  <circle cx="9" cy="21" r="1"></circle><circle cx="20" cy="21" r="1"></circle>
                  <path d="M1 1h4l2.68 13.39a2 2 0 0 0 2 1.61h9.72a2 2 0 0 0 2-1.61L23 6H6"></path>
                  <line x1="12" y1="5" x2="12" y2="15"></line><line x1="8" y1="10" x2="16" y2="10"></line>
                </svg>
              </div>
              <div>
                <strong style={{ color: "#2c3e50", fontSize: "0.95em", display: "block" }}>Nuevo Producto</strong>
                <span style={{ color: "#8c98a4", fontSize: "0.8em" }}>Cargar al catálogo</span>
              </div>
            </Link>

            {/* 2. Editar Producto */}
            <Link
              to="/editar-producto"
              style={actionCardStyle}
              onMouseEnter={handleCardHover}
              onMouseLeave={handleCardLeave}
            >
              <div style={iconBadgeStyle}>
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#261d60" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"></path>
                  <path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"></path>
                </svg>
              </div>
              <div>
                <strong style={{ color: "#2c3e50", fontSize: "0.95em", display: "block" }}>Editar Producto</strong>
                <span style={{ color: "#8c98a4", fontSize: "0.8em" }}>Precios y stock</span>
              </div>
            </Link>

            {/* 3. Historial de Ventas */}
            <Link
              to="/historial-ventas"
              style={actionCardStyle}
              onMouseEnter={handleCardHover}
              onMouseLeave={handleCardLeave}
            >
              <div style={iconBadgeStyle}>
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#261d60" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"></path>
                  <polyline points="14 2 14 8 20 8"></polyline>
                  <line x1="16" y1="13" x2="8" y2="13"></line><line x1="16" y1="17" x2="8" y2="17"></line>
                </svg>
              </div>
              <div>
                <strong style={{ color: "#2c3e50", fontSize: "0.95em", display: "block" }}>Ventas</strong>
                <span style={{ color: "#8c98a4", fontSize: "0.8em" }}>Historial y cobros</span>
              </div>
            </Link>

            {/* 4. Reportes */}
            <Link
              to="/reportes"
              style={actionCardStyle}
              onMouseEnter={handleCardHover}
              onMouseLeave={handleCardLeave}
            >
              <div style={iconBadgeStyle}>
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#261d60" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
                  <line x1="18" y1="20" x2="18" y2="10"></line>
                  <line x1="12" y1="20" x2="12" y2="4"></line>
                  <line x1="6" y1="20" x2="6" y2="14"></line>
                </svg>
              </div>
              <div>
                <strong style={{ color: "#2c3e50", fontSize: "0.95em", display: "block" }}>Reportes</strong>
                <span style={{ color: "#8c98a4", fontSize: "0.8em" }}>Ganancias y margen</span>
              </div>
            </Link>

            {/* 5. Auditoría */}
            <Link
              to="/auditoria-stock"
              style={actionCardStyle}
              onMouseEnter={handleCardHover}
              onMouseLeave={handleCardLeave}
            >
              <div style={iconBadgeStyle}>
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#261d60" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"></path>
                </svg>
              </div>
              <div>
                <strong style={{ color: "#2c3e50", fontSize: "0.95em", display: "block" }}>Auditoría</strong>
                <span style={{ color: "#8c98a4", fontSize: "0.8em" }}>Control de cambios</span>
              </div>
            </Link>
          </div>
        </div>

        {/* =========================================
            SECCIÓN 3: ESTADO DEL STOCK (MODERNIZADO)
           ========================================= */}
        <section
          style={{
            backgroundColor: "#ffffff",
            borderRadius: "14px",
            padding: "26px",
            boxShadow: "0 4px 18px rgba(0,0,0,0.03)",
            border: "1px solid #edf0f2",
            marginBottom: "30px",
          }}
        >
          {/* Encabezado y Selector de ordenamiento */}
          <div
            style={{
              display: "flex",
              justifyContent: "space-between",
              alignItems: "flex-start",
              flexWrap: "wrap",
              gap: "15px",
              marginBottom: "20px",
            }}
          >
            <div>
              <h2 style={{ margin: 0, color: "#2c3e50", fontSize: "1.35em", fontWeight: "700" }}>
                Estado del Stock
              </h2>
              <p style={{ margin: "4px 0 0 0", color: "#7f8c8d", fontSize: "0.9em" }}>
                Monitoreo en tiempo real para control de reposición de mercadería.
              </p>
            </div>

            <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
              <label style={{ fontSize: "0.85em", color: "#7f8c8d", fontWeight: "600" }}>
                Ordenar por:
              </label>
              <select
                value={ordenStock}
                onChange={(e) => setOrdenStock(e.target.value)}
                style={{
                  padding: "7px 12px",
                  borderRadius: "8px",
                  border: "1px solid #dcdde1",
                  fontSize: "0.88em",
                  color: "#2c3e50",
                  outline: "none",
                  backgroundColor: "#fcfdfe",
                  cursor: "pointer",
                }}
              >
                <option value="menor">Menor stock (urgente)</option>
                <option value="mayor">Mayor stock</option>
                <option value="nombre">Nombre (A - Z)</option>
              </select>
            </div>
          </div>

          {/* Barra de Filtros y Búsqueda */}
          <div
            style={{
              display: "flex",
              justifyContent: "space-between",
              alignItems: "center",
              gap: "15px",
              flexWrap: "wrap",
              paddingBottom: "18px",
              marginBottom: "18px",
              borderBottom: "1px solid #f1f2f6",
            }}
          >
            {/* Píldoras de estado */}
            <div style={{ display: "flex", gap: "8px", flexWrap: "wrap" }}>
              <button
                type="button"
                onClick={() => setFiltroAlerta("todos")}
                style={{
                  padding: "6px 14px",
                  borderRadius: "20px",
                  border: filtroAlerta === "todos" ? "1px solid #261d60" : "1px solid #e0e0e0",
                  backgroundColor: filtroAlerta === "todos" ? "#261d60" : "#ffffff",
                  color: filtroAlerta === "todos" ? "#ffffff" : "#555",
                  fontSize: "0.85em",
                  fontWeight: "600",
                  cursor: "pointer",
                  transition: "all 0.2s",
                }}
              >
                Todos ({productos.length})
              </button>

              <button
                type="button"
                onClick={() => setFiltroAlerta("critico")}
                style={{
                  padding: "6px 14px",
                  borderRadius: "20px",
                  border: "1px solid #ffcdd2",
                  backgroundColor: filtroAlerta === "critico" ? "#ffebee" : "#ffffff",
                  color: "#c62828",
                  fontSize: "0.85em",
                  fontWeight: "bold",
                  cursor: "pointer",
                  display: "flex",
                  alignItems: "center",
                  gap: "6px",
                }}
              >
                <span style={{ width: "8px", height: "8px", borderRadius: "50%", backgroundColor: "#c62828" }}></span>
                Crítico ({conteoAlertas.critico})
              </button>

              <button
                type="button"
                onClick={() => setFiltroAlerta("moderado")}
                style={{
                  padding: "6px 14px",
                  borderRadius: "20px",
                  border: "1px solid #ffe082",
                  backgroundColor: filtroAlerta === "moderado" ? "#fff8e1" : "#ffffff",
                  color: "#f57f17",
                  fontSize: "0.85em",
                  fontWeight: "bold",
                  cursor: "pointer",
                  display: "flex",
                  alignItems: "center",
                  gap: "6px",
                }}
              >
                <span style={{ width: "8px", height: "8px", borderRadius: "50%", backgroundColor: "#f57f17" }}></span>
                Moderado ({conteoAlertas.moderado})
              </button>

              <button
                type="button"
                onClick={() => setFiltroAlerta("optimo")}
                style={{
                  padding: "6px 14px",
                  borderRadius: "20px",
                  border: "1px solid #c8e6c9",
                  backgroundColor: filtroAlerta === "optimo" ? "#e8f5e9" : "#ffffff",
                  color: "#2e7d32",
                  fontSize: "0.85em",
                  fontWeight: "bold",
                  cursor: "pointer",
                  display: "flex",
                  alignItems: "center",
                  gap: "6px",
                }}
              >
                <span style={{ width: "8px", height: "8px", borderRadius: "50%", backgroundColor: "#2e7d32" }}></span>
                Óptimo ({conteoAlertas.optimo})
              </button>
            </div>

            {/* Buscador de producto por nombre o código */}
            <div style={{ position: "relative", minWidth: "240px", flex: "1 1 240px", maxWidth: "340px" }}>
              <input
                type="text"
                placeholder="Buscar por nombre o código..."
                value={busquedaStock}
                onChange={(e) => setBusquedaStock(e.target.value)}
                style={{
                  width: "100%",
                  padding: "8px 12px 8px 34px",
                  borderRadius: "20px",
                  border: "1px solid #dcdde1",
                  fontSize: "0.88em",
                  outline: "none",
                  boxSizing: "border-box",
                }}
              />
              <svg
                width="16"
                height="16"
                viewBox="0 0 24 24"
                fill="none"
                stroke="#95a5a6"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
                style={{ position: "absolute", left: "12px", top: "10px" }}
              >
                <circle cx="11" cy="11" r="8"></circle>
                <line x1="21" y1="21" x2="16.65" y2="16.65"></line>
              </svg>
            </div>
          </div>

          {/* Lista con Scroll Interno y Bordado Fino Perimetral */}
          <div
            style={{
              maxHeight: "420px",
              overflowY: "auto",
              paddingRight: "6px",
              display: "flex",
              flexDirection: "column",
              gap: "10px",
            }}
          >
            {productosStockProcesados.length === 0 ? (
              <div style={{ padding: "30px", textAlign: "center", color: "#95a5a6" }}>
                No se encontraron productos que coincidan con los filtros aplicados.
              </div>
            ) : (
              productosStockProcesados.map((prod) => {
                const esCritico = prod.Stock <= 5;
                const esModerado = prod.Stock > 5 && prod.Stock <= 15;

                const colorBordeFino = esCritico ? "#ffcdd2" : esModerado ? "#ffe082" : "#c8e6c9";
                const colorBadgeFondo = esCritico ? "#ffebee" : esModerado ? "#fff8e1" : "#e8f5e9";
                const colorBadgeTexto = esCritico ? "#c62828" : esModerado ? "#b78103" : "#2e7d32";

                return (
                  <div
                    key={prod.idProductos || prod.Cod_barra || prod.id}
                    style={{
                      backgroundColor: "#ffffff",
                      border: `1.5px solid ${colorBordeFino}`,
                      borderRadius: "10px",
                      padding: "14px 18px",
                      display: "flex",
                      justifyContent: "space-between",
                      alignItems: "center",
                      transition: "all 0.2s ease",
                      boxShadow: "0 2px 5px rgba(0,0,0,0.02)",
                    }}
                    onMouseOver={(e) => {
                      e.currentTarget.style.transform = "translateY(-1px)";
                      e.currentTarget.style.boxShadow = "0 4px 10px rgba(0,0,0,0.05)";
                    }}
                    onMouseOut={(e) => {
                      e.currentTarget.style.transform = "translateY(0)";
                      e.currentTarget.style.boxShadow = "0 2px 5px rgba(0,0,0,0.02)";
                    }}
                  >
                    <div>
                      <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
                        <strong style={{ color: "#2c3e50", fontSize: "1.05em" }}>
                          {prod.Nombre}
                        </strong>
                        <span
                          style={{
                            backgroundColor: "#f0edfd",
                            color: "#261d60",
                            fontSize: "0.75em",
                            padding: "2px 8px",
                            borderRadius: "12px",
                            fontWeight: "600",
                          }}
                        >
                          {prod.Categoria || "General"}
                        </span>
                      </div>
                      <span style={{ fontSize: "0.85em", color: "#8c98a4", marginTop: "3px", display: "block" }}>
                        Cod: {prod.Cod_barra || "Sin código"}
                      </span>
                    </div>

                    <div
                      style={{
                        backgroundColor: colorBadgeFondo,
                        color: colorBadgeTexto,
                        padding: "6px 14px",
                        borderRadius: "20px",
                        fontWeight: "bold",
                        fontSize: "0.9em",
                        display: "flex",
                        alignItems: "center",
                        gap: "7px",
                        border: `1px solid ${colorBadgeTexto}30`,
                      }}
                    >
                      {esCritico ? (
                        <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                          <path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z"></path>
                          <line x1="12" y1="9" x2="12" y2="13"></line>
                          <line x1="12" y1="17" x2="12.01" y2="17"></line>
                        </svg>
                      ) : esModerado ? (
                        <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                          <circle cx="12" cy="12" r="10"></circle>
                          <line x1="12" y1="8" x2="12" y2="12"></line>
                          <line x1="12" y1="16" x2="12.01" y2="16"></line>
                        </svg>
                      ) : (
                        <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                          <polyline points="20 6 9 17 4 12"></polyline>
                        </svg>
                      )}
                      Stock: {prod.Stock}
                    </div>
                  </div>
                );
              })
            )}
          </div>
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

const actionCardStyle = {
  backgroundColor: "#ffffff",
  border: "1px solid #edf0f2",
  borderRadius: "12px",
  padding: "16px 18px",
  textDecoration: "none",
  display: "flex",
  alignItems: "center",
  gap: "14px",
  boxShadow: "0 2px 8px rgba(0,0,0,0.02)",
  transition: "all 0.2s ease",
  cursor: "pointer",
};

const iconBadgeStyle = {
  width: "42px",
  height: "42px",
  borderRadius: "10px",
  backgroundColor: "#f0edfd",
  display: "flex",
  justifyContent: "center",
  alignItems: "center",
  flexShrink: 0,
};

const handleCardHover = (e) => {
  e.currentTarget.style.transform = "translateY(-2px)";
  e.currentTarget.style.boxShadow = "0 6px 16px rgba(38, 29, 96, 0.08)";
  e.currentTarget.style.borderColor = "#c5c0e6";
};

const handleCardLeave = (e) => {
  e.currentTarget.style.transform = "translateY(0)";
  e.currentTarget.style.boxShadow = "0 2px 8px rgba(0,0,0,0.02)";
  e.currentTarget.style.borderColor = "#edf0f2";
};