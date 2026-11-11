// pages/admin/Stock.jsx
// Módulo de Stock: semáforo de inventario, alertas de stock crítico,
// exportación a Excel y envío del pedido al proveedor.
import { useState, useEffect, useMemo } from "react";
import api from "../../services/api";
import { STOCK_CRITICO, descargarCriticosCsv, enviarCriticosProveedor } from "../../utils/stockCritico";
import "../../styles/common.css";

function Encabezado({ titulo, subtitulo }) {
  return (
    <div style={{ marginBottom: "22px" }}>
      <h1 style={{ margin: 0, color: "#261d60", fontSize: "1.6rem" }}>{titulo}</h1>
      {subtitulo && <p style={{ margin: "4px 0 0", color: "#7f8c8d" }}>{subtitulo}</p>}
    </div>
  );
}

export default function Stock() {
  const [productos, setProductos] = useState([]);

  // Estados de control para la sección de Stock
  const [busquedaStock, setBusquedaStock] = useState("");
  const [filtroAlerta, setFiltroAlerta] = useState("todos"); // 'todos', 'critico', 'moderado', 'optimo'
  const [ordenStock, setOrdenStock] = useState("menor"); // 'menor', 'mayor', 'nombre'

  useEffect(() => {
    api
      .get("/productos")
      .then(({ data }) => setProductos(data))
      .catch((error) => console.error("Fallo al descargar los productos:", error));
  }, []);

  // Conteo reactivo para las píldoras de semáforo
  const conteoAlertas = useMemo(() => {
    return {
      critico: productos.filter((p) => p.Stock <= 5).length,
      moderado: productos.filter((p) => p.Stock > 5 && p.Stock <= 15).length,
      optimo: productos.filter((p) => p.Stock > 15).length,
    };
  }, [productos]);

  // Filtrado y ordenamiento de inventario
  const productosStockProcesados = useMemo(() => {
    return productos
      .filter((prod) => {
        const coincideTexto =
          (prod.Nombre || "").toLowerCase().includes(busquedaStock.toLowerCase()) ||
          (prod.Cod_barra && String(prod.Cod_barra).includes(busquedaStock));

        let coincideAlerta = true;
        if (filtroAlerta === "critico") coincideAlerta = prod.Stock <= 5;
        else if (filtroAlerta === "moderado") coincideAlerta = prod.Stock > 5 && prod.Stock <= 15;
        else if (filtroAlerta === "optimo") coincideAlerta = prod.Stock > 15;

        return coincideTexto && coincideAlerta;
      })
      .sort((a, b) => {
        if (ordenStock === "menor") return a.Stock - b.Stock;
        if (ordenStock === "mayor") return b.Stock - a.Stock;
        if (ordenStock === "nombre") return (a.Nombre || "").localeCompare(b.Nombre || "");
        return 0;
      });
  }, [productos, busquedaStock, filtroAlerta, ordenStock]);

  return (
    <div className="r-pagina" style={{ padding: "30px", maxWidth: "1200px", margin: "0 auto" }}>
      <Encabezado titulo="Stock" subtitulo="Estado del inventario, alertas de reposición y pedido al proveedor." />
        {/* =========================================
            SECCIÓN 3: ESTADO DEL STOCK (MODERNIZADO)
           ========================================= */}
        <section
          style={{
            backgroundColor: "#ffffff",
            borderRadius: "14px",
            padding: "26px",
            boxShadow: "0 4px 18px rgba(0,0,0,0.03)",
            border: "1px solid #edf0f2",
            marginBottom: "30px",
          }}
        >
          {/* Encabezado y Selector de ordenamiento */}
          <div
            style={{
              display: "flex",
              justifyContent: "space-between",
              alignItems: "flex-start",
              flexWrap: "wrap",
              gap: "15px",
              marginBottom: "20px",
            }}
          >
            <div>
              <h2 style={{ margin: 0, color: "#2c3e50", fontSize: "1.35em", fontWeight: "700" }}>
                Estado del Stock
              </h2>
              <p style={{ margin: "4px 0 0 0", color: "#7f8c8d", fontSize: "0.9em" }}>
                Monitoreo en tiempo real para control de reposición de mercadería.
              </p>
            </div>

            <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
              <label style={{ fontSize: "0.85em", color: "#7f8c8d", fontWeight: "600" }}>
                Ordenar por:
              </label>
              <select
                value={ordenStock}
                onChange={(e) => setOrdenStock(e.target.value)}
                style={{
                  padding: "7px 12px",
                  borderRadius: "8px",
                  border: "1px solid #dcdde1",
                  fontSize: "0.88em",
                  color: "#2c3e50",
                  outline: "none",
                  backgroundColor: "#fcfdfe",
                  cursor: "pointer",
                }}
              >
                <option value="menor">Menor stock (urgente)</option>
                <option value="mayor">Mayor stock</option>
                <option value="nombre">Nombre (A - Z)</option>
              </select>
            </div>
          </div>

          {/* Alerta de stock crítico con exportación y envío al proveedor */}
          {conteoAlertas.critico > 0 ? (
            <div
              role="alert"
              style={{
                display: "flex",
                alignItems: "center",
                justifyContent: "space-between",
                flexWrap: "wrap",
                gap: "12px",
                backgroundColor: "#fff5f5",
                border: "1px solid #fecaca",
                borderLeft: "5px solid #c62828",
                borderRadius: "10px",
                padding: "14px 16px",
                marginBottom: "18px",
              }}
            >
              <div style={{ display: "flex", alignItems: "center", gap: "12px", minWidth: 0, flex: "1 1 260px" }}>
                <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="#c62828" strokeWidth="2.4" strokeLinecap="round" strokeLinejoin="round" style={{ flexShrink: 0 }}>
                  <path d="M10.29 3.86 1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z"></path>
                  <line x1="12" y1="9" x2="12" y2="13"></line>
                  <line x1="12" y1="17" x2="12.01" y2="17"></line>
                </svg>
                <div>
                  <strong style={{ color: "#b71c1c", display: "block" }}>
                    {conteoAlertas.critico} producto{conteoAlertas.critico === 1 ? "" : "s"} en stock crítico
                  </strong>
                  <span style={{ color: "#7f1d1d", fontSize: "0.86em" }}>
                    Con {STOCK_CRITICO} unidades o menos. Exportá la lista o enviásela al proveedor.
                  </span>
                </div>
              </div>
              <div style={{ display: "flex", gap: "10px", flexWrap: "wrap" }}>
                <button
                  type="button"
                  onClick={descargarCriticosCsv}
                  style={{ display: "flex", alignItems: "center", gap: "8px", padding: "9px 14px", borderRadius: "8px", border: "1px solid #2e7d32", backgroundColor: "#ffffff", color: "#2e7d32", fontWeight: "bold", cursor: "pointer", fontSize: "0.88em" }}
                >
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.4" strokeLinecap="round" strokeLinejoin="round"><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"></path><polyline points="7 10 12 15 17 10"></polyline><line x1="12" y1="15" x2="12" y2="3"></line></svg>
                  Exportar a Excel
                </button>
                <button
                  type="button"
                  onClick={enviarCriticosProveedor}
                  style={{ display: "flex", alignItems: "center", gap: "8px", padding: "9px 14px", borderRadius: "8px", border: "none", backgroundColor: "#261d60", color: "#ffffff", fontWeight: "bold", cursor: "pointer", fontSize: "0.88em" }}
                >
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.4" strokeLinecap="round" strokeLinejoin="round"><path d="M4 4h16c1.1 0 2 .9 2 2v12c0 1.1-.9 2-2 2H4c-1.1 0-2-.9-2-2V6c0-1.1.9-2 2-2z"></path><polyline points="22,6 12,13 2,6"></polyline></svg>
                  Enviar al proveedor
                </button>
              </div>
            </div>
          ) : (
            productos.length > 0 && (
              <div style={{ backgroundColor: "#f0fdf4", border: "1px solid #bbf7d0", color: "#166534", borderRadius: "10px", padding: "10px 14px", marginBottom: "18px", fontSize: "0.9em" }}>
                Ningún producto en stock crítico.
              </div>
            )
          )}

          {/* Barra de Filtros y Búsqueda */}
          <div
            style={{
              display: "flex",
              justifyContent: "space-between",
              alignItems: "center",
              gap: "15px",
              flexWrap: "wrap",
              paddingBottom: "18px",
              marginBottom: "18px",
              borderBottom: "1px solid #f1f2f6",
            }}
          >
            {/* Píldoras de estado */}
            <div style={{ display: "flex", gap: "8px", flexWrap: "wrap" }}>
              <button
                type="button"
                onClick={() => setFiltroAlerta("todos")}
                style={{
                  padding: "6px 14px",
                  borderRadius: "20px",
                  border: filtroAlerta === "todos" ? "1px solid #261d60" : "1px solid #e0e0e0",
                  backgroundColor: filtroAlerta === "todos" ? "#261d60" : "#ffffff",
                  color: filtroAlerta === "todos" ? "#ffffff" : "#555",
                  fontSize: "0.85em",
                  fontWeight: "600",
                  cursor: "pointer",
                  transition: "all 0.2s",
                }}
              >
                Todos ({productos.length})
              </button>

              <button
                type="button"
                onClick={() => setFiltroAlerta("critico")}
                style={{
                  padding: "6px 14px",
                  borderRadius: "20px",
                  border: "1px solid #ffcdd2",
                  backgroundColor: filtroAlerta === "critico" ? "#ffebee" : "#ffffff",
                  color: "#c62828",
                  fontSize: "0.85em",
                  fontWeight: "bold",
                  cursor: "pointer",
                  display: "flex",
                  alignItems: "center",
                  gap: "6px",
                }}
              >
                <span style={{ width: "8px", height: "8px", borderRadius: "50%", backgroundColor: "#c62828" }}></span>
                Crítico ({conteoAlertas.critico})
              </button>

              <button
                type="button"
                onClick={() => setFiltroAlerta("moderado")}
                style={{
                  padding: "6px 14px",
                  borderRadius: "20px",
                  border: "1px solid #ffe082",
                  backgroundColor: filtroAlerta === "moderado" ? "#fff8e1" : "#ffffff",
                  color: "#f57f17",
                  fontSize: "0.85em",
                  fontWeight: "bold",
                  cursor: "pointer",
                  display: "flex",
                  alignItems: "center",
                  gap: "6px",
                }}
              >
                <span style={{ width: "8px", height: "8px", borderRadius: "50%", backgroundColor: "#f57f17" }}></span>
                Moderado ({conteoAlertas.moderado})
              </button>

              <button
                type="button"
                onClick={() => setFiltroAlerta("optimo")}
                style={{
                  padding: "6px 14px",
                  borderRadius: "20px",
                  border: "1px solid #c8e6c9",
                  backgroundColor: filtroAlerta === "optimo" ? "#e8f5e9" : "#ffffff",
                  color: "#2e7d32",
                  fontSize: "0.85em",
                  fontWeight: "bold",
                  cursor: "pointer",
                  display: "flex",
                  alignItems: "center",
                  gap: "6px",
                }}
              >
                <span style={{ width: "8px", height: "8px", borderRadius: "50%", backgroundColor: "#2e7d32" }}></span>
                Óptimo ({conteoAlertas.optimo})
              </button>
            </div>

            {/* Buscador de producto por nombre o código */}
            <div className="r-input-ancho" style={{ position: "relative", minWidth: "240px", flex: "1 1 240px", maxWidth: "340px" }}>
              <input
                type="text"
                placeholder="Buscar por nombre o código..."
                value={busquedaStock}
                onChange={(e) => setBusquedaStock(e.target.value)}
                style={{
                  width: "100%",
                  padding: "8px 12px 8px 34px",
                  borderRadius: "20px",
                  border: "1px solid #dcdde1",
                  fontSize: "0.88em",
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
                style={{ position: "absolute", left: "12px", top: "10px" }}
              >
                <circle cx="11" cy="11" r="8"></circle>
                <line x1="21" y1="21" x2="16.65" y2="16.65"></line>
              </svg>
            </div>
          </div>

          {/* Lista con Scroll Interno y Bordado Fino Perimetral */}
          <div
            style={{
              maxHeight: "420px",
              overflowY: "auto",
              paddingRight: "6px",
              display: "flex",
              flexDirection: "column",
              gap: "10px",
            }}
          >
            {productosStockProcesados.length === 0 ? (
              <div style={{ padding: "30px", textAlign: "center", color: "#95a5a6" }}>
                No se encontraron productos que coincidan con los filtros aplicados.
              </div>
            ) : (
              productosStockProcesados.map((prod) => {
                const esCritico = prod.Stock <= 5;
                const esModerado = prod.Stock > 5 && prod.Stock <= 15;

                const colorBordeFino = esCritico ? "#ffcdd2" : esModerado ? "#ffe082" : "#c8e6c9";
                const colorBadgeFondo = esCritico ? "#ffebee" : esModerado ? "#fff8e1" : "#e8f5e9";
                const colorBadgeTexto = esCritico ? "#c62828" : esModerado ? "#b78103" : "#2e7d32";

                return (
                  <div
                    key={prod.idProductos || prod.Cod_barra || prod.id}
                    className="r-fila-lista"
                    style={{
                      backgroundColor: "#ffffff",
                      border: `1.5px solid ${colorBordeFino}`,
                      borderRadius: "10px",
                      padding: "14px 18px",
                      display: "flex",
                      justifyContent: "space-between",
                      alignItems: "center",
                      transition: "all 0.2s ease",
                      boxShadow: "0 2px 5px rgba(0,0,0,0.02)",
                    }}
                    onMouseOver={(e) => {
                      e.currentTarget.style.transform = "translateY(-1px)";
                      e.currentTarget.style.boxShadow = "0 4px 10px rgba(0,0,0,0.05)";
                    }}
                    onMouseOut={(e) => {
                      e.currentTarget.style.transform = "translateY(0)";
                      e.currentTarget.style.boxShadow = "0 2px 5px rgba(0,0,0,0.02)";
                    }}
                  >
                    <div>
                      <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
                        <strong style={{ color: "#2c3e50", fontSize: "1.05em" }}>
                          {prod.Nombre}
                        </strong>
                        <span
                          style={{
                            backgroundColor: "#f0edfd",
                            color: "#261d60",
                            fontSize: "0.75em",
                            padding: "2px 8px",
                            borderRadius: "12px",
                            fontWeight: "600",
                          }}
                        >
                          {prod.Categoria || "General"}
                        </span>
                      </div>
                      <span style={{ fontSize: "0.85em", color: "#8c98a4", marginTop: "3px", display: "block" }}>
                        Cod: {prod.Cod_barra || "Sin código"}
                      </span>
                    </div>

                    <div
                      style={{
                        backgroundColor: colorBadgeFondo,
                        color: colorBadgeTexto,
                        padding: "6px 14px",
                        borderRadius: "20px",
                        fontWeight: "bold",
                        fontSize: "0.9em",
                        display: "flex",
                        alignItems: "center",
                        gap: "7px",
                        border: `1px solid ${colorBadgeTexto}30`,
                      }}
                    >
                      {esCritico ? (
                        <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                          <path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z"></path>
                          <line x1="12" y1="9" x2="12" y2="13"></line>
                          <line x1="12" y1="17" x2="12.01" y2="17"></line>
                        </svg>
                      ) : esModerado ? (
                        <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                          <circle cx="12" cy="12" r="10"></circle>
                          <line x1="12" y1="8" x2="12" y2="12"></line>
                          <line x1="12" y1="16" x2="12.01" y2="16"></line>
                        </svg>
                      ) : (
                        <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                          <polyline points="20 6 9 17 4 12"></polyline>
                        </svg>
                      )}
                      Stock: {prod.Stock}
                    </div>
                  </div>
                );
              })
            )}
          </div>
        </section>
    </div>
  );
}
