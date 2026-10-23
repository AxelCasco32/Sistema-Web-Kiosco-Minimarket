import { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import api from "../services/api";
import "../styles/common.css";

// Registro y componentes de Chart.js
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  BarElement,
  ArcElement,
  Title,
  Tooltip,
  Legend,
} from "chart.js";
import { Bar, Doughnut } from "react-chartjs-2";

ChartJS.register(
  CategoryScale,
  LinearScale,
  BarElement,
  ArcElement,
  Title,
  Tooltip,
  Legend
);

// Función auxiliar para dividir nombres largos en dos líneas legibles
const formatearEtiqueta = (texto, maxCaracteres = 18) => {
  if (!texto) return "";
  if (texto.length <= maxCaracteres) return texto;

  const palabras = texto.split(" ");
  let linea1 = "";
  let linea2 = "";

  for (const palabra of palabras) {
    if ((linea1 + " " + palabra).trim().length <= maxCaracteres) {
      linea1 = (linea1 + " " + palabra).trim();
    } else {
      linea2 = (linea2 + " " + palabra).trim();
    }
  }

  if (linea2.length > maxCaracteres) {
    linea2 = linea2.substring(0, maxCaracteres - 3) + "...";
  }

  return linea2 ? [linea1, linea2] : linea1;
};

export default function Reportes() {
  const [topProductos, setTopProductos] = useState([]);
  const [cargando, setCargando] = useState(true);

  useEffect(() => {
    async function cargarReporte() {
      try {
        const res = await api.get("/ventas/reportes/mas-vendidos");
        setTopProductos(res.data);
      } catch (err) {
        console.error("Error al cargar reporte:", err);
      } finally {
        setCargando(false);
      }
    }
    cargarReporte();
  }, []);

  const totalUnidadesVendidas = topProductos.reduce((acc, p) => acc + p.cantidadVendida, 0);
  const totalGananciaEstimada = topProductos.reduce((acc, p) => acc + (p.gananciaTotal || 0), 0);

  // 1. Gráfico de Demanda (Top 5 más vendidos)
  const top5 = topProductos.slice(0, 5);
  const datosBarrasDemanda = {
    labels: top5.map((p) => p.nombre),
    datasets: [
      {
        label: "Unidades vendidas",
        data: top5.map((p) => p.cantidadVendida),
        backgroundColor: "rgba(38, 29, 96, 0.85)",
        borderColor: "#261d60",
        borderWidth: 1.5,
        borderRadius: 6,
      },
    ],
  };

  const opcionesBarrasHorizontales = {
    indexAxis: "y",
    responsive: true,
    maintainAspectRatio: false,
    layout: {
      padding: {
        left: 10,
        right: 15,
      },
    },
    plugins: {
      legend: { display: false },
      tooltip: {
        backgroundColor: "#261d60",
        padding: 10,
        cornerRadius: 6,
      },
    },
    scales: {
      x: {
        beginAtZero: true,
        ticks: { precision: 0, font: { size: 11 } },
        grid: { color: "#eef0f2" },
      },
      y: {
        grid: { display: false },
        ticks: {
          font: { size: 10, weight: "bold" },
          color: "#2c3e50",
          callback: function (val, index) {
            const nombreCompleto = top5[index]?.nombre || "";
            return formatearEtiqueta(nombreCompleto, 16);
          },
        },
      },
    },
  };

  // 2. Gráfico de Rentabilidad (Top 5 productos más rentables)
  const top5Rentables = [...topProductos]
    .sort((a, b) => (b.gananciaTotal || 0) - (a.gananciaTotal || 0))
    .slice(0, 5);

  const datosBarrasGanancias = {
    labels: top5Rentables.map((p) => p.nombre),
    datasets: [
      {
        label: "Ganancia Neta ($)",
        data: top5Rentables.map((p) => p.gananciaTotal || 0),
        backgroundColor: "rgba(46, 125, 50, 0.85)",
        borderColor: "#2e7d32",
        borderWidth: 1.5,
        borderRadius: 6,
      },
    ],
  };

  const opcionesGanancias = {
    indexAxis: "y",
    responsive: true,
    maintainAspectRatio: false,
    layout: {
      padding: {
        left: 10,
        right: 15,
      },
    },
    plugins: {
      legend: { display: false },
      tooltip: {
        backgroundColor: "#1b5e20",
        padding: 10,
        cornerRadius: 6,
        callbacks: {
          label: (context) => ` Ganancia: $${Number(context.raw).toLocaleString("es-AR")}`,
        },
      },
    },
    scales: {
      x: {
        beginAtZero: true,
        ticks: {
          callback: (value) => `$${value}`,
          font: { size: 10 },
        },
        grid: { color: "#eef0f2" },
      },
      y: {
        grid: { display: false },
        ticks: {
          font: { size: 10, weight: "bold" },
          color: "#2c3e50",
          callback: function (val, index) {
            const nombreCompleto = top5Rentables[index]?.nombre || "";
            return formatearEtiqueta(nombreCompleto, 16);
          },
        },
      },
    },
  };

  // 3. Gráfico de Categorías (Dona)
  const ventasPorCategoria = topProductos.reduce((acc, p) => {
    const cat = p.categoria || "General";
    acc[cat] = (acc[cat] || 0) + p.cantidadVendida;
    return acc;
  }, {});

  const categoriasLabels = Object.keys(ventasPorCategoria);
  const categoriasValores = Object.values(ventasPorCategoria);
  const coloresCategorias = ["#261d60", "#4a3fa0", "#7b6fe3", "#a59af5", "#f39c12", "#27ae60"];

  const datosDona = {
    labels: categoriasLabels,
    datasets: [
      {
        data: categoriasValores,
        backgroundColor: coloresCategorias.slice(0, categoriasLabels.length),
        borderColor: "#ffffff",
        borderWidth: 2,
      },
    ],
  };

  const opcionesDona = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: {
        position: "bottom",
        labels: { boxWidth: 12, padding: 12, font: { size: 11 } },
      },
    },
  };

  return (
    <div style={{ backgroundColor: "#f4f6f8", minHeight: "100vh" }}>
      {/* Header Corporativo */}
      <header style={{ display: "flex", justifyContent: "space-between", alignItems: "center", padding: "15px 30px", backgroundColor: "#261d60", color: "white" }}>
        <div style={{ display: "flex", alignItems: "center", gap: "15px" }}>
          <div style={{ backgroundColor: "rgba(255, 255, 255, 0.1)", padding: "10px", borderRadius: "8px", display: "flex" }}>
            <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
              <line x1="18" y1="20" x2="18" y2="10"></line>
              <line x1="12" y1="20" x2="12" y2="4"></line>
              <line x1="6" y1="20" x2="6" y2="14"></line>
            </svg>
          </div>
          <h1 style={{ margin: 0, fontSize: "1.6rem", fontWeight: "bold" }}>Reportes de Ventas</h1>
        </div>

        <Link to="/admin" style={{ color: "white", textDecoration: "none", display: "flex", alignItems: "center", gap: "8px", backgroundColor: "rgba(255,255,255,0.15)", padding: "8px 16px", borderRadius: "8px", fontWeight: "bold" }}>
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
            <polyline points="15 18 9 12 15 6"></polyline>
          </svg>
          Volver al Panel
        </Link>
      </header>

      <main style={{ padding: "35px 25px", maxWidth: "1200px", margin: "0 auto" }}>
        
        {/* Banner Métrico */}
        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(240px, 1fr))", gap: "20px", marginBottom: "30px" }}>
          <div style={{ backgroundColor: "white", padding: "20px", borderRadius: "12px", border: "1px solid #eef0f2", boxShadow: "0 4px 15px rgba(0,0,0,0.03)" }}>
            <span style={{ color: "#7f8c8d", fontSize: "0.85em", fontWeight: "bold", letterSpacing: "0.5px" }}>PRODUCTO ESTRELLA</span>
            <h3 style={{ margin: "10px 0 0 0", color: "#261d60", fontSize: "1.25em", whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }} title={topProductos[0]?.nombre}>
              {topProductos.length > 0 ? topProductos[0].nombre : "Sin datos"}
            </h3>
            <p style={{ margin: "5px 0 0 0", color: "#27ae60", fontWeight: "bold", fontSize: "0.95em" }}>
              {topProductos.length > 0 ? `${topProductos[0].cantidadVendida} unidades vendidas` : ""}
            </p>
          </div>

          <div style={{ backgroundColor: "white", padding: "20px", borderRadius: "12px", border: "1px solid #eef0f2", boxShadow: "0 4px 15px rgba(0,0,0,0.03)" }}>
            <span style={{ color: "#7f8c8d", fontSize: "0.85em", fontWeight: "bold", letterSpacing: "0.5px" }}>VOLUMEN ROTACIÓN TOP</span>
            <h3 style={{ margin: "10px 0 0 0", color: "#2c3e50", fontSize: "1.35em" }}>
              {totalUnidadesVendidas} unidades
            </h3>
            <p style={{ margin: "5px 0 0 0", color: "#7f8c8d", fontSize: "0.85em" }}>Total acumulado en el ranking</p>
          </div>

          <div style={{ backgroundColor: "white", padding: "20px", borderRadius: "12px", border: "1px solid #eef0f2", boxShadow: "0 4px 15px rgba(0,0,0,0.03)" }}>
            <span style={{ color: "#7f8c8d", fontSize: "0.85em", fontWeight: "bold", letterSpacing: "0.5px" }}>GANANCIA NETA ESTIMADA</span>
            <h3 style={{ margin: "10px 0 0 0", color: "#2e7d32", fontSize: "1.35em" }}>
              ${Number(totalGananciaEstimada).toLocaleString("es-AR", { minimumFractionDigits: 2 })}
            </h3>
            <p style={{ margin: "5px 0 0 0", color: "#7f8c8d", fontSize: "0.85em" }}>Ventas menos costo de reposición</p>
          </div>
        </div>

        {/* Sección de Gráficos */}
        {!cargando && topProductos.length > 0 && (
          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(360px, 1fr))", gap: "25px", marginBottom: "35px" }}>
            
            {/* Gráfico 1: Demanda */}
            <div style={{ backgroundColor: "white", padding: "25px", borderRadius: "12px", border: "1px solid #eef0f2", boxShadow: "0 4px 15px rgba(0,0,0,0.03)" }}>
              <h3 style={{ margin: "0 0 5px 0", color: "#2c3e50", fontSize: "1.1em" }}>Top 5: Mayor Demanda</h3>
              <p style={{ margin: "0 0 20px 0", color: "#7f8c8d", fontSize: "0.85em" }}>Artículos con mayor volumen unitario despachado.</p>
              <div style={{ height: "260px", position: "relative" }}>
                <Bar data={datosBarrasDemanda} options={opcionesBarrasHorizontales} />
              </div>
            </div>

            {/* Gráfico 2: Ganancias Netas */}
            <div style={{ backgroundColor: "white", padding: "25px", borderRadius: "12px", border: "1px solid #eef0f2", boxShadow: "0 4px 15px rgba(0,0,0,0.03)" }}>
              <h3 style={{ margin: "0 0 5px 0", color: "#2c3e50", fontSize: "1.1em" }}>Top 5: Ganancia Neta Generada</h3>
              <p style={{ margin: "0 0 20px 0", color: "#7f8c8d", fontSize: "0.85em" }}>Beneficio real descontando el precio de costo.</p>
              <div style={{ height: "260px", position: "relative" }}>
                <Bar data={datosBarrasGanancias} options={opcionesGanancias} />
              </div>
            </div>

            {/* Gráfico 3: Categorías */}
            <div style={{ backgroundColor: "white", padding: "25px", borderRadius: "12px", border: "1px solid #eef0f2", boxShadow: "0 4px 15px rgba(0,0,0,0.03)" }}>
              <h3 style={{ margin: "0 0 5px 0", color: "#2c3e50", fontSize: "1.1em" }}>Distribución por Categoría</h3>
              <p style={{ margin: "0 0 20px 0", color: "#7f8c8d", fontSize: "0.85em" }}>Proporción de unidades según rubro.</p>
              <div style={{ height: "260px", position: "relative" }}>
                <Doughnut data={datosDona} options={opcionesDona} />
              </div>
            </div>

          </div>
        )}

        {/* Tabla Detallada */}
        <section style={{ backgroundColor: "white", padding: "30px", borderRadius: "12px", boxShadow: "0 4px 15px rgba(0,0,0,0.04)", border: "1px solid #eef0f2" }}>
          <h2 style={{ margin: "0 0 5px 0", color: "#2c3e50", fontSize: "1.25em" }}>Listado Detallado de Rotación y Margen</h2>
          <p style={{ margin: "0 0 25px 0", color: "#7f8c8d", fontSize: "0.9em" }}>Relación de ventas, ingresos, costo y stock disponible.</p>

          {cargando ? (
            <p style={{ textAlign: "center", color: "#7f8c8d", padding: "30px 0" }}>Cargando estadísticas...</p>
          ) : topProductos.length === 0 ? (
            <p style={{ textAlign: "center", color: "#7f8c8d", padding: "30px 0" }}>No se encontraron registros de ventas aún.</p>
          ) : (
            <div style={{ overflowX: "auto" }}>
              <table style={{ width: "100%", borderCollapse: "collapse", textAlign: "left" }}>
                <thead>
                  <tr style={{ backgroundColor: "#261d60", color: "white" }}>
                    <th style={{ padding: "14px 16px", borderRadius: "8px 0 0 0", width: "50px" }}>#</th>
                    <th style={{ padding: "14px 16px" }}>Producto</th>
                    <th style={{ padding: "14px 16px" }}>Categoría</th>
                    <th style={{ padding: "14px 16px", textAlign: "center" }}>Vendidos</th>
                    <th style={{ padding: "14px 16px", textAlign: "right" }}>Recaudado</th>
                    <th style={{ padding: "14px 16px", textAlign: "right" }}>Ganancia Neta</th>
                    <th style={{ padding: "14px 16px", borderRadius: "0 8px 0 0", textAlign: "center" }}>Stock</th>
                  </tr>
                </thead>
                <tbody>
                  {topProductos.map((p, index) => (
                    <tr key={p.idProductos} style={{ borderBottom: "1px solid #f0f0f0" }}>
                      <td style={{ padding: "14px 16px", fontWeight: "bold", color: index < 3 ? "#261d60" : "#7f8c8d" }}>
                        #{index + 1}
                      </td>
                      <td style={{ padding: "14px 16px", fontWeight: "bold", color: "#2c3e50" }}>
                        {p.nombre}
                      </td>
                      <td style={{ padding: "14px 16px" }}>
                        <span style={{ backgroundColor: "#e6e4f4", color: "#261d60", padding: "4px 10px", borderRadius: "20px", fontSize: "0.85em", fontWeight: "600" }}>
                          {p.categoria}
                        </span>
                      </td>
                      <td style={{ padding: "14px 16px", textAlign: "center", fontWeight: "bold", color: "#261d60", fontSize: "1.05em" }}>
                        {p.cantidadVendida}
                      </td>
                      <td style={{ padding: "14px 16px", textAlign: "right", color: "#2c3e50", fontWeight: "600" }}>
                        ${Number(p.totalRecaudado || 0).toLocaleString("es-AR", { minimumFractionDigits: 2 })}
                      </td>
                      <td style={{ padding: "14px 16px", textAlign: "right", color: "#2e7d32", fontWeight: "bold" }}>
                        ${Number(p.gananciaTotal || 0).toLocaleString("es-AR", { minimumFractionDigits: 2 })}
                      </td>
                      <td style={{ padding: "14px 16px", textAlign: "center" }}>
                        <span style={{
                          padding: "5px 12px",
                          borderRadius: "20px",
                          fontSize: "0.85em",
                          fontWeight: "bold",
                          backgroundColor: p.stockActual <= 5 ? "#ffebee" : "#e8f5e9",
                          color: p.stockActual <= 5 ? "#c62828" : "#2e7d32",
                          border: p.stockActual <= 5 ? "1px solid #ffcdd2" : "1px solid #c8e6c9"
                        }}>
                          {p.stockActual} en stock
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </section>
      </main>
    </div>
  );
}