import { Navigate, useLocation } from "react-router-dom";
import { useAuth } from "../context/AuthContext";

export default function RutaProtegida({ children, rolesPermitidos }) {
  const { usuario, cargando } = useAuth();
  const location = useLocation(); // Esto nos dice a qué URL exacta quiere ir el usuario

  if (cargando) return null; 

  // 1. Si no hay sesión iniciada, lo pateamos directo a la raíz (Login)
  if (!usuario) {
    return <Navigate to="/" replace />; 
  }

  const rolDelUsuario = usuario.Rol?.Nombre || usuario.rol || usuario.Rol || 'Cajero';

  // 2. Control de Roles
  if (rolesPermitidos && !rolesPermitidos.includes(rolDelUsuario)) {
    if (rolDelUsuario === 'Cajero') {
      return <Navigate to="/apertura-caja" replace />;
    } else {
      return <Navigate to="/admin" replace />;
    }
  }

  // --- CANDADOS ESTRICTOS DE CAJA ---
  const turnoActivo = localStorage.getItem("id_turno");

  // 3A. Si es Cajero, quiere entrar al POS, pero NO abrió la caja -> Lo obligamos a abrirla
  if (location.pathname === "/pos" && !turnoActivo) {
    return <Navigate to="/apertura-caja" replace />;
  }

  // 3B. Si ya tiene la caja abierta e intenta volver a la pantalla de Apertura (por ej. con la flecha de atrás) -> Lo devolvemos al POS
  if (location.pathname === "/apertura-caja" && turnoActivo) {
    return <Navigate to="/pos" replace />;
  }

  // 4. Si todo está en orden, lo dejamos pasar
  return children;
}