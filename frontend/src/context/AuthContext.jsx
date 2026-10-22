// context/AuthContext.jsx
// Contexto global de sesión.
// Responsabilidad: guardar el usuario logueado y su rol (Admin/Cajero),
// exponer funciones de login/logout, y persistir el token para que no se
// pierda la sesión al refrescar la página.

// pages/Login.jsx
// context/AuthContext.jsx
import { createContext, useContext, useEffect, useState } from "react";

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [usuario, setUsuario] = useState(null);
  const [token, setToken] = useState(null);
  const [cargando, setCargando] = useState(true); // Clave para que no parpadee la pantalla

  useEffect(() => {
    const storedToken = localStorage.getItem("token");
    const storedUsuario = localStorage.getItem("usuario");

    if (storedToken && storedUsuario) {
      setToken(storedToken);
      setUsuario(JSON.parse(storedUsuario));
    }
    setCargando(false); // Ya terminó de leer el disco
  }, []);

  const login = (userData, userToken) => {
    localStorage.setItem("token", userToken);
    localStorage.setItem("usuario", JSON.stringify(userData));
    setToken(userToken);
    setUsuario(userData);
  };

  const logout = () => {
    localStorage.removeItem("token");
    localStorage.removeItem("usuario");
    setToken(null);
    setUsuario(null);
  };

  return (
    <AuthContext.Provider value={{ usuario, token, login, logout, cargando }}>
      {children}
    </AuthContext.Provider>
  );
}

// Exportamos el hook acá mismo para no usar el archivo vacío de Lautaro
export const useAuth = () => {
  return useContext(AuthContext);
};