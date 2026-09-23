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

  useEffect(() => {
    const storedToken = localStorage.getItem("token");
    const storedUsuario = localStorage.getItem("usuario");

    if (storedToken && storedUsuario) {
      setToken(storedToken);
      setUsuario(JSON.parse(storedUsuario));
    }
  }, []);

  const login = ({ token, usuario }) => {
    setToken(token);
    setUsuario(usuario);
    localStorage.setItem("token", token);
    localStorage.setItem("usuario", JSON.stringify(usuario));
  };

  const logout = () => {
    setToken(null);
    setUsuario(null);
    localStorage.removeItem("token");
    localStorage.removeItem("usuario");
  };

  const autenticado = !!token;

  const valor = { usuario, token, autenticado, login, logout };

  return <AuthContext.Provider value={valor}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  return useContext(AuthContext);
}