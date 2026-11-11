// services/socket.js
// Conexión en tiempo real (WebSockets con socket.io) al backend.
// Usa el mismo servidor que la API: VITE_API_URL sin el "/api" final.
import { io } from "socket.io-client";

const API_URL = import.meta.env.VITE_API_URL || "http://localhost:4000/api";
const SERVIDOR = API_URL.replace(/\/api\/?$/, "");

// Conexión para el panel de Admin (el backend rechaza a quien no es Admin)
export function conectarTiempoReal() {
  return io(SERVIDOR, {
    auth: { token: localStorage.getItem("token") },
    transports: ["websocket", "polling"],
    reconnection: true,
    reconnectionDelay: 2000,
  });
}
