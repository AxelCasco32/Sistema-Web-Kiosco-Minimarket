// pages/Pos.jsx
// Pantalla principal del Cajero (punto de venta).
// Responsabilidad: capturar el escaneo de código de barras y agregar el
// producto al carrito, mostrar el carrito con totales, manejar el cobro
// (efectivo/tarjeta/QR) usando components/BotonDenominacion y calcular vuelto,
// y permitir buscar/cargar cliente (components/BuscarClienteModal) si piden factura.
// Es la pantalla que más importa optimizar en velocidad (HU1.1, HU1.2).

import { useAuth } from "../context/AuthContext";
import { useState } from "react";
import "../styles/common.css";
import "../styles/pos.css";

const productos = [
  {
    id: 1,
    nombre: "Coca Cola 500ml",
    precio: 1800,
    stock: 20,
  },
  {
    id: 2,
    nombre: "Alfajor Triple",
    precio: 1200,
    stock: 15,
  },
  {
    id: 3,
    nombre: "Papas Fritas",
    precio: 1500,
    stock: 10,
  },
  {
    id: 4,
    nombre: "Agua Mineral 500ml",
    precio: 1000,
    stock: 25,
  },
  {
    id: 5,
    nombre: "Chocolates",
    precio: 2000,
    stock: 8,
  },
];

