// pages/Pos.jsx
// Pantalla principal del Cajero (punto de venta).
// Responsabilidad: capturar el escaneo de código de barras y agregar el
// producto al carrito, mostrar el carrito con totales, manejar el cobro
// (efectivo/tarjeta/QR) usando components/BotonDenominacion y calcular vuelto,
// y permitir buscar/cargar cliente (components/BuscarClienteModal) si piden factura.
// Es la pantalla que más importa optimizar en velocidad (HU1.1, HU1.2).
// pages/Pos.jsx
import { useAuth } from "../context/AuthContext";
import { useState, useEffect } from "react";
import "../styles/common.css";
import "../styles/pos.css";
import api, { obtenerProductos } from "../services/api";

export default function Pos() {
  const { logout, usuario } = useAuth();
  const [carrito, setCarrito] = useState([]);
  const [productos, setProductos] = useState([]);
  const [medioPago, setMedioPago] = useState("efectivo");
  const [tipoCliente, setTipoCliente] = useState("consumidor_final");
  
  // Estados para los medios de pago
  const [efectivoRecibido, setEfectivoRecibido] = useState("");
  const [numeroComprobante, setNumeroComprobante] = useState(""); // Para tarjeta/transferencia
  
  const [cargando, setCargando] = useState(true);
  const [procesandoCobro, setProcesandoCobro] = useState(false);

  // Cargar productos al inicio y después de cada venta para tener el stock actualizado
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
        // Validar que no agregue más del stock disponible
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
    
    // Validar contra el stock real
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

  const subtotal = carrito.reduce(
    (total, producto) => total + producto.Precio_Venta * producto.cantidad,
    0
  );

  const iva = tipoCliente === "responsable_inscripto" ? subtotal * 0.21 : 0;
  const total = subtotal + iva;
  const valorRecibidoNum = Number(efectivoRecibido) || 0;
  const vuelto = medioPago === "efectivo" ? valorRecibidoNum - total : 0;

  // Función asíncrona para conectarse con el backend y registrar la venta
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
      // Armamos el "ticket" para enviarle al backend
      // Usamos el id interno para descontar el stock con seguridad
      const detalleVenta = carrito.map(prod => ({
        idProductos: prod.idProductos || prod.id,
        cantidad: prod.cantidad,
        precio_unitario: prod.Precio_Venta
      }));

      const datosVenta = {
        total: total,
        metodo_pago: medioPago,
        tipo_cliente: tipoCliente,
        comprobante: numeroComprobante,
        detalle: detalleVenta 
      };

      // Le pegamos a la ruta de ventas del backend (ajustá "/ventas" si tu compañero le puso otro nombre)
      await api.post('/ventas', datosVenta);

      alert(`¡Venta procesada con éxito por $${total.toFixed(2)}!\nStock descontado.`);
      
      // Limpiamos todo para la próxima venta
      setCarrito([]);
      setEfectivoRecibido("");
      setNumeroComprobante("");
      
      // Recargamos los productos para que la pantalla actualice el nuevo stock visualmente
      cargarProductos();

    } catch (error) {
      console.error("Error al registrar la venta:", error);
      alert("Error al procesar la venta. Revisá si el backend está encendido y tiene la ruta /ventas creada.");
    } finally {
      setProcesandoCobro(false);
    }
  };

  return (
    <div className="caja">
      <header className="caja-header" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '15px 30px' }}>
        <h1 style={{ margin: 0 }}>Caja</h1>
        
        <div style={{ display: 'flex', alignItems: 'center', gap: '20px', backgroundColor: 'rgba(255,255,255,0.1)', padding: '8px 20px', borderRadius: '40px' }}>
          <span style={{ color: 'white', fontSize: '1.05em', display: 'flex', alignItems: 'center', gap: '8px' }}>
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"></path><circle cx="12" cy="7" r="4"></circle></svg>
            Usuario: <strong>{usuario?.nombre || 'Cajero'}</strong>
          </span>
          <button onClick={logout} className="btn-cerrar-sesion" style={{ padding: '6px 15px', borderRadius: '15px', fontSize: '0.9em' }}>
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4"></path><polyline points="16 17 21 12 16 7"></polyline><line x1="21" y1="12" x2="9" y2="12"></line></svg>
            Cerrar sesión
          </button>
        </div>
      </header>
      
      <main className="caja-contenido" style={{ padding: "30px 20px" }}>
        
        {/* SECCIÓN PRODUCTOS (IZQUIERDA) */}
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
                    <p className="precio" style={{ margin: 0, fontWeight: "bold", color: "#1976d2" }}> ${Number(producto.Precio_Venta).toFixed(2)} </p>
                    <p className="stock" style={{ margin: "3px 0 0 0", color: producto.Stock <= 5 ? "#c62828" : "#7f8c8d", fontSize: "0.9em", fontWeight: producto.Stock <= 5 ? "bold" : "normal" }}>
                      {producto.Stock < 1 ? "❌ Agotado" : producto.Stock <= 5 ? `⚠️ Poco stock: ${producto.Stock}` : `Stock: ${producto.Stock}`}
                    </p>
                  </div>
                  <button
                    className="btn btn-primary"
                    onClick={() => agregarProducto(producto.Cod_barra || producto.idProductos || producto.id)}
                    disabled={producto.Stock < 1}
                    style={{ padding: "8px", borderRadius: "6px", width: "100%", fontSize: "0.95em", backgroundColor: producto.Stock < 1 ? "#ccc" : "#1976d2", cursor: producto.Stock < 1 ? "not-allowed" : "pointer" }}
                  >
                    Agregar
                  </button>
                </div>
              ))
            )}
          </div>
        </section>

        {/* SECCIÓN VENTA ACTUAL (DERECHA) */}
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
                style={{ paddingLeft: "40px", border: "2px solid #1976d2" }}
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
                      onChange={(e) =>
                        cambiarCantidad(producto.Cod_barra || producto.idProductos || producto.id, Number(e.target.value))
                      }
                      style={{ width: "65px", padding: "6px", fontSize: "1em", textAlign: "center", margin: 0 }}
                    />
                    
                    <strong style={{ minWidth: "85px", textAlign: "right", color: "#2c3e50", fontSize: "1.1em" }}>
                      $ {(Number(producto.Precio_Venta) * producto.cantidad).toFixed(2)}
                    </strong>
                    
                    <button
                      onClick={() => eliminarProducto(producto.Cod_barra || producto.idProductos || producto.id)}
                      style={{ 
                        background: "none", 
                        border: "none", 
                        cursor: "pointer", 
                        color: "#95a5a6", 
                        padding: "5px", 
                        display: "flex", 
                        alignItems: "center", 
                        justifyContent: "center",
                        transition: "color 0.2s"
                      }}
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

          <div className="opciones" style={{ display: "flex", flexDirection: "column", gap: "8px", marginBottom: "15px" }}>
            <h3 style={{ margin: 0, fontSize: "0.95em", color: "#555" }}>Tipo de cliente</h3>
            <select className="input input-interactivo" value={tipoCliente} onChange={(e) => setTipoCliente(e.target.value)}>
              <option value="consumidor_final"> Consumidor Final </option>
              <option value="responsable_inscripto">Responsable Inscripto</option>
            </select>
          </div>

          <div className="opciones" style={{ display: "flex", flexDirection: "column", gap: "8px", marginBottom: "15px" }}>
            <h3 style={{ margin: 0, fontSize: "0.95em", color: "#555" }}>Medio de pago</h3>
            <div className="medios-pago" style={{ display: "flex", gap: "8px" }}>
              <button 
                style={{ flex: 1 }} 
                className={medioPago === "efectivo" ? "activo" : ""} 
                onClick={() => { setMedioPago("efectivo"); setNumeroComprobante(""); }}
              >Efectivo</button>
              <button 
                style={{ flex: 1 }} 
                className={medioPago === "tarjeta" ? "activo" : ""} 
                onClick={() => { setMedioPago("tarjeta"); setEfectivoRecibido(""); }}
              >Tarjeta</button>
              <button 
                style={{ flex: 1 }} 
                className={medioPago === "transferencia" ? "activo" : ""} 
                onClick={() => { setMedioPago("transferencia"); setEfectivoRecibido(""); }}
              >Transferencia</button>
            </div>
          </div>

          {/* Renderizado dinámico según el medio de pago */}
          {medioPago === "efectivo" ? (
            <div className="opciones" style={{ display: "flex", flexDirection: "column", gap: "10px", backgroundColor: "#fff8e1", padding: "15px", borderRadius: "8px", marginBottom: "15px", border: "1px solid #ffe082" }}>
              <label htmlFor="efectivo" style={{ fontWeight: "bold", fontSize: "0.95em", color: "#795548" }}> Efectivo recibido ($) </label>
              <input
                id="efectivo"
                className="input input-interactivo"
                type="number"
                min="0"
                placeholder="0.00"
                value={efectivoRecibido}
                onChange={(e) => setEfectivoRecibido(e.target.value)}
                style={{ padding: "10px 12px", fontSize: "1.2em", fontWeight: "bold", color: "#2c3e50" }}
              />
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginTop: "5px", padding: "8px 12px", backgroundColor: "white", borderRadius: "6px", border: "1px dashed #ccc" }}>
                <span style={{ fontSize: "1.1em", color: "#555", fontWeight: "bold" }}>VUELTO:</span>
                <strong style={{ fontSize: "1.4em", color: "#2e7d32" }}> ${Math.max(vuelto, 0).toFixed(2)} </strong>
              </div>
            </div>
          ) : (
            <div className="opciones" style={{ display: "flex", flexDirection: "column", gap: "10px", backgroundColor: "#e3f2fd", padding: "15px", borderRadius: "8px", marginBottom: "15px", border: "1px solid #bbdefb" }}>
              <label htmlFor="comprobante" style={{ fontWeight: "bold", fontSize: "0.95em", color: "#1565c0" }}> 
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
            {tipoCliente === "responsable_inscripto" && (
              <p style={{ margin: 0, display: "flex", justifyContent: "space-between", fontSize: "1.05em" }}>
                <span style={{ color: "#7f8c8d" }}>IVA 21%:</span> 
                <strong style={{ color: "#c62828" }}> ${iva.toFixed(2)} </strong>
              </p>
            )}
            <h2 style={{ margin: "10px 0 0 0", display: "flex", justifyContent: "space-between", fontSize: "1.8em", borderTop: "2px solid #ddd", paddingTop: "15px", alignItems: "center" }}>
              <span style={{ color: "#2c3e50", fontSize: "0.8em", textTransform: "uppercase" }}>Total a Cobrar</span> 
              <strong style={{ color: "#1976d2" }}> ${total.toFixed(2)} </strong>
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
    </div>
  );
}