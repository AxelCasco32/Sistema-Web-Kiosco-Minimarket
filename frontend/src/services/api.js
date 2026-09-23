// services/api.js
// Cliente HTTP central (axios) para hablar con el backend.
// Responsabilidades:
//   - Configurar la baseURL de la API (http://localhost:4000/api).
//   - Adjuntar automáticamente el token JWT guardado (localStorage) a cada request.
// Todas las llamadas a la API deben pasar por acá, nunca hacer fetch/axios
// directo desde un componente o página.
import axios from 'axios';

const api = axios.create({
  baseURL: 'http://localhost:4000/api',
});

api.interceptors.request.use((config) => {
  const token = localStorage.getItem('token');
  if (token) config.headers.Authorization = `Bearer ${token}`;
  return config;
});

export default api;