export default function Pos() {
  const [carrito, setCarrito] = useState([]);

  const [medioPago, setMedioPago] = useState("efectivo");

  const [tipoCliente, setTipoCliente] = useState("consumidor_final");

  const [efectivoRecibido, setEfectivoRecibido] = useState(0);

  // TO DO: Llamada al backend para productos

  const agregarProducto = (id) => {
    const producto = productos.find((p) => p.id === id);

    if (!producto) return;

    setCarrito((carritoActual) => {
      const productoExistente = carritoActual.find((p) => p.id === id);

      if (productoExistente) {
        return carritoActual.map((p) =>
          p.id === id
            ? {
                ...p,
                cantidad: p.cantidad + 1,
              }
            : p,
        );
      }

      return [
        ...carritoActual,
        {
          ...producto,
          cantidad: 1,
        },
      ];
    });
  };

  const eliminarProducto = (id) => {
    setCarrito((carritoActual) =>
      carritoActual.filter((producto) => producto.id !== id),
    );
  };

  const cambiarCantidad = (id, cantidad) => {
    if (cantidad < 1) return;

    setCarrito((carritoActual) =>
      carritoActual.map((producto) =>
        producto.id === id
          ? {
              ...producto,
              cantidad,
            }
          : producto,
      ),
    );
  };

  const subtotal = carrito.reduce(
    (total, producto) => total + producto.precio * producto.cantidad,
    0,
  );

  const iva = tipoCliente === "responsable_inscripto" ? subtotal * 0.21 : 0;

  const total = subtotal + iva;

  const vuelto = medioPago === "efectivo" ? efectivoRecibido - total : 0;

  const cobrar = () => {
    if (carrito.length === 0) {
      alert("No hay productos en la venta.");
      return;
    }

    if (medioPago === "efectivo" && efectivoRecibido < total) {
      alert("Efectivo insuficiente.");
      return;
    }

    alert(`Venta realizada por $${total.toFixed(2)}`);

    setCarrito([]);
    setEfectivoRecibido(0);
  };

  return (
    <div className="caja">
      {" "}
      {/* HEADER */}{" "}
      <header className="caja-header">
        {" "}
        <h1>Caja</h1>{" "}
        <div className="usuario-caja">
          {" "}
          <span>Usuario: </span> <strong>Cajero</strong>{" "}
        </div>{" "}
      </header>{" "}
      <main className="caja-contenido">
        {" "}
        {/* PRODUCTOS */}{" "}
        <section className="card productos">
          {" "}
          <h2>Productos</h2>{" "}
          <div className="productos-grid">
            {" "}
            {productos.map((producto) => (
              <div className="producto-card" key={producto.id}>
                {" "}
                <h3>{producto.nombre}</h3>{" "}
                <p className="precio"> ${producto.precio.toFixed(2)} </p>{" "}
                <p className="stock"> Stock: {producto.stock} </p>{" "}
                <button
                  className="btn btn-primary"
                  onClick={() => agregarProducto(producto.id)}
                >
                  {" "}
                  Agregar{" "}
                </button>{" "}
              </div>
            ))}{" "}
          </div>{" "}
        </section>{" "}
        {/* CARRITO */}{" "}
        <section className="card carrito">
          {" "}
          <h2>Venta actual</h2>{" "}
          {carrito.length === 0 ? (
            <p className="carrito-vacio"> No hay productos seleccionados. </p>
          ) : (
            carrito.map((producto) => (
              <div className="carrito-item" key={producto.id}>
                {" "}
                <div>
                  {" "}
                  <strong> {producto.nombre} </strong>{" "}
                  <p> ${producto.precio.toFixed(2)} </p>{" "}
                </div>{" "}
                <input
                  className="input cantidad-input"
                  type="number"
                  min="1"
                  value={producto.cantidad}
                  onChange={(e) =>
                    cambiarCantidad(producto.id, Number(e.target.value))
                  }
                />{" "}
                <strong>
                  {" "}
                  $ {(producto.precio * producto.cantidad).toFixed(2)}{" "}
                </strong>{" "}
                <button
                  className="btn-eliminar"
                  onClick={() => eliminarProducto(producto.id)}
                >
                  {" "}
                  X{" "}
                </button>{" "}
              </div>
            ))
          )}{" "}
          {/* CLIENTE */}{" "}
          <div className="opciones">
            {" "}
            <h3>Tipo de cliente</h3>{" "}
            <select
              className="input"
              value={tipoCliente}
              onChange={(e) => setTipoCliente(e.target.value)}
            >
              {" "}
              <option value="consumidor_final"> Consumidor Final </option>{" "}
              <option value="responsable_inscripto">
                {" "}
                Responsable Inscripto{" "}
              </option>{" "}
            </select>{" "}
          </div>{" "}
          {/* MEDIO DE PAGO */}{" "}
          <div className="opciones">
            {" "}
            <h3>Medio de pago</h3>{" "}
            <div className="medios-pago">
              {" "}
              <button
                className={medioPago === "efectivo" ? "activo" : ""}
                onClick={() => setMedioPago("efectivo")}
              >
                {" "}
                Efectivo{" "}
              </button>{" "}
              <button
                className={medioPago === "tarjeta" ? "activo" : ""}
                onClick={() => setMedioPago("tarjeta")}
              >
                {" "}
                Tarjeta{" "}
              </button>{" "}
              <button
                className={medioPago === "transferencia" ? "activo" : ""}
                onClick={() => setMedioPago("transferencia")}
              >
                {" "}
                Transferencia{" "}
              </button>{" "}
            </div>{" "}
          </div>{" "}
          {/* EFECTIVO */}{" "}
          {medioPago === "efectivo" && (
            <div className="opciones">
              {" "}
              <label htmlFor="efectivo"> Efectivo recibido </label>{" "}
              <input
                id="efectivo"
                className="input"
                type="number"
                value={efectivoRecibido}
                onChange={(e) => setEfectivoRecibido(Number(e.target.value))}
              />{" "}
              <p className="vuelto">
                {" "}
                <span>Vuelto:</span>{" "}
                <strong> ${Math.max(vuelto, 0).toFixed(2)} </strong>{" "}
              </p>{" "}
            </div>
          )}{" "}
          {/* TOTALES */}{" "}
          <div className="totales">
            {" "}
            <p>
              {" "}
              <span>Subtotal:</span>{" "}
              <strong> ${subtotal.toFixed(2)} </strong>{" "}
            </p>{" "}
            {tipoCliente === "responsable_inscripto" && (
              <p>
                {" "}
                <span>IVA 21%:</span> <strong> ${iva.toFixed(2)} </strong>{" "}
              </p>
            )}{" "}
            <h2>
              {" "}
              <span>Total:</span> <strong> ${total.toFixed(2)} </strong>{" "}
            </h2>{" "}
          </div>{" "}
          {/* COBRAR */}{" "}
          <button className="btn-cobrar" onClick={cobrar}>
            {" "}
            COBRAR{" "}
          </button>{" "}
          {/* CANCELAR */}{" "}
          <button
            className="btn-cancelar"
            onClick={() => {
              setCarrito([]);
              setEfectivoRecibido(0);
            }}
          >
            {" "}
            Cancelar venta{" "}
          </button>{" "}
        </section>{" "}
      </main>{" "}
    </div>
  );
}
