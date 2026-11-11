// pages/admin/Usuarios.jsx
// Módulo de Usuarios: alta, modificación y baja de cajeros y administradores.
import { useState, useEffect } from "react";
import { useAuth } from "../../context/AuthContext";
import api from "../../services/api";
import { alertaExito, alertaError, alertaAviso, confirmar, mensajeDeError } from "../../utils/alertas";
import "../../styles/common.css";

function Encabezado({ titulo, subtitulo }) {
  return (
    <div style={{ marginBottom: "22px" }}>
      <h1 style={{ margin: 0, color: "#261d60", fontSize: "1.6rem" }}>{titulo}</h1>
      {subtitulo && <p style={{ margin: "4px 0 0", color: "#7f8c8d" }}>{subtitulo}</p>}
    </div>
  );
}

export default function Usuarios() {
  const { usuario: usuarioActual } = useAuth();
  const [usuarios, setUsuarios] = useState([]);
  const [roles, setRoles] = useState([]);

  // Estado para saber si estamos editando
  const [idSeleccionado, setIdSeleccionado] = useState(null);

  const [nombre, setNombre] = useState("");
  const [apellido, setApellido] = useState("");
  const [user, setUser] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [idRol, setIdRol] = useState(1);

  const cargarDatos = async () => {
    try {
      const resUsuarios = await api.get("/usuarios");
      setUsuarios(resUsuarios.data);
      const resRoles = await api.get("/usuarios/roles");
      setRoles(resRoles.data);
    } catch (error) {
      console.error("Fallo al descargar los usuarios:", error);
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
    setEmail("");
    setPassword("");
    setIdRol(1);
  };

  const seleccionarParaEditar = (u) => {
    setIdSeleccionado(u.id_Usuario || u.id);
    setNombre(u.Nombre || "");
    setApellido(u.Apellido || "");
    setUser(u.Usuario || "");
    setEmail(u.Email || "");
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
          Email: email.trim(),
          password: password,
          id_Rol: Number(idRol)
        });
        alertaExito("Usuario modificado", `Se guardaron los cambios de "${user}".`);
      } else {
        await api.post("/usuarios", {
          Nombre: nombre,
          Apellido: apellido,
          Usuario: user,
          Email: email.trim(),
          password: password,
          id_Rol: Number(idRol)
        });
        alertaExito("Usuario creado", `"${user}" ya puede iniciar sesión.`);
      }

      limpiarFormulario();
      cargarDatos(); 
    } catch (error) {
      alertaError("No se pudo guardar", mensajeDeError(error, "Error al procesar la solicitud."));
    }
  };

  const handleEliminar = async () => {
    if (!idSeleccionado) return;

    const idLogueado = usuarioActual?.id || usuarioActual?.id_Usuario;
    if (String(idSeleccionado) === String(idLogueado)) {
      alertaAviso("Acción no permitida", "No podés eliminar tu propia cuenta mientras estás logueado.");
      return;
    }

    const ok = await confirmar({
      titulo: "¿Eliminar usuario?",
      texto: `Vas a eliminar a "${user}". Esta acción no se puede deshacer.`,
      textoConfirmar: "Sí, eliminar",
      peligro: true,
      icono: "warning",
    });
    if (!ok) return;

    try {
      await api.delete(`/usuarios/${idSeleccionado}`);
      alertaExito("Usuario eliminado", `"${user}" fue eliminado correctamente.`);
      limpiarFormulario();
      cargarDatos();
    } catch (error) {
      alertaError("No se pudo eliminar", mensajeDeError(error, "Error al eliminar el usuario."));
    }
  };

  return (
    <div className="r-pagina" style={{ padding: "30px", maxWidth: "1200px", margin: "0 auto" }}>
      <Encabezado titulo="Usuarios" subtitulo="Cajeros y administradores que pueden ingresar al sistema." />
        {/* =========================================
            SECCIÓN 1: FORMULARIO Y LISTA DE USUARIOS
           ========================================= */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(min(350px, 100%), 1fr))', gap: '30px', marginBottom: "40px" }}>
          
          {/* FORMULARIO DINÁMICO (CREAR / EDITAR) */}
          <section className="card r-card" style={{ padding: "30px", borderRadius: "12px", boxShadow: "0 4px 15px rgba(0,0,0,0.05)", border: "1px solid #f0f0f0", backgroundColor: "white" }}>
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
                type="email"
                placeholder="Email (para recuperar la contraseña)"
                autoComplete="email"
                maxLength={150}
                value={email}
                onChange={e => setEmail(e.target.value)}
                required
              />
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
          <section className="card r-card" style={{ padding: "30px", borderRadius: "12px", boxShadow: "0 4px 15px rgba(0,0,0,0.05)", border: "1px solid #f0f0f0", backgroundColor: "white" }}>
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
                        {u.Email ? (
                          <p style={{ margin: '2px 0 0 0', color: '#7f8c8d', fontSize: '0.85em', wordBreak: 'break-all' }}>{u.Email}</p>
                        ) : (
                          <p style={{ margin: '2px 0 0 0', color: '#c62828', fontSize: '0.82em', fontWeight: 'bold' }}>Sin email: editalo para poder recuperar la contraseña</p>
                        )}
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
