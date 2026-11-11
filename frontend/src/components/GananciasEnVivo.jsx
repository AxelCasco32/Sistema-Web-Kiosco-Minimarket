// components/GananciasEnVivo.jsx
// Panel de Admin: ventas y ganancias del día que se actualizan solas.
// Carga el resumen del día (GET /ventas/resumen-hoy) y después escucha por
// WebSocket el evento "venta:nueva" que el backend emite en cada cobro.
import { useEffect, useMemo, useRef, useState } from "react";
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  BarElement,
  ArcElement,
  Tooltip,
  Legend,
} from "chart.js";
import { Bar, Doughnut } from "react-chartjs-2";
import api from "../services/api";
import { conectarTiempoReal } from "../services/socket";

ChartJS.register(CategoryScale, LinearScale, BarElement, ArcElement, Tooltip, Legend);

const pesos = (n) =>
  `$${Number(n || 0).toLocaleString("es-AR", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;

const COLORES_METODO = { Efectivo: "#2e7d32", Tarjeta: "#261d60", Transferencia: "#7e57c2", QR: "#f39c12" };

const RESUMEN_VACIO = {
  cantidadVentas: 0,
  recaudado: 0,
  ganancia: 0,
  ticketPromedio: 0,
  porHora: Array.from({ length: 24 }, (_, hora) => ({ hora, recaudado: 0, ganancia: 0, ventas: 0 })),
  porMetodo: {},
  ultimas: [],
};

export default function GananciasEnVivo() {
  const [resumen, setResumen] = useState(RESUMEN_VACIO);
  const [estado, setEstado] = useState("conectando"); // conectando | en-vivo | desconectado
  const [cargando, setCargando] = useState(true);
  const [destacada, setDestacada] = useState(null);
  const timerDestacada = useRef(null);

  const cargarResumen = async () => {
    try {
      const { data } = await api.get("/ventas/resumen-hoy");
      setResumen({ ...RESUMEN_VACIO, ...data });
    } catch (error) {
      console.error("No se pudo cargar el resumen del día", error);
    } finally {
      setCargando(false);
    }
  };

  useEffect(() => {
    cargarResumen();
    const socket = conectarTiempoReal();

    socket.on("connect", () => {
      setEstado("en-vivo");
      // Al reconectar se recarga, por si hubo ventas mientras estaba desconectado
      cargarResumen();
    });
    socket.on("disconnect", () => setEstado("desconectado"));
    socket.on("connect_error", () => setEstado("desconectado"));

    socket.on("venta:nueva", (venta) => {
      setResumen((r) => {
        const cantidadVentas = r.cantidadVentas + 1;
        const recaudado = r.recaudado + venta.total;
        const porHora = r.porHora.map((h) =>
          h.hora === venta.hora
            ? { ...h, recaudado: h.recaudado + venta.total, ganancia: h.ganancia + venta.ganancia, ventas: h.ventas + 1 }
            : h
        );
        return {
          ...r,
          cantidadVentas,
          recaudado,
          ganancia: r.ganancia + venta.ganancia,
          ticketPromedio: recaudado / cantidadVentas,
          porHora,
          porMetodo: { ...r.porMetodo, [venta.metodoPago]: (r.porMetodo[venta.metodoPago] || 0) + venta.total },
          ultimas: [venta, ...r.ultimas].slice(0, 8),
        };
      });
      setDestacada(venta.idVenta);
      clearTimeout(timerDestacada.current);
      timerDestacada.current = setTimeout(() => setDestacada(null), 3500);
    });

    return () => {
      clearTimeout(timerDestacada.current);
      socket.disconnect();
    };
  }, []);

  // Horas a mostrar: desde la primera hora con ventas (o las 8) hasta la hora actual
  const horasVisibles = useMemo(() => {
    const ahora = new Date();
    const horaActual = Number(ahora.toLocaleString("en-US", { hour: "numeric", hour12: false, timeZone: "America/Argentina/Buenos_Aires" })) % 24;
    const primeraConVentas = resumen.porHora.find((h) => h.ventas > 0)?.hora;
    const desde = Math.min(primeraConVentas ?? 8, 8, horaActual);
    const hasta = Math.max(horaActual, ...resumen.porHora.filter((h) => h.ventas > 0).map((h) => h.hora));
    return resumen.porHora.filter((h) => h.hora >= desde && h.hora <= hasta);
  }, [resumen.porHora]);

  const datosHora = {
    labels: horasVisibles.map((h) => `${String(h.hora).padStart(2, "0")} h`),
    datasets: [
      { label: "Recaudado", data: horasVisibles.map((h) => h.recaudado), backgroundColor: "rgba(38, 29, 96, 0.85)", borderRadius: 4 },
      { label: "Ganancia", data: horasVisibles.map((h) => h.ganancia), backgroundColor: "rgba(46, 125, 50, 0.85)", borderRadius: 4 },
    ],
  };
  const opcionesHora = {
    responsive: true,
    maintainAspectRatio: false,
    animation: { duration: 400 },
    plugins: {
      legend: { position: "bottom" },
      tooltip: { callbacks: { label: (c) => `${c.dataset.label}: ${pesos(c.parsed.y)}` } },
    },
    scales: { y: { beginAtZero: true, ticks: { callback: (v) => `$${Number(v).toLocaleString("es-AR")}` } } },
  };

  const metodos = Object.keys(resumen.porMetodo).filter((m) => resumen.porMetodo[m] > 0);
  const datosMetodo = {
    labels: metodos,
    datasets: [{ data: metodos.map((m) => resumen.porMetodo[m]), backgroundColor: metodos.map((m) => COLORES_METODO[m] || "#94a3b8"), borderWidth: 2 }],
  };
  const opcionesMetodo = {
    responsive: true,
    maintainAspectRatio: false,
    cutout: "62%",
    plugins: {
      legend: { position: "bottom" },
      tooltip: { callbacks: { label: (c) => `${c.label}: ${pesos(c.parsed)}` } },
    },
  };

  const margen = resumen.recaudado > 0 ? (resumen.ganancia / resumen.recaudado) * 100 : 0;
  const indicador = {
    "en-vivo": { texto: "En vivo", color: "#2e7d32", fondo: "#e8f5e9" },
    conectando: { texto: "Conectando…", color: "#b78103", fondo: "#fff8e1" },
    desconectado: { texto: "Sin conexión en vivo (reintentando)", color: "#c62828", fondo: "#ffebee" },
  }[estado];

  const tarjetas = [
    { titulo: "Ventas de hoy", valor: resumen.cantidadVentas, color: "#261d60" },
    { titulo: "Recaudado", valor: pesos(resumen.recaudado), color: "#261d60" },
    { titulo: "Ganancia", valor: pesos(resumen.ganancia), color: "#2e7d32", extra: `Margen ${margen.toFixed(1)}%` },
    { titulo: "Ticket promedio", valor: pesos(resumen.ticketPromedio), color: "#261d60" },
  ];

  return (
    <section style={estilos.seccion}>
      <style>{`@keyframes pulso-vivo{0%{box-shadow:0 0 0 0 rgba(46,125,50,.5)}70%{box-shadow:0 0 0 8px rgba(46,125,50,0)}100%{box-shadow:0 0 0 0 rgba(46,125,50,0)}}`}</style>
      <div style={estilos.encabezado}>
        <div>
          <h2 style={{ margin: 0, color: "#2c3e50", fontSize: "1.35em", fontWeight: 700 }}>Ganancias de hoy</h2>
          <p style={{ margin: "4px 0 0", color: "#7f8c8d", fontSize: "0.9em" }}>
            Se actualiza solo con cada venta. Ganancia = precio de venta menos costo actual del producto.
          </p>
        </div>
        <span style={{ ...estilos.indicador, color: indicador.color, backgroundColor: indicador.fondo }} aria-live="polite">
          <span style={{ ...estilos.punto, backgroundColor: indicador.color, animation: estado === "en-vivo" ? "pulso-vivo 2s infinite" : "none" }} />
          {indicador.texto}
        </span>
      </div>

      <div style={estilos.tarjetas}>
        {tarjetas.map((t) => (
          <div key={t.titulo} style={estilos.tarjeta}>
            <span style={estilos.tarjetaTitulo}>{t.titulo}</span>
            <strong style={{ fontSize: "1.45em", color: t.color }}>{cargando ? "…" : t.valor}</strong>
            {t.extra && !cargando && <span style={{ fontSize: "0.8em", color: "#2e7d32", fontWeight: 600 }}>{t.extra}</span>}
          </div>
        ))}
      </div>

      <div style={estilos.graficos}>
        <div style={estilos.caja}>
          <h3 style={estilos.subtitulo}>Recaudado y ganancia por hora</h3>
          <div style={{ height: "260px" }}>
            <Bar data={datosHora} options={opcionesHora} />
          </div>
        </div>
        <div style={estilos.caja}>
          <h3 style={estilos.subtitulo}>Por medio de pago</h3>
          <div style={{ height: "260px", display: "flex", alignItems: "center", justifyContent: "center" }}>
            {metodos.length ? (
              <Doughnut data={datosMetodo} options={opcionesMetodo} />
            ) : (
              <span style={{ color: "#95a5a6" }}>Todavía no hay ventas hoy</span>
            )}
          </div>
        </div>
      </div>

      <div style={estilos.caja}>
        <h3 style={estilos.subtitulo}>Últimas ventas</h3>
        {resumen.ultimas.length === 0 ? (
          <p style={{ color: "#95a5a6", margin: "8px 0" }}>Todavía no hay ventas hoy. Cuando un cajero cobre, aparece acá al instante.</p>
        ) : (
          <div style={{ display: "flex", flexDirection: "column", gap: "8px" }}>
            {resumen.ultimas.map((v) => (
              <div
                key={v.idVenta}
                className="r-fila-lista"
                style={{
                  ...estilos.venta,
                  backgroundColor: destacada === v.idVenta ? "#e8f5e9" : "#fafbfc",
                  borderColor: destacada === v.idVenta ? "#81c784" : "#edf0f2",
                }}
              >
                <div style={{ minWidth: 0 }}>
                  <strong style={{ color: "#2c3e50" }}>
                    {new Date(v.fecha).toLocaleTimeString("es-AR", { hour: "2-digit", minute: "2-digit", timeZone: "America/Argentina/Buenos_Aires" })} · {v.cajero}
                  </strong>
                  <div style={{ color: "#7f8c8d", fontSize: "0.85em", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                    {v.items.map((i) => `${i.cantidad}× ${i.nombre}`).join(", ")} · {v.metodoPago}
                  </div>
                </div>
                <div style={{ textAlign: "right", flexShrink: 0 }}>
                  <strong style={{ color: "#261d60" }}>{pesos(v.total)}</strong>
                  <div style={{ color: "#2e7d32", fontSize: "0.85em", fontWeight: 600 }}>+{pesos(v.ganancia)}</div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </section>
  );
}

const estilos = {
  seccion: { backgroundColor: "#ffffff", borderRadius: "14px", padding: "26px", boxShadow: "0 4px 18px rgba(0,0,0,0.03)", border: "1px solid #edf0f2", marginBottom: "30px", display: "flex", flexDirection: "column", gap: "18px" },
  encabezado: { display: "flex", justifyContent: "space-between", alignItems: "flex-start", flexWrap: "wrap", gap: "12px" },
  indicador: { display: "inline-flex", alignItems: "center", gap: "8px", padding: "6px 12px", borderRadius: "20px", fontSize: "0.85em", fontWeight: 700 },
  punto: { width: "9px", height: "9px", borderRadius: "50%", display: "inline-block" },
  tarjetas: { display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(min(170px, 100%), 1fr))", gap: "14px" },
  tarjeta: { display: "flex", flexDirection: "column", gap: "4px", padding: "16px", borderRadius: "12px", border: "1px solid #edf0f2", backgroundColor: "#fafbfc" },
  tarjetaTitulo: { fontSize: "0.78em", color: "#7f8c8d", fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.5px" },
  graficos: { display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(min(320px, 100%), 1fr))", gap: "18px" },
  caja: { border: "1px solid #edf0f2", borderRadius: "12px", padding: "16px", minWidth: 0 },
  subtitulo: { margin: "0 0 12px", color: "#2c3e50", fontSize: "1em" },
  venta: { display: "flex", justifyContent: "space-between", alignItems: "center", gap: "12px", padding: "10px 12px", borderRadius: "10px", border: "1px solid", transition: "background-color 0.6s, border-color 0.6s" },
};
