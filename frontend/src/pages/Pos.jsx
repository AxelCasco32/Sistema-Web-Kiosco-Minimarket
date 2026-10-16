// pages/Pos.jsx
import { useAuth } from "../context/AuthContext";
import { useState, useEffect } from "react";
import "../styles/common.css";
import "../styles/pos.css";
import api, { obtenerProductos } from "../services/api";
import BuscarClienteModal from "../components/BuscarClienteModal";
import { useNavigate } from "react-router-dom";
import CierreCajaModal from "../components/CierreCajaModal";

export default function Pos() {
  const { logout, usuario } = useAuth();
  const [carrito, setCarrito] = useState([]);
  const [productos, setProductos] = useState([]);
  const [medioPago, setMedioPago] = useState("efectivo");
  
  const [clienteSeleccionado, setClienteSeleccionado] = useState(null);
  const [mostrarModalCliente, setMostrarModalCliente] = useState(false);
  
  const [efectivoRecibido, setEfectivoRecibido] = useState("");
  const [numeroComprobante, setNumeroComprobante] = useState("");
  
  const [cargando, setCargando] = useState(true);
  const [procesandoCobro, setProcesandoCobro] = useState(false);
const [horaActual, setHoraActual] = useState(new Date());

const navigate = useNavigate();

  // CANDADO EXTRA: Si entra al POS pero no abrió la caja, lo pateamos a la apertura
  useEffect(() => {
    const turnoActivo = localStorage.getItem("id_turno");
    if (!turnoActivo) {
      navigate("/apertura-caja", { replace: true });
    }
  }, [navigate]);

const [mostrarCierre, setMostrarCierre] = useState(false);
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

      const producto = productos.find(p => p.Cod_barra === codigoEscaneado);
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
      (p) => p.Cod_barra === identificador || p.idProductos === identificador || p.id === identificador
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
          (p.Cod_barra || p.idProductos || p.id) === identificador ? { ...p, cantidad: p.cantidad + 1 } : p
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
      carritoActual.filter((producto) => (producto.Cod_barra || producto.idProductos || producto.id) !== identificador)
    );
  };

  const cambiarCantidad = (identificador, cantidad) => {
    if (cantidad < 1) return;
    
    const productoBase = productos.find(p => (p.Cod_barra || p.idProductos || p.id) === identificador);
    if (productoBase && cantidad > productoBase.Stock) {
      alert(`No podés vender más del stock disponible (${productoBase.Stock})`);
      return;
    }

    setCarrito((carritoActual) =>
      carritoActual.map((producto) =>
        (producto.Cod_barra || producto.idProductos || producto.id) === identificador ? { ...producto, cantidad } : producto
      )
    );
  };

  const subtotal = carrito.reduce((total, producto) => total + producto.Precio_Venta * producto.cantidad, 0);
  const iva = clienteSeleccionado?.Condicion === "responsable_inscripto" ? subtotal * 0.21 : 0;
  const total = subtotal + iva;
  const valorRecibidoNum = Number(efectivoRecibido) || 0;
  const vuelto = medioPago === "efectivo" ? valorRecibidoNum - total : 0;

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
    if (medioPago === "efectivo" && valorRecibidoNum < total) {
      alert("El efectivo recibido es menor al total de la venta.");
      return;
    }
    if ((medioPago === "tarjeta" || medioPago === "transferencia") && !numeroComprobante.trim()) {
      alert("Por favor ingresá el número de comprobante o lote de la operación.");
      return;
    }

    setProcesandoCobro(true);

    try {
      const detalleVenta = carrito.map(prod => ({
        idProductos: prod.idProductos || prod.id,
        cantidad: prod.cantidad,
        precio_unitario: prod.Precio_Venta
      }));

      // LEEMOS EL TURNO ACTIVO
      const idTurnoActual = localStorage.getItem("id_turno");

      const datosVenta = {
        total: total,
        metodo_pago: medioPago,
        tipo_cliente: clienteSeleccionado ? clienteSeleccionado.Condicion : "consumidor_final",
        id_cliente: clienteSeleccionado ? clienteSeleccionado.id : null,
        id_turno: idTurnoActual, // LO AGREGAMOS AL ENVÍO
        comprobante: numeroComprobante,
        detalle: detalleVenta 
      };

      await api.post('/ventas', datosVenta);
      alert(`¡Venta procesada con éxito por $${total.toFixed(2)}!\nStock descontado.`);
      
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
      <header className="caja-header" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '15px 30px' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '15px' }}>
          <h1 style={{ margin: 0 }}>Caja</h1>
          <span style={{ backgroundColor: 'rgba(255,255,255,0.2)', padding: '4px 10px', borderRadius: '6px', fontSize: '0.85em', color: 'white', border: '1px solid rgba(255,255,255,0.3)' }}>
            Turno Abierto
          </span>
          <span style={{ 
            color: 'white', 
            fontSize: '1.05em', 
            fontWeight: 'bold', 
            letterSpacing: '1px', 
            backgroundColor: 'rgba(0,0,0,0.2)', 
            padding: '6px 14px', 
            borderRadius: '20px',
            display: 'flex',
            alignItems: 'center',
            gap: '8px'
          }}>
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
              <circle cx="12" cy="12" r="10"></circle>
              <polyline points="12 6 12 12 16 14"></polyline>
            </svg>
            {horaActual.toLocaleTimeString("es-AR", { hour: "2-digit", minute: "2-digit", second: "2-digit" })}
          </span>
        </div>
        
        <div style={{ display: 'flex', alignItems: 'center', gap: '20px' }}>
          
          {/* BOTÓN CERRAR CAJA (Financiero - Separado y con color Ámbar/Naranja) */}
          <button 
            onClick={() => setMostrarCierre(true)} 
            style={{ 
              backgroundColor: "#f39c12", // Naranja llamativo, distinto al rojo de error
              color: "white", 
              padding: "8px 18px", 
              border: "none", 
              borderRadius: "8px", 
              fontWeight: "bold", 
              cursor: "pointer",
              display: "flex",
              alignItems: "center",
              gap: "8px",
              fontSize: "0.95em",
              boxShadow: "0 2px 8px rgba(243, 156, 18, 0.4)",
              transition: "transform 0.2s"
            }}
            onMouseOver={(e) => e.currentTarget.style.transform = "scale(1.05)"}
            onMouseOut={(e) => e.currentTarget.style.transform = "scale(1)"}
          >
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
              <rect x="3" y="11" width="18" height="11" rx="2" ry="2"></rect>
              <path d="M7 11V7a5 5 0 0 1 10 0v4"></path>
            </svg>
            CERRAR CAJA
          </button>

          {/* BURBUJA DEL USUARIO */}
          <div style={{ display: 'flex', alignItems: 'center', gap: '12px', backgroundColor: 'rgba(255,255,255,0.1)', padding: '6px 16px', borderRadius: '40px', border: '1px solid rgba(255,255,255,0.1)' }}>
            <span style={{ color: 'white', fontSize: '0.95em', display: 'flex', alignItems: 'center', gap: '8px' }}>
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"></path><circle cx="12" cy="7" r="4"></circle></svg>
              <strong>{usuario?.nombre || 'Juan'}</strong>
            </span>
            
            {/* Pequeña línea separadora */}
            <div style={{ width: '1px', height: '18px', backgroundColor: 'rgba(255,255,255,0.3)' }}></div>

            {/* BOTÓN CERRAR SESIÓN (Sutil, transparente) */}
            <button 
              onClick={logout} 
              style={{ 
                background: 'transparent', 
                color: 'white', 
                border: 'none', 
                padding: '4px 4px', 
                fontSize: '0.9em', 
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                gap: '6px',
                opacity: 0.7,
                transition: "opacity 0.2s"
              }}
              onMouseOver={(e) => e.currentTarget.style.opacity = "1"}
              onMouseOut={(e) => e.currentTarget.style.opacity = "0.7"}
              title="Cerrar sesión"
            >
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4"></path><polyline points="16 17 21 12 16 7"></polyline><line x1="21" y1="12" x2="9" y2="12"></line></svg>
              Salir
            </button>
          </div>

        </div>
      </header>
      
      <main className="caja-contenido" style={{ padding: "30px 20px" }}>
        
        <section className="card productos" style={{ padding: "25px", borderRadius: "12px", boxShadow: "0 4px 15px rgba(0,0,0,0.02)" }}>
          <h2 style={{ marginTop: 0, marginBottom: "20px", paddingBottom: "10px", borderBottom: "2px solid #f0f0f0", color: "#2c3e50" }}>Productos</h2>
          
          <div className="productos-grid">
            {cargando ? (
              <div style={{ padding: "20px", textAlign: "center", color: "#7f8c8d" }}>Actualizando stock de productos...</div>
            ) : productos.length === 0 ? (
              <p>No hay productos registrados en el sistema.</p>
            ) : (
              productos.map((producto) => (
                <div 
                  className="producto-card item-producto-interactivo" 
                  key={producto.Cod_barra || producto.idProductos || producto.id}
                  style={{ borderRadius: "10px", border: "1px solid #ddd", padding: "15px", display: "flex", flexDirection: "column", justifyContent: "space-between", gap: "10px", opacity: producto.Stock < 1 ? 0.6 : 1 }}
                >
                  <div>
                    <h3 style={{ margin: "0 0 5px 0", fontSize: "1.1em", color: "#2c3e50" }}>{producto.Nombre}</h3>
                    <p className="precio" style={{ margin: 0, fontWeight: "bold", color: "#261d60" }}> ${Number(producto.Precio_Venta).toFixed(2)} </p>
                    
                    <div style={{ margin: "3px 0 0 0", display: "flex", alignItems: "center", gap: "5px", color: producto.Stock <= 5 ? "#c62828" : "#7f8c8d", fontSize: "0.9em", fontWeight: producto.Stock <= 5 ? "bold" : "normal" }}>
                      {producto.Stock < 1 ? (
                        <><svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><circle cx="12" cy="12" r="10"></circle><line x1="15" y1="9" x2="9" y2="15"></line><line x1="9" y1="9" x2="15" y2="15"></line></svg> Agotado</>
                      ) : producto.Stock <= 5 ? (
                        <><svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z"></path><line x1="12" y1="9" x2="12" y2="13"></line><line x1="12" y1="17" x2="12.01" y2="17"></line></svg> Poco stock: {producto.Stock}</>
                      ) : (
                        `Stock: ${producto.Stock}`
                      )}
                    </div>
                  </div>
                  <button
                    className="btn btn-primary"
                    onClick={() => agregarProducto(producto.Cod_barra || producto.idProductos || producto.id)}
                    disabled={producto.Stock < 1}
                    style={{ padding: "8px", borderRadius: "6px", width: "100%", fontSize: "0.95em", border: "none", color: "white", backgroundColor: producto.Stock < 1 ? "#ccc" : "#261d60", cursor: producto.Stock < 1 ? "not-allowed" : "pointer" }}
                  >
                    Agregar
                  </button>
                </div>
              ))
            )}
          </div>
        </section>

        <section className="card carrito" style={{ padding: "25px", borderRadius: "12px", boxShadow: "0 4px 15px rgba(0,0,0,0.02)" }}>
          <h2 style={{ marginTop: 0, marginBottom: "15px", color: "#2c3e50" }}>Venta actual</h2>
          
          <div style={{ marginBottom: "20px" }}>
            <div style={{ position: "relative" }}>
              <div style={{ position: "absolute", left: "12px", top: "10px", color: "#95a5a6" }}>
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M3 5v14c0 1.1.9 2 2 2h14a2 2 0 0 0 2-2V5a2 2 0 0 0-2-2H5a2 2 0 0 0-2-2z"></path><path d="M12 7v10"></path><path d="M8 9h8"></path></svg>
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

          <div style={{ borderBottom: "2px solid #f0f0f0", paddingBottom: "15px", marginBottom: "15px", minHeight: "150px", maxHeight: "280px", overflowY: "auto", overflowX: "hidden" }}>
            {carrito.length === 0 ? (
              <p className="carrito-vacio" style={{ color: "#95a5a6", textAlign: "center", fontStyle: "italic", marginTop: "40px" }}> No hay productos en la venta actual. </p>
            ) : (
              carrito.map((producto) => (
                <div 
                  className="carrito-item fila-dashboard-interactiva" 
                  key={producto.Cod_barra || producto.idProductos || producto.id}
                  style={{ padding: "12px 10px", borderRadius: "8px", marginBottom: "8px", display: "flex", alignItems: "center", gap: "10px", border: "1px solid #f0f0f0" }}
                >
                  <div style={{ flex: 1, minWidth: 0, overflow: "hidden" }}>
                    <strong style={{ color: "#2c3e50", display: "block", whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis", fontSize: "1.05em" }} title={producto.Nombre}>
                      {producto.Nombre}
                    </strong>
                    <p style={{ margin: "2px 0 0 0", fontSize: "0.9em", color: "#7f8c8d" }}> ${Number(producto.Precio_Venta).toFixed(2)} </p>
                  </div>
                  
                  <div style={{ display: "flex", alignItems: "center", gap: "12px", flexShrink: 0 }}>
                    <input
                      className="input input-interactivo cantidad-input"
                      type="number"
                      min="1"
                      value={producto.cantidad}
                      onChange={(e) => cambiarCantidad(producto.Cod_barra || producto.idProductos || producto.id, Number(e.target.value))}
                      style={{ width: "65px", padding: "6px", fontSize: "1em", textAlign: "center", margin: 0 }}
                    />
                    <strong style={{ minWidth: "85px", textAlign: "right", color: "#2c3e50", fontSize: "1.1em" }}>
                      $ {(Number(producto.Precio_Venta) * producto.cantidad).toFixed(2)}
                    </strong>
                    <button
                      onClick={() => eliminarProducto(producto.Cod_barra || producto.idProductos || producto.id)}
                      style={{ background: "none", border: "none", cursor: "pointer", color: "#95a5a6", padding: "5px", display: "flex", alignItems: "center", justifyContent: "center", transition: "color 0.2s" }}
                      onMouseOver={(e) => e.currentTarget.style.color = "#c62828"}
                      onMouseOut={(e) => e.currentTarget.style.color = "#95a5a6"}
                      title="Eliminar producto"
                    >
                      <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><polyline points="3 6 5 6 21 6"></polyline><path d="M19 6v14a2 2 0 0 1-2-2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"></path></svg>
                    </button>
                  </div>
                </div>
              ))
            )}
          </div>

          <div className="opciones" style={{ marginBottom: "15px" }}>
            <h3 style={{ margin: "0 0 8px 0", fontSize: "0.95em", color: "#555" }}>Datos de Facturación</h3>
            <div className="tarjeta-cliente-activa">
              <div>
                <strong style={{ color: "#2c3e50", display: "block", fontSize: "1.05em" }}>
                  {clienteSeleccionado ? clienteSeleccionado.Nombre : "Consumidor Final"}
                </strong>
                {clienteSeleccionado && (
                  <span style={{ fontSize: "0.85em", color: "#7f8c8d" }}>
                    CUIT: {clienteSeleccionado.CUIT} | {clienteSeleccionado.Condicion === 'responsable_inscripto' ? 'Resp. Inscripto (Factura A)' : 'Factura B'}
                  </span>
                )}
              </div>
              <button 
                onClick={() => setMostrarModalCliente(true)}
                style={{ display: "flex", alignItems: "center", gap: "6px", backgroundColor: "#e6e4f4", color: "#261d60", border: "1px solid #c2bce0", padding: "8px 12px", borderRadius: "6px", cursor: "pointer", fontWeight: "bold", fontSize: "0.9em" }}
              >
                {clienteSeleccionado ? (
                  <><svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M12 20h9"></path><path d="M16.5 3.5a2.121 2.121 0 0 1 3 3L7 19l-4 1 1-4L16.5 3.5z"></path></svg> Cambiar</>
                ) : (
                  <><svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="11" cy="11" r="8"></circle><line x1="21" y1="21" x2="16.65" y2="16.65"></line></svg> Buscar CUIT</>
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

          <div className="opciones" style={{ display: "flex", flexDirection: "column", gap: "8px", marginBottom: "15px" }}>
            <h3 style={{ margin: 0, fontSize: "0.95em", color: "#555" }}>Medio de pago</h3>
            <div className="medios-pago" style={{ display: "flex", gap: "8px" }}>
              <button style={{ flex: 1 }} className={medioPago === "efectivo" ? "activo" : ""} onClick={() => { setMedioPago("efectivo"); setNumeroComprobante(""); }}>Efectivo</button>
              <button style={{ flex: 1 }} className={medioPago === "tarjeta" ? "activo" : ""} onClick={() => { setMedioPago("tarjeta"); setEfectivoRecibido(""); }}>Tarjeta</button>
              <button style={{ flex: 1 }} className={medioPago === "transferencia" ? "activo" : ""} onClick={() => { setMedioPago("transferencia"); setEfectivoRecibido(""); }}>Transferencia</button>
            </div>
          </div>

          {medioPago === "efectivo" ? (
            <div className="caja-efectivo">
              <label htmlFor="efectivo" className="label-efectivo"> Efectivo recibido ($) </label>
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
                <button type="button" className="btn-exacto" onClick={pagoExacto}>Exacto</button>
                <button type="button" className="btn-billete" onClick={() => agregarBillete(1000)}>+$1.000</button>
                <button type="button" className="btn-billete" onClick={() => agregarBillete(2000)}>+$2.000</button>
                <button type="button" className="btn-billete" onClick={() => agregarBillete(5000)}>+$5.000</button>
                <button type="button" className="btn-billete" onClick={() => agregarBillete(10000)}>+$10.000</button>
                <button type="button" className="btn-billete" onClick={() => agregarBillete(20000)}>+$20.000</button>
                <button type="button" className="btn-limpiar" onClick={() => setEfectivoRecibido("")}>Limpiar monto</button>
              </div>

              <div className="caja-vuelto">
                <span className="texto-vuelto">VUELTO:</span>
                <strong className="monto-vuelto"> ${Math.max(vuelto, 0).toFixed(2)} </strong>
              </div>
            </div>
          ) : (
            <div className="opciones" style={{ display: "flex", flexDirection: "column", gap: "10px", backgroundColor: "#e6e4f4", padding: "15px", borderRadius: "8px", marginBottom: "15px", border: "1px solid #c2bce0" }}>
              <label htmlFor="comprobante" style={{ fontWeight: "bold", fontSize: "0.95em", color: "#261d60" }}> 
                {medioPago === "tarjeta" ? "Nº Lote / Comprobante POSNET" : "Nº Operación / Comprobante App"}
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
              <p style={{ margin: "5px 0 0 0", fontSize: "0.85em", color: "#555", fontStyle: "italic" }}>
                * Verificá que la operación haya sido aprobada antes de registrarla.
              </p>
            </div>
          )}

          <div className="totales" style={{ padding: "20px", backgroundColor: "#f8f9fa", borderRadius: "10px", border: "1px solid #e9ecef", display: "flex", flexDirection: "column", gap: "10px", marginBottom: "20px" }}>
            <p style={{ margin: 0, display: "flex", justifyContent: "space-between", fontSize: "1.05em" }}>
              <span style={{ color: "#7f8c8d" }}>Subtotal:</span>
              <strong style={{ color: "#2c3e50" }}> ${subtotal.toFixed(2)} </strong>
            </p>
            {clienteSeleccionado?.Condicion === "responsable_inscripto" && (
              <p style={{ margin: 0, display: "flex", justifyContent: "space-between", fontSize: "1.05em" }}>
                <span style={{ color: "#7f8c8d" }}>IVA 21%:</span> 
                <strong style={{ color: "#c62828" }}> ${iva.toFixed(2)} </strong>
              </p>
            )}
            <h2 style={{ margin: "10px 0 0 0", display: "flex", justifyContent: "space-between", fontSize: "1.8em", borderTop: "2px solid #ddd", paddingTop: "15px", alignItems: "center" }}>
              <span style={{ color: "#2c3e50", fontSize: "0.8em", textTransform: "uppercase" }}>Total a Cobrar</span> 
              <strong style={{ color: "#261d60" }}> ${total.toFixed(2)} </strong>
            </h2>
          </div>

          <div style={{ display: "flex", gap: "15px" }}>
            <button 
              className="btn-cancelar"
              onClick={() => {
                if(window.confirm("¿Estás seguro de cancelar esta venta?")) {
                  setCarrito([]);
                  setEfectivoRecibido("");
                  setNumeroComprobante("");
                  setClienteSeleccionado(null);
                }
              }}
              disabled={procesandoCobro}
              style={{ flex: 1, padding: "14px", borderRadius: "8px", backgroundColor: "#fff", border: "2px solid #e0e0e0", color: "#757575", fontWeight: "bold", fontSize: "1em", transition: "all 0.2s", opacity: procesandoCobro ? 0.5 : 1 }}
              onMouseOver={(e) => { e.currentTarget.style.borderColor = "#c62828"; e.currentTarget.style.color = "#c62828"; }}
              onMouseOut={(e) => { e.currentTarget.style.borderColor = "#e0e0e0"; e.currentTarget.style.color = "#757575"; }}
            >
              Cancelar
            </button>
            <button 
              className="btn-cobrar" 
              onClick={cobrar} 
              disabled={procesandoCobro}
              style={{ flex: 2, padding: "14px", borderRadius: "8px", fontSize: "1.2em", display: "flex", justifyContent: "center", alignItems: "center", gap: "10px", boxShadow: "0 4px 10px rgba(76, 175, 80, 0.3)", opacity: procesandoCobro ? 0.7 : 1, cursor: procesandoCobro ? "wait" : "pointer" }}
            >
              <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"></path><polyline points="22 4 12 14.01 9 11.01"></polyline></svg>
              {procesandoCobro ? "Procesando..." : "COBRAR"}
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
            logout(); // Ejecuta el cierre de sesión y borra el id_turno
          }}
        />
      )}
    </div>
  );
}