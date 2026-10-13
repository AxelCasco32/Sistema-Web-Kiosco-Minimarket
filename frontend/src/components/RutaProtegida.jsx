import { Navigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";

export default function RutaProtegida({ children, rolesPermitidos }) {
  const { usuario, cargando } = useAuth();

  // Si está leyendo el localStorage, no mostramos nada para que no haya parpadeos raros
  if (cargando) return null; 

  // 1. Si no hay sesión iniciada, lo pateamos directo al Login
  if (!usuario) {
    return <Navigate to="/" replace />; 
  }

  // Obtenemos el nombre del rol (Ajustá esto si en tu BD se llama diferente, ej: usuario.rol o usuario.Rol_nombre)
  const rolDelUsuario = usuario.Rol?.Nombre || usuario.rol || usuario.Rol || 'Cajero';

  // 2. Si la ruta exige roles específicos y el usuario no lo tiene, lo mandamos a su lugar
  if (rolesPermitidos && !rolesPermitidos.includes(rolDelUsuario)) {
    if (rolDelUsuario === 'Cajero') {
      return <Navigate to="/pos" replace />;
    } else {
      return <Navigate to="/admin" replace />;
    }
  }

  // 3. Si tiene sesión y el rol correcto, lo dejamos pasar a la pantalla
  return children;
}