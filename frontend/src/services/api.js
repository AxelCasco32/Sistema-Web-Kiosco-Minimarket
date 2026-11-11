// services/api.js
// Cliente HTTP central (axios) para hablar con el backend.
// Responsabilidades:
//   - Configurar la baseURL de la API: VITE_API_URL en producción (Vercel),
//     http://localhost:4000/api en desarrollo.
//   - Adjuntar automáticamente el token JWT guardado (localStorage) a cada request.
// Todas las llamadas a la API deben pasar por acá, nunca hacer fetch/axios
// directo desde un componente o página.
import axios from 'axios';

const api = axios.create({
  baseURL: import.meta.env.VITE_API_URL || 'http://localhost:4000/api',
});

api.interceptors.request.use((config) => {
  const token = localStorage.getItem('token');
  if (token) config.headers.Authorization = `Bearer ${token}`;
  return config;
});

export default api;

// Función para obtener todos los productos del backend
export const obtenerProductos = async () => {
  return await api.get('/productos'); 
};