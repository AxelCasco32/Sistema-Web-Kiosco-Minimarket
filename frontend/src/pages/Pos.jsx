// pages/Pos.jsx
import { useAuth } from "../context/AuthContext";
import { useState, useEffect } from "react";
import "../styles/common.css";
import "../styles/pos.css";
import api, { obtenerProductos } from "../services/api";
import BuscarClienteModal from "../components/BuscarClienteModal";
import { useNavigate } from "react-router-dom";
import CierreCajaModal from "../components/CierreCajaModal";

// Isotipos oficiales de KiosquitoYa
import iconoMorado from "../assets/IconoKiosquitoYa_morado.png";
import iconoBlanco from "../assets/IconoKiosquitoYa_blanco.png";

const CATEGORIAS_DISPONIBLES = [
  "Todos",
  "General",
  "Bebidas",
  "Alimentos",
  "Golosinas",
  "Limpieza",
  "Cigarrillos",
];

export default function Pos() {
  const { logout, usuario } = useAuth();
  const [carrito, setCarrito] = useState([]);
  const [productos, setProductos] = useState([]);
  const [medioPago, setMedioPago] = useState("efectivo");

  // Estado para alternar el isotipo en el header
  const [mostrarIconoBlanco, setMostrarIconoBlanco] = useState(false);

  // Estados para filtrado de productos
  const [categoriaSeleccionada, setCategoriaSeleccionada] = useState("Todos");
  const [busquedaTexto, setBusquedaTexto] = useState("");

  const [clienteSeleccionado, setClienteSeleccionado] = useState(null);
  const [mostrarModalCliente, setMostrarModalCliente] = useState(false);

  const [efectivoRecibido, setEfectivoRecibido] = useState("");
  const [numeroComprobante, setNumeroComprobante] = useState("");

  // Control en tiempo real de efectivo disponible en cajón (Fondo inicial + ventas acumuladas)
  const [efectivoEnCaja, setEfectivoEnCaja] = useState(0);

  const [cargando, setCargando] = useState(true);
  const [procesandoCobro, setProcesandoCobro] = useState(false);
  const [horaActual, setHoraActual] = useState(new Date());

  const navigate = useNavigate();
  const [mostrarCierre, setMostrarCierre] = useState(false);

  // Validación de turno abierto y carga inicial del saldo en cajón
  useEffect(() => {
    const turnoActivo = localStorage.getItem("id_turno");
    if (!turnoActivo) {
      navigate("/apertura-caja", { replace: true });
      return;
    }

    async function cargarEstadoCaja() {
      try {
        const res = await api.get(`/turnos/${turnoActivo}/resumen`);
        setEfectivoEnCaja(Number(res.data.totalEfectivo || 0));
      } catch (err) {
        console.error("No se pudo obtener el saldo de caja:", err);
      }
    }
    cargarEstadoCaja();
  }, [navigate]);

  useEffect(() => {
    const timer = setInterval(() => {
      setHoraActual(new Date());
    }, 1000);
    return () => clearInterval(timer);
  }, []);

  const cargarProductos = async () => {
    setCargando(true);
    try {
      const respuesta = await obtenerProductos();
      setProductos(respuesta.data);
    } catch (error) {
      console.error("Error al descargar los productos:", error);
    } finally {
      setCargando(false);
    }
  };

  useEffect(() => {
    cargarProductos();
  }, []);

  const manejarEscaneo = (e) => {
    if (e.key === "Enter") {
      e.preventDefault();
      const codigoEscaneado = e.target.value.trim();
      if (!codigoEscaneado) return;

      const producto = productos.find((p) => p.Cod_barra === codigoEscaneado);
      if (producto) {
        agregarProducto(producto.Cod_barra || producto.idProductos);
      } else {
        alert("Producto no encontrado en la base de datos");
      }
      e.target.value = "";
    }
  };

  const agregarProducto = (identificador) => {
    const producto = productos.find(
      (p) =>
        p.Cod_barra === identificador ||
        p.idProductos === identificador ||
        p.id === identificador
    );
    if (!producto) return;

    setCarrito((carritoActual) => {
      const productoExistente = carritoActual.find(
        (p) => (p.Cod_barra || p.idProductos || p.id) === identificador
      );
      if (productoExistente) {
        if (productoExistente.cantidad >= producto.Stock) {
          alert(`No hay suficiente stock. Stock máximo: ${producto.Stock}`);
          return carritoActual;
        }
        return carritoActual.map((p) =>
          (p.Cod_barra || p.idProductos || p.id) === identificador
            ? { ...p, cantidad: p.cantidad + 1 }
            : p
        );
      }

      if (producto.Stock < 1) {
        alert("Este producto está sin stock.");
        return carritoActual;
      }
      return [...carritoActual, { ...producto, cantidad: 1 }];
    });
  };

  const eliminarProducto = (identificador) => {
    setCarrito((carritoActual) =>
      carritoActual.filter(
        (producto) =>
          (producto.Cod_barra || producto.idProductos || producto.id) !==
          identificador
      )
    );
  };

  const cambiarCantidad = (identificador, cantidad) => {
    if (cantidad < 1) return;

    const productoBase = productos.find(
      (p) =>
        (p.Cod_barra || p.idProductos || p.id) === identificador
    );
    if (productoBase && cantidad > productoBase.Stock) {
      alert(`No podés vender más del stock disponible (${productoBase.Stock})`);
      return;
    }

    setCarrito((carritoActual) =>
      carritoActual.map((producto) =>
        (producto.Cod_barra || producto.idProductos || producto.id) ===
        identificador
          ? { ...producto, cantidad }
          : producto
      )
    );
  };

  const productosFiltrados = productos.filter((p) => {
    const coincideCategoria =
      categoriaSeleccionada === "Todos" ||
      (p.Categoria || "General").toLowerCase() ===
        categoriaSeleccionada.toLowerCase();

    const coincideTexto =
      p.Nombre.toLowerCase().includes(busquedaTexto.toLowerCase()) ||
      (p.Cod_barra && String(p.Cod_barra).includes(busquedaTexto));

    return coincideCategoria && coincideTexto;
  });

  const subtotal = carrito.reduce(
    (total, producto) => total + producto.Precio_Venta * producto.cantidad,
    0
  );
  const iva =
    clienteSeleccionado?.Condicion === "responsable_inscripto"
      ? subtotal * 0.21
      : 0;
  const total = subtotal + iva;
  const valorRecibidoNum = Number(efectivoRecibido) || 0;
  const vuelto = medioPago === "efectivo" ? valorRecibidoNum - total : 0;
  const faltaCambioEnCaja =
    medioPago === "efectivo" && valorRecibidoNum >= total && vuelto > efectivoEnCaja;

  const agregarBillete = (valor) => {
    setEfectivoRecibido((prev) => {
      const actual = Number(prev) || 0;
      return String(actual + valor);
    });
  };

  const pagoExacto = () => {
    setEfectivoRecibido(String(total));
  };

  const cobrar = async () => {
    if (carrito.length === 0) {
      alert("No hay productos en la venta.");
      return;
    }

    if (medioPago === "efectivo") {
      if (valorRecibidoNum < total) {
        alert("El efectivo recibido es menor al total de la venta.");
        return;
      }

      // Validación de efectivo físico para dar el vuelto
      if (vuelto > efectivoEnCaja) {
        alert(
          `Sin cambio suficiente en caja.\n\n` +
          `Vuelto a entregar: $${vuelto.toFixed(2)}\n` +
          `Efectivo físico disponible: $${efectivoEnCaja.toFixed(2)}\n` +
          `Diferencia faltante: $${(vuelto - efectivoEnCaja).toFixed(2)}\n\n` +
          `Solicitá billetes de menor denominación o cobrá por medio electrónico.`
        );
        return;
      }
    }

    if (
      (medioPago === "tarjeta" || medioPago === "transferencia") &&
      !numeroComprobante.trim()
    ) {
      alert("Por favor ingresá el número de comprobante o lote de la operación.");
      return;
    }

    setProcesandoCobro(true);

    try {
      const detalleVenta = carrito.map((prod) => ({
        idProductos: prod.idProductos || prod.id,
        cantidad: prod.cantidad,
        precio_unitario: prod.Precio_Venta,
      }));

      const idTurnoActual = localStorage.getItem("id_turno");

      const datosVenta = {
        total: total,
        metodo_pago: medioPago,
        tipo_cliente: clienteSeleccionado
          ? clienteSeleccionado.Condicion
          : "consumidor_final",
        id_cliente: clienteSeleccionado ? clienteSeleccionado.id : null,
        id_turno: idTurnoActual,
        comprobante: numeroComprobante,
        detalle: detalleVenta,
      };

      await api.post("/ventas", datosVenta);
      alert(`¡Venta procesada con éxito por $${total.toFixed(2)}!\nStock descontado.`);

      // Si fue en efectivo, sumamos el neto al cajón físico
      if (medioPago === "efectivo") {
        setEfectivoEnCaja((prev) => prev + total);
      }

      setCarrito([]);
      setEfectivoRecibido("");
      setNumeroComprobante("");
      setClienteSeleccionado(null);
      cargarProductos();
    } catch (error) {
      console.error("Error al registrar la venta:", error);
      alert("Error al procesar la venta. Revisá si el backend está encendido.");
    } finally {
      setProcesandoCobro(false);
    }
  };

  return (
    <div className="caja">
      {/* HEADER FIJO CON POSICIONAMIENTO ADHESIVO E ISOTIPO OFICIAL */}
      <header
        className="caja-header"
        style={{
          position: "sticky",
          top: 0,
          zIndex: 100,
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
          padding: "12px 30px",
          backgroundColor: "#261d60",
          boxShadow: "0 4px 15px rgba(0, 0, 0, 0.15)",
        }}
      >
        <div style={{ display: "flex", alignItems: "center", gap: "15px" }}>
          {/* Isotipo Oficial Interactivo */}
          <div
            onClick={() => setMostrarIconoBlanco(!mostrarIconoBlanco)}
            title="Hacé clic para alternar el estilo del ícono"
            style={{
              width: "42px",
              height: "42px",
              borderRadius: "10px",
              overflow: "hidden",
              cursor: "pointer",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              boxShadow: "0 3px 10px rgba(0,0,0,0.25)",
              border: "1px solid rgba(255, 255, 255, 0.2)",
              backgroundColor: mostrarIconoBlanco ? "#ffffff" : "transparent",
              transition: "transform 0.15s ease",
            }}
            onMouseEnter={(e) => (e.currentTarget.style.transform = "scale(1.05)")}
            onMouseLeave={(e) => (e.currentTarget.style.transform = "scale(1)")}
          >
            <img
              src={mostrarIconoBlanco ? iconoBlanco : iconoMorado}
              alt="KiosquitoYa Icon"
              style={{
                width: "100%",
                height: "100%",
                objectFit: "cover",
                display: "block",
              }}
            />
          </div>

          <div>
            <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
              <h1 style={{ margin: 0, fontSize: "1.4rem", fontWeight: "800", color: "white" }}>
                Caja POS
              </h1>
              <span
                style={{
                  backgroundColor: "rgba(255,255,255,0.2)",
                  padding: "3px 8px",
                  borderRadius: "6px",
                  fontSize: "0.8em",
                  color: "white",
                  border: "1px solid rgba(255,255,255,0.3)",
                  fontWeight: "600",
                }}
              >
                Turno Abierto
              </span>
            </div>
            <p style={{ margin: "2px 0 0 0", fontSize: "0.8em", color: "#b0a9d8" }}>
              Terminal de punto de venta
            </p>
          </div>

          {/* Dinero físico disponible en caja */}
          <div
            style={{
              backgroundColor: "rgba(255,255,255,0.12)",
              padding: "5px 12px",
              borderRadius: "20px",
              display: "flex",
              alignItems: "center",
              gap: "7px",
              color: "white",
              fontSize: "0.88em",
              border: "1px solid rgba(255,255,255,0.15)",
              marginLeft: "10px",
            }}
            title="Efectivo físico disponible actualmente en cajón"
          >
            <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="#a7f3d0" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
              <rect x="2" y="6" width="20" height="12" rx="2"></rect>
              <circle cx="12" cy="12" r="2"></circle>
              <path d="M6 12h.01M18 12h.01"></path>
            </svg>
            <span>Cajón:</span>
            <strong style={{ color: "#a7f3d0" }}>${efectivoEnCaja.toFixed(2)}</strong>
          </div>

          <span
            style={{
              color: "white",
              fontSize: "0.95em",
              fontWeight: "bold",
              letterSpacing: "1px",
              backgroundColor: "rgba(0,0,0,0.25)",
              padding: "5px 12px",
              borderRadius: "20px",
              display: "flex",
              alignItems: "center",
              gap: "8px",
            }}
          >
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
              <circle cx="12" cy="12" r="10"></circle>
              <polyline points="12 6 12 12 16 14"></polyline>
            </svg>
            {horaActual.toLocaleTimeString("es-AR", {
              hour: "2-digit",
              minute: "2-digit",
              second: "2-digit",
            })}
          </span>
        </div>

        <div style={{ display: "flex", alignItems: "center", gap: "16px" }}>
          {/* BOTÓN CERRAR CAJA */}
          <button
            onClick={() => setMostrarCierre(true)}
            style={{
              backgroundColor: "#f39c12",
              color: "white",
              padding: "8px 16px",
              border: "none",
              borderRadius: "8px",
              fontWeight: "bold",
              cursor: "pointer",
              display: "flex",
              alignItems: "center",
              gap: "8px",
              fontSize: "0.9em",
              boxShadow: "0 2px 8px rgba(243, 156, 18, 0.4)",
              transition: "transform 0.2s",
            }}
            onMouseOver={(e) => (e.currentTarget.style.transform = "scale(1.05)")}
            onMouseOut={(e) => (e.currentTarget.style.transform = "scale(1)")}
          >
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
              <rect x="3" y="11" width="18" height="11" rx="2" ry="2"></rect>
              <path d="M7 11V7a5 5 0 0 1 10 0v4"></path>
            </svg>
            CERRAR CAJA
          </button>

          {/* BURBUJA DEL USUARIO */}
          <div
            style={{
              display: "flex",
              alignItems: "center",
              gap: "12px",
              backgroundColor: "rgba(255,255,255,0.1)",
              padding: "6px 16px",
              borderRadius: "40px",
              border: "1px solid rgba(255,255,255,0.1)",
            }}
          >
            <span style={{ color: "white", fontSize: "0.95em", display: "flex", alignItems: "center", gap: "8px" }}>
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"></path>
                <circle cx="12" cy="7" r="4"></circle>
              </svg>
              <strong>{usuario?.nombre || "Juan"}</strong>
            </span>

            <div style={{ width: "1px", height: "18px", backgroundColor: "rgba(255,255,255,0.3)" }}></div>

            <button
              onClick={logout}
              style={{
                background: "transparent",
                color: "white",
                border: "none",
                padding: "4px 4px",
                fontSize: "0.9em",
                cursor: "pointer",
                display: "flex",
                alignItems: "center",
                gap: "6px",
                opacity: 0.7,
                transition: "opacity 0.2s",
              }}
              onMouseOver={(e) => (e.currentTarget.style.opacity = "1")}
              onMouseOut={(e) => (e.currentTarget.style.opacity = "0.7")}
              title="Cerrar sesión"
            >
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4"></path>
                <polyline points="16 17 21 12 16 7"></polyline>
                <line x1="21" y1="12" x2="9" y2="12"></line>
              </svg>
              Salir
            </button>
          </div>
        </div>
      </header>

      <main className="caja-contenido" style={{ padding: "30px 20px" }}>
        {/* SECCIÓN PRODUCTOS CON FILTRO POR CATEGORÍA */}
        <section
          className="card productos"
          style={{
            padding: "25px",
            borderRadius: "12px",
            boxShadow: "0 4px 15px rgba(0,0,0,0.02)",
          }}
        >
          <div
            style={{
              display: "flex",
              justifyContent: "space-between",
              alignItems: "center",
              marginBottom: "15px",
              flexWrap: "wrap",
              gap: "10px",
            }}
          >
            <h2 style={{ margin: 0, color: "#2c3e50" }}>Productos</h2>

            <div style={{ position: "relative", minWidth: "220px" }}>
              <input
                type="text"
                placeholder="Filtrar por nombre..."
                value={busquedaTexto}
                onChange={(e) => setBusquedaTexto(e.target.value)}
                style={{
                  width: "100%",
                  padding: "8px 12px 8px 32px",
                  borderRadius: "20px",
                  border: "1px solid #dcdde1",
                  fontSize: "0.9em",
                  outline: "none",
                  boxSizing: "border-box",
                }}
              />
              <svg
                width="16"
                height="16"
                viewBox="0 0 24 24"
                fill="none"
                stroke="#95a5a6"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
                style={{ position: "absolute", left: "10px", top: "10px" }}
              >
                <circle cx="11" cy="11" r="8"></circle>
                <line x1="21" y1="21" x2="16.65" y2="16.65"></line>
              </svg>
            </div>
          </div>

          {/* BARRA DE CATEGORÍAS */}
          <div
            style={{
              display: "flex",
              gap: "8px",
              overflowX: "auto",
              paddingBottom: "12px",
              marginBottom: "15px",
              borderBottom: "2px solid #f0f0f0",
            }}
          >
            {CATEGORIAS_DISPONIBLES.map((cat) => {
              const estaActiva =
                categoriaSeleccionada.toLowerCase() === cat.toLowerCase();
              return (
                <button
                  key={cat}
                  onClick={() => setCategoriaSeleccionada(cat)}
                  style={{
                    padding: "6px 14px",
                    borderRadius: "20px",
                    border: estaActiva ? "1px solid #261d60" : "1px solid #e0e0e0",
                    backgroundColor: estaActiva ? "#261d60" : "#ffffff",
                    color: estaActiva ? "#ffffff" : "#555555",
                    fontWeight: estaActiva ? "bold" : "normal",
                    fontSize: "0.85em",
                    cursor: "pointer",
                    whiteSpace: "nowrap",
                    transition: "all 0.2s ease",
                  }}
                  onMouseOver={(e) => {
                    if (!estaActiva) e.currentTarget.style.backgroundColor = "#f0edfd";
                  }}
                  onMouseOut={(e) => {
                    if (!estaActiva) e.currentTarget.style.backgroundColor = "#ffffff";
                  }}
                >
                  {cat}
                </button>
              );
            })}
          </div>

          <div
            className="productos-grid"
            style={{
              maxHeight: "calc(200vh - 250px)",
              overflowY: "auto",
              paddingRight: "8px",
            }}
          >
            {cargando ? (
              <div style={{ padding: "20px", textAlign: "center", color: "#7f8c8d" }}>
                Actualizando stock de productos...
              </div>
            ) : productosFiltrados.length === 0 ? (
              <p style={{ color: "#7f8c8d", fontStyle: "italic" }}>
                No se encontraron productos en esta categoría.
              </p>
            ) : (
              productosFiltrados.map((producto) => (
                <div
                  className="producto-card item-producto-interactivo"
                  key={producto.Cod_barra || producto.idProductos || producto.id}
                  style={{
                    borderRadius: "10px",
                    border: "1px solid #ddd",
                    padding: "15px",
                    display: "flex",
                    flexDirection: "column",
                    justifyContent: "space-between",
                    gap: "10px",
                    opacity: producto.Stock < 1 ? 0.6 : 1,
                  }}
                >
                  <div>
                    <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", gap: "5px" }}>
                      <h3 style={{ margin: "0 0 5px 0", fontSize: "1.05em", color: "#2c3e50" }}>
                        {producto.Nombre}
                      </h3>
                      <span
                        style={{
                          fontSize: "0.75em",
                          color: "#8c827a",
                          backgroundColor: "#f4f4f4",
                          padding: "2px 6px",
                          borderRadius: "4px",
                        }}
                      >
                        {producto.Categoria || "General"}
                      </span>
                    </div>
                    <p className="precio" style={{ margin: 0, fontWeight: "bold", color: "#261d60" }}>
                      ${Number(producto.Precio_Venta).toFixed(2)}
                    </p>

                    <div
                      style={{
                        margin: "3px 0 0 0",
                        display: "flex",
                        alignItems: "center",
                        gap: "5px",
                        color: producto.Stock <= 5 ? "#c62828" : "#7f8c8d",
                        fontSize: "0.85em",
                        fontWeight: producto.Stock <= 5 ? "bold" : "normal",
                      }}
                    >
                      {producto.Stock < 1 ? (
                        <>
                          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                            <circle cx="12" cy="12" r="10"></circle>
                            <line x1="15" y1="9" x2="9" y2="15"></line>
                            <line x1="9" y1="9" x2="15" y2="15"></line>
                          </svg>
                          Agotado
                        </>
                      ) : producto.Stock <= 5 ? (
                        <>
                          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                            <path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z"></path>
                            <line x1="12" y1="9" x2="12" y2="13"></line>
                            <line x1="12" y1="17" x2="12.01" y2="17"></line>
                          </svg>
                          Poco stock: {producto.Stock}
                        </>
                      ) : (
                        `Stock: ${producto.Stock}`
                      )}
                    </div>
                  </div>
                  <button
                    className="btn btn-primary"
                    onClick={() =>
                      agregarProducto(
                        producto.Cod_barra || producto.idProductos || producto.id
                      )
                    }
                    disabled={producto.Stock < 1}
                    style={{
                      padding: "8px",
                      borderRadius: "6px",
                      width: "100%",
                      fontSize: "0.95em",
                      border: "none",
                      color: "white",
                      backgroundColor: producto.Stock < 1 ? "#ccc" : "#261d60",
                      cursor: producto.Stock < 1 ? "not-allowed" : "pointer",
                    }}
                  >
                    Agregar
                  </button>
                </div>
              ))
            )}
          </div>
        </section>

        {/* SECCIÓN VENTA ACTUAL */}
        <section
          className="card carrito"
          style={{
            padding: "25px",
            borderRadius: "12px",
            boxShadow: "0 4px 15px rgba(0,0,0,0.02)",
          }}
        >
          <h2 style={{ marginTop: 0, marginBottom: "15px", color: "#2c3e50" }}>
            Venta actual
          </h2>

          <div style={{ marginBottom: "20px" }}>
            <div style={{ position: "relative" }}>
              <div style={{ position: "absolute", left: "12px", top: "10px", color: "#95a5a6" }}>
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M3 5v14c0 1.1.9 2 2 2h14a2 2 0 0 0 2-2V5a2 2 0 0 0-2-2H5a2 2 0 0 0-2-2z"></path>
                  <path d="M12 7v10"></path>
                  <path d="M8 9h8"></path>
                </svg>
              </div>
              <input
                autoFocus
                className="input input-interactivo"
                type="text"
                placeholder="Escanear barra o tipear y Enter..."
                onKeyDown={manejarEscaneo}
                style={{ paddingLeft: "40px", border: "2px solid #261d60" }}
              />
            </div>
          </div>

          <div
            style={{
              borderBottom: "2px solid #f0f0f0",
              paddingBottom: "15px",
              marginBottom: "15px",
              minHeight: "150px",
              maxHeight: "280px",
              overflowY: "auto",
              overflowX: "hidden",
            }}
          >
            {carrito.length === 0 ? (
              <p
                className="carrito-vacio"
                style={{
                  color: "#95a5a6",
                  textAlign: "center",
                  fontStyle: "italic",
                  marginTop: "40px",
                }}
              >
                No hay productos en la venta actual.
              </p>
            ) : (
              carrito.map((producto) => (
                <div
                  className="carrito-item fila-dashboard-interactiva"
                  key={producto.Cod_barra || producto.idProductos || producto.id}
                  style={{
                    padding: "12px",
                    borderRadius: "8px",
                    marginBottom: "8px",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "space-between",
                    gap: "10px",
                    border: "1px solid #f0f0f0",
                    backgroundColor: "#ffffff",
                  }}
                >
                  {/* Contenedor del Nombre y Precio Unitario */}
                  <div style={{ flex: "1 1 auto", minWidth: 0, paddingRight: "6px" }}>
                    <strong
                      style={{
                        color: "#2c3e50",
                        display: "-webkit-box",
                        WebkitLineClamp: 2, // Permite hasta 2 líneas si es largo
                        WebkitBoxOrient: "vertical",
                        overflow: "hidden",
                        fontSize: "0.95em",
                        lineHeight: "1.3",
                      }}
                      title={producto.Nombre}
                    >
                      {producto.Nombre}
                    </strong>
                    <span style={{ fontSize: "0.85em", color: "#7f8c8d", display: "block", marginTop: "2px" }}>
                      ${Number(producto.Precio_Venta).toFixed(2)} c/u
                    </span>
                  </div>

                  {/* Controles de Cantidad, Total y Borrar agrupados fijos */}
                  <div style={{ display: "flex", alignItems: "center", gap: "8px", flexShrink: 0 }}>
                    <input
                      className="input input-interactivo cantidad-input"
                      type="number"
                      min="1"
                      value={producto.cantidad}
                      onChange={(e) =>
                        cambiarCantidad(
                          producto.Cod_barra || producto.idProductos || producto.id,
                          Number(e.target.value)
                        )
                      }
                      style={{
                        width: "50px",
                        padding: "6px 4px",
                        fontSize: "0.95em",
                        textAlign: "center",
                        borderRadius: "6px",
                        margin: 0,
                      }}
                    />
                    <strong
                      style={{
                        minWidth: "75px",
                        textAlign: "right",
                        color: "#2c3e50",
                        fontSize: "1em",
                      }}
                    >
                      ${(Number(producto.Precio_Venta) * producto.cantidad).toFixed(2)}
                    </strong>
                    <button
                      onClick={() =>
                        eliminarProducto(
                          producto.Cod_barra || producto.idProductos || producto.id
                        )
                      }
                      style={{
                        background: "none",
                        border: "none",
                        cursor: "pointer",
                        color: "#95a5a6",
                        padding: "4px",
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "center",
                        transition: "color 0.2s",
                      }}
                      onMouseOver={(e) => (e.currentTarget.style.color = "#c62828")}
                      onMouseOut={(e) => (e.currentTarget.style.color = "#95a5a6")}
                      title="Eliminar producto"
                    >
                      <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                        <polyline points="3 6 5 6 21 6"></polyline>
                        <path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"></path>
                      </svg>
                    </button>
                  </div>
                </div>
              ))
            )}
          </div>

          <div className="opciones" style={{ marginBottom: "15px" }}>
            <h3 style={{ margin: "0 0 8px 0", fontSize: "0.95em", color: "#555" }}>
              Datos de Facturación
            </h3>
            <div className="tarjeta-cliente-activa">
              <div>
                <strong style={{ color: "#2c3e50", display: "block", fontSize: "1.05em" }}>
                  {clienteSeleccionado ? clienteSeleccionado.Nombre : "Consumidor Final"}
                </strong>
                {clienteSeleccionado && (
                  <span style={{ fontSize: "0.85em", color: "#7f8c8d" }}>
                    CUIT: {clienteSeleccionado.CUIT} |{" "}
                    {clienteSeleccionado.Condicion === "responsable_inscripto"
                      ? "Resp. Inscripto (Factura A)"
                      : "Factura B"}
                  </span>
                )}
              </div>
              <button
                onClick={() => setMostrarModalCliente(true)}
                style={{
                  display: "flex",
                  alignItems: "center",
                  gap: "6px",
                  backgroundColor: "#e6e4f4",
                  color: "#261d60",
                  border: "1px solid #c2bce0",
                  padding: "8px 12px",
                  borderRadius: "6px",
                  cursor: "pointer",
                  fontWeight: "bold",
                  fontSize: "0.9em",
                }}
              >
                {clienteSeleccionado ? (
                  <>
                    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                      <path d="M12 20h9"></path>
                      <path d="M16.5 3.5a2.121 2.121 0 0 1 3 3L7 19l-4 1 1-4L16.5 3.5z"></path>
                    </svg>
                    Cambiar
                  </>
                ) : (
                  <>
                    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                      <circle cx="11" cy="11" r="8"></circle>
                      <line x1="21" y1="21" x2="16.65" y2="16.65"></line>
                    </svg>
                    Buscar CUIT
                  </>
                )}
              </button>
            </div>
          </div>

          {mostrarModalCliente && (
            <BuscarClienteModal
              onClose={() => setMostrarModalCliente(false)}
              onSeleccionarCliente={(cliente) => {
                setClienteSeleccionado(cliente);
                setMostrarModalCliente(false);
              }}
            />
          )}

          <div
            className="opciones"
            style={{
              display: "flex",
              flexDirection: "column",
              gap: "8px",
              marginBottom: "15px",
            }}
          >
            <h3 style={{ margin: 0, fontSize: "0.95em", color: "#555" }}>
              Medio de pago
            </h3>
            <div className="medios-pago" style={{ display: "flex", gap: "8px" }}>
              <button
                style={{ flex: 1 }}
                className={medioPago === "efectivo" ? "activo" : ""}
                onClick={() => {
                  setMedioPago("efectivo");
                  setNumeroComprobante("");
                }}
              >
                Efectivo
              </button>
              <button
                style={{ flex: 1 }}
                className={medioPago === "tarjeta" ? "activo" : ""}
                onClick={() => {
                  setMedioPago("tarjeta");
                  setEfectivoRecibido("");
                }}
              >
                Tarjeta
              </button>
              <button
                style={{ flex: 1 }}
                className={medioPago === "transferencia" ? "activo" : ""}
                onClick={() => {
                  setMedioPago("transferencia");
                  setEfectivoRecibido("");
                }}
              >
                Transferencia
              </button>
            </div>
          </div>

          {medioPago === "efectivo" ? (
            <div className="caja-efectivo">
              <label htmlFor="efectivo" className="label-efectivo">
                Efectivo recibido ($)
              </label>
              <input
                id="efectivo"
                className="input input-interactivo input-efectivo"
                type="number"
                min="0"
                placeholder="0.00"
                value={efectivoRecibido}
                onChange={(e) => setEfectivoRecibido(e.target.value)}
              />

              <div className="grilla-billetes">
                <button type="button" className="btn-exacto" onClick={pagoExacto}>
                  Exacto
                </button>
                <button type="button" className="btn-billete" onClick={() => agregarBillete(50)}>$50</button>
                <button type="button" className="btn-billete" onClick={() => agregarBillete(100)}>$100</button>
                <button type="button" className="btn-billete" onClick={() => agregarBillete(200)}>$200</button>
                <button type="button" className="btn-billete" onClick={() => agregarBillete(500)}>$500</button>
                <button type="button" className="btn-billete" onClick={() => agregarBillete(1000)}>$1.000</button>
                <button type="button" className="btn-billete" onClick={() => agregarBillete(2000)}>$2.000</button>
                <button type="button" className="btn-billete" onClick={() => agregarBillete(10000)}>$10.000</button>
                <button type="button" className="btn-billete" onClick={() => agregarBillete(20000)}>$20.000</button>
                <button type="button" className="btn-limpiar" onClick={() => setEfectivoRecibido("")}>
                  Limpiar monto
                </button>
              </div>

              {/* CAJA DE VUELTO REESTRUCTURADA */}
              <div
                className="caja-vuelto"
                style={{
                  backgroundColor: faltaCambioEnCaja ? "#fef2f2" : "#f4fdf7",
                  border: faltaCambioEnCaja ? "1.5px solid #fecaca" : "1.5px solid #bbf7d0",
                  padding: "14px 16px",
                  borderRadius: "10px",
                  marginTop: "14px",
                  display: "flex",
                  flexDirection: "column",
                  gap: "10px",
                }}
              >
                {/* Fila principal con título y número alineados a los extremos */}
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                  <span
                    className="texto-vuelto"
                    style={{
                      color: faltaCambioEnCaja ? "#991b1b" : "#166534",
                      fontWeight: "800",
                      letterSpacing: "0.5px",
                      fontSize: "0.95em",
                    }}
                  >
                    VUELTO A ENTREGAR:
                  </span>
                  <strong
                    className="monto-vuelto"
                    style={{
                      color: faltaCambioEnCaja ? "#b91c1c" : "#166534",
                      fontSize: "1.45em",
                      fontWeight: "800",
                    }}
                  >
                    ${Math.max(vuelto, 0).toFixed(2)}
                  </strong>
                </div>

                {/* Franja de advertencia en bloque separado */}
                {faltaCambioEnCaja && (
                  <div
                    style={{
                      backgroundColor: "#fee2e2",
                      border: "1px solid #fca5a5",
                      borderRadius: "8px",
                      padding: "8px 12px",
                      display: "flex",
                      alignItems: "center",
                      gap: "10px",
                      color: "#991b1b",
                      fontSize: "0.85em",
                      lineHeight: "1.35",
                    }}
                  >
                    <svg
                      width="18"
                      height="18"
                      viewBox="0 0 24 24"
                      fill="none"
                      stroke="#b91c1c"
                      strokeWidth="2.5"
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      style={{ flexShrink: 0 }}
                    >
                      <circle cx="12" cy="12" r="10"></circle>
                      <line x1="12" y1="8" x2="12" y2="12"></line>
                      <line x1="12" y1="16" x2="12.01" y2="16"></line>
                    </svg>
                    <div>
                      <strong style={{ display: "block" }}>Sin cambio suficiente</strong>
                      <span>Disponible en cajón: <strong>${efectivoEnCaja.toFixed(2)}</strong></span>
                    </div>
                  </div>
                )}
              </div>
            </div>
          ) : (
            <div
              className="opciones"
              style={{
                display: "flex",
                flexDirection: "column",
                gap: "10px",
                backgroundColor: "#e6e4f4",
                padding: "15px",
                borderRadius: "8px",
                marginBottom: "15px",
                border: "1px solid #c2bce0",
              }}
            >
              <label
                htmlFor="comprobante"
                style={{ fontWeight: "bold", fontSize: "0.95em", color: "#261d60" }}
              >
                {medioPago === "tarjeta"
                  ? "Nº Lote / Comprobante POSNET"
                  : "Nº Operación / Comprobante App"}
              </label>
              <input
                id="comprobante"
                className="input input-interactivo"
                type="text"
                placeholder={medioPago === "tarjeta" ? "Ej: 1234" : "Ej: 987654321"}
                value={numeroComprobante}
                onChange={(e) => setNumeroComprobante(e.target.value)}
                style={{ padding: "10px 12px", fontSize: "1.1em", color: "#2c3e50" }}
              />
              <p
                style={{
                  margin: "5px 0 0 0",
                  fontSize: "0.85em",
                  color: "#555",
                  fontStyle: "italic",
                }}
              >
                * Verificá que la operación haya sido aprobada antes de registrarla.
              </p>
            </div>
          )}

          <div
            className="totales"
            style={{
              padding: "20px",
              backgroundColor: "#f8f9fa",
              borderRadius: "10px",
              border: "1px solid #e9ecef",
              display: "flex",
              flexDirection: "column",
              gap: "10px",
              marginBottom: "20px",
            }}
          >
            <p
              style={{
                margin: 0,
                display: "flex",
                justifyContent: "space-between",
                fontSize: "1.05em",
              }}
            >
              <span style={{ color: "#7f8c8d" }}>Subtotal:</span>
              <strong style={{ color: "#2c3e50" }}>${subtotal.toFixed(2)}</strong>
            </p>
            {clienteSeleccionado?.Condicion === "responsable_inscripto" && (
              <p
                style={{
                  margin: 0,
                  display: "flex",
                  justifyContent: "space-between",
                  fontSize: "1.05em",
                }}
              >
                <span style={{ color: "#7f8c8d" }}>IVA 21%:</span>
                <strong style={{ color: "#c62828" }}>${iva.toFixed(2)}</strong>
              </p>
            )}
            <h2
              style={{
                margin: "10px 0 0 0",
                display: "flex",
                justifyContent: "space-between",
                fontSize: "1.8em",
                borderTop: "2px solid #ddd",
                paddingTop: "15px",
                alignItems: "center",
              }}
            >
              <span style={{ color: "#2c3e50", fontSize: "0.8em", textTransform: "uppercase" }}>
                Total a Cobrar
              </span>
              <strong style={{ color: "#261d60" }}>${total.toFixed(2)}</strong>
            </h2>
          </div>

          <div style={{ display: "flex", gap: "15px" }}>
            <button
              className="btn-cancelar"
              onClick={() => {
                if (window.confirm("¿Estás seguro de cancelar esta venta?")) {
                  setCarrito([]);
                  setEfectivoRecibido("");
                  setNumeroComprobante("");
                  setClienteSeleccionado(null);
                }
              }}
              disabled={procesandoCobro}
              style={{
                flex: 1,
                padding: "14px",
                borderRadius: "8px",
                backgroundColor: "#fff",
                border: "2px solid #e0e0e0",
                color: "#757575",
                fontWeight: "bold",
                fontSize: "1em",
                transition: "all 0.2s",
                opacity: procesandoCobro ? 0.5 : 1,
              }}
              onMouseOver={(e) => {
                e.currentTarget.style.borderColor = "#c62828";
                e.currentTarget.style.color = "#c62828";
              }}
              onMouseOut={(e) => {
                e.currentTarget.style.borderColor = "#e0e0e0";
                e.currentTarget.style.color = "#757575";
              }}
            >
              Cancelar
            </button>
            <button
              className="btn-cobrar"
              onClick={cobrar}
              disabled={procesandoCobro || faltaCambioEnCaja}
              style={{
                flex: 2,
                padding: "14px",
                borderRadius: "8px",
                fontSize: "1.2em",
                display: "flex",
                justifyContent: "center",
                alignItems: "center",
                gap: "10px",
                boxShadow: faltaCambioEnCaja
                  ? "none"
                  : "0 4px 10px rgba(76, 175, 80, 0.3)",
                opacity: procesandoCobro || faltaCambioEnCaja ? 0.6 : 1,
                cursor:
                  procesandoCobro
                    ? "wait"
                    : faltaCambioEnCaja
                    ? "not-allowed"
                    : "pointer",
                backgroundColor: faltaCambioEnCaja ? "#94a3b8" : "",
              }}
            >
              <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                <path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"></path>
                <polyline points="22 4 12 14.01 9 11.01"></polyline>
              </svg>
              {procesandoCobro
                ? "Procesando..."
                : faltaCambioEnCaja
                ? "SIN CAMBIO SUFICIENTE"
                : "COBRAR"}
            </button>
          </div>
        </section>
      </main>

      {mostrarCierre && (
        <CierreCajaModal
          idTurno={localStorage.getItem("id_turno")}
          onClose={() => setMostrarCierre(false)}
          onCierreExitoso={() => {
            setMostrarCierre(false);
            logout();
          }}
        />
      )}
    </div>
  );
}