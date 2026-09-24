// pages/Pos.jsx
// Pantalla principal del Cajero (punto de venta).
// Responsabilidad: capturar el escaneo de código de barras y agregar el
// producto al carrito, mostrar el carrito con totales, manejar el cobro
// (efectivo/tarjeta/QR) usando components/BotonDenominacion y calcular vuelto,
// y permitir buscar/cargar cliente (components/BuscarClienteModal) si piden factura.
// Es la pantalla que más importa optimizar en velocidad (HU1.1, HU1.2).

import { useAuth } from "../context/AuthContext";

export default function Pos() {
  const { usuario, logout } = useAuth();

  return (
    <div style={{ padding: 24 }}>
      <div style={{ display: "flex", justifyContent: "space-between" }}>
        <h1>Punto de Venta</h1>
        <button onClick={logout}>Cerrar sesión</button>
      </div>
      <p>Bienvenido, {usuario?.nombre} — Rol: {usuario?.rol}</p>
      <p style={{ color: "#888" }}>(Pantalla de cobro en construcción — próximo sprint)</p>
    </div>
  );
}