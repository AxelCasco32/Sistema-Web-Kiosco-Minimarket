// pages/admin/Resumen.jsx
// Módulo de inicio del panel: ganancias del día en tiempo real.
import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import api from "../../services/api";
import GananciasEnVivo from "../../components/GananciasEnVivo";
import { STOCK_CRITICO } from "../../utils/stockCritico";

function Encabezado({ titulo, subtitulo }) {
  return (
    <div style={{ marginBottom: "22px" }}>
      <h1 style={{ margin: 0, color: "#261d60", fontSize: "1.6rem" }}>{titulo}</h1>
      {subtitulo && <p style={{ margin: "4px 0 0", color: "#7f8c8d" }}>{subtitulo}</p>}
    </div>
  );
}

export default function Resumen() {
  const [criticos, setCriticos] = useState(0);

  useEffect(() => {
    api
      .get("/productos")
      .then(({ data }) => setCriticos(data.filter((p) => p.Stock <= STOCK_CRITICO).length))
      .catch(() => {});
  }, []);

  return (
    <div className="r-pagina" style={{ padding: "30px", maxWidth: "1200px", margin: "0 auto" }}>
      <Encabezado titulo="Ganancias en vivo" subtitulo="Lo que entra hoy, actualizado con cada venta." />
      {criticos > 0 && (
        <Link
          to="/admin/stock"
          style={{ display: "flex", alignItems: "center", justifyContent: "space-between", gap: "12px", flexWrap: "wrap", textDecoration: "none", backgroundColor: "#fff5f5", border: "1px solid #fecaca", borderLeft: "5px solid #c62828", borderRadius: "10px", padding: "12px 16px", marginBottom: "20px", color: "#b71c1c" }}
        >
          <strong>
            {criticos} producto{criticos === 1 ? "" : "s"} en stock crítico
          </strong>
          <span style={{ fontWeight: 700, color: "#261d60" }}>Ver stock y enviar pedido →</span>
        </Link>
      )}
      <GananciasEnVivo />
    </div>
  );
}
