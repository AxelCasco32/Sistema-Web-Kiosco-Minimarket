// components/admin/AdminLayout.jsx
// Estructura común del panel de Administración: barra superior y menú lateral
// con los módulos agrupados por función. Cada módulo se muestra en <Outlet />.
// En celular el menú se abre con el botón ☰.
import { useEffect, useState } from "react";
import { NavLink, Outlet, useLocation } from "react-router-dom";
import { useAuth } from "../../context/AuthContext";
import api from "../../services/api";
import { avisoRapido } from "../../utils/alertas";
import { STOCK_CRITICO } from "../../utils/stockCritico";
import iconoMorado from "../../assets/IconoKiosquitoYa_morado.png";
import "./adminLayout.css";

const I = {
  resumen: <><line x1="18" y1="20" x2="18" y2="10" /><line x1="12" y1="20" x2="12" y2="4" /><line x1="6" y1="20" x2="6" y2="14" /></>,
  stock: <><path d="M21 16V8a2 2 0 0 0-1-1.73l-7-4a2 2 0 0 0-2 0l-7 4A2 2 0 0 0 3 8v8a2 2 0 0 0 1 1.73l7 4a2 2 0 0 0 2 0l7-4A2 2 0 0 0 21 16z" /><polyline points="3.27 6.96 12 12.01 20.73 6.96" /><line x1="12" y1="22.08" x2="12" y2="12" /></>,
  nuevo: <><circle cx="12" cy="12" r="10" /><line x1="12" y1="8" x2="12" y2="16" /><line x1="8" y1="12" x2="16" y2="12" /></>,
  editar: <><path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7" /><path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z" /></>,
  historial: <><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" /><polyline points="14 2 14 8 20 8" /><line x1="16" y1="13" x2="8" y2="13" /><line x1="16" y1="17" x2="8" y2="17" /></>,
  reportes: <><path d="M21.21 15.89A10 10 0 1 1 8 2.83" /><path d="M22 12A10 10 0 0 0 12 2v10z" /></>,
  cierres: <><rect x="2" y="6" width="20" height="12" rx="2" /><circle cx="12" cy="12" r="2" /></>,
  auditoria: <><path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z" /></>,
  usuarios: <><path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2" /><circle cx="9" cy="7" r="4" /><path d="M23 21v-2a4 4 0 0 0-3-3.87" /><path d="M16 3.13a4 4 0 0 1 0 7.75" /></>,
  caja: <><circle cx="9" cy="21" r="1" /><circle cx="20" cy="21" r="1" /><path d="M1 1h4l2.68 13.39a2 2 0 0 0 2 1.61h9.72a2 2 0 0 0 2-1.61L23 6H6" /></>,
};

const MENU = [
  { grupo: "Resumen", items: [{ a: "/admin", texto: "Ganancias en vivo", icono: "resumen", exacto: true }] },
  {
    grupo: "Productos",
    items: [
      { a: "/admin/stock", texto: "Stock", icono: "stock", alerta: true },
      { a: "/crear-producto", texto: "Nuevo producto", icono: "nuevo" },
      { a: "/editar-producto", texto: "Editar producto", icono: "editar" },
    ],
  },
  {
    grupo: "Ventas",
    items: [
      { a: "/historial-ventas", texto: "Historial", icono: "historial" },
      { a: "/reportes", texto: "Reportes", icono: "reportes" },
    ],
  },
  {
    grupo: "Control",
    items: [
      { a: "/cierres-caja", texto: "Cierres de caja", icono: "cierres" },
      { a: "/auditoria-stock", texto: "Auditoría", icono: "auditoria" },
    ],
  },
  { grupo: "Equipo", items: [{ a: "/admin/usuarios", texto: "Usuarios", icono: "usuarios" }] },
  { grupo: "Caja", items: [{ a: "/apertura-caja", texto: "Ir a cobrar", icono: "caja" }] },
];

const Icono = ({ nombre }) => (
  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
    {I[nombre]}
  </svg>
);

export default function AdminLayout() {
  const { logout, usuario } = useAuth();
  const location = useLocation();
  const [menuAbierto, setMenuAbierto] = useState(false);
  const [criticos, setCriticos] = useState(0);

  // Cantidad de productos en stock crítico (globito en "Stock").
  // Se actualiza al cambiar de módulo; avisa una vez por sesión.
  useEffect(() => {
    let activo = true;
    api
      .get("/productos")
      .then(({ data }) => {
        if (!activo) return;
        const cantidad = data.filter((p) => p.Stock <= STOCK_CRITICO).length;
        setCriticos(cantidad);
        let yaAvisado = false;
        try { yaAvisado = sessionStorage.getItem("aviso_stock_critico") === "1"; } catch { /* sin almacenamiento */ }
        if (cantidad > 0 && !yaAvisado) {
          avisoRapido(`Hay ${cantidad} producto${cantidad === 1 ? "" : "s"} en stock crítico`, "warning");
          try { sessionStorage.setItem("aviso_stock_critico", "1"); } catch { /* sin almacenamiento */ }
        }
      })
      .catch(() => {});
    setMenuAbierto(false);
    return () => { activo = false; };
  }, [location.pathname]);

  return (
    <div className="adm">
      <header className="adm-topbar">
        <button
          type="button"
          className="adm-hamburguesa"
          aria-label={menuAbierto ? "Cerrar menú" : "Abrir menú"}
          aria-expanded={menuAbierto}
          onClick={() => setMenuAbierto((v) => !v)}
        >
          <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.4" strokeLinecap="round"><line x1="3" y1="6" x2="21" y2="6" /><line x1="3" y1="12" x2="21" y2="12" /><line x1="3" y1="18" x2="21" y2="18" /></svg>
        </button>
        <div className="adm-marca">
          <img src={iconoMorado} alt="" />
          <div>
            <strong>KiosquitoYa</strong> <span className="adm-etiqueta">ADMIN</span>
          </div>
        </div>
        <div className="adm-usuario">
          <span className="adm-nombre">
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2" /><circle cx="12" cy="7" r="4" /></svg>
            {usuario?.nombre || "Admin"}
          </span>
          <button type="button" onClick={logout} className="adm-salir">Salir</button>
        </div>
      </header>

      <div className="adm-cuerpo">
        {menuAbierto && <div className="adm-fondo" onClick={() => setMenuAbierto(false)} aria-hidden="true" />}
        <nav className={`adm-menu ${menuAbierto ? "abierto" : ""}`} aria-label="Módulos de administración">
          {MENU.map((g) => (
            <div key={g.grupo} className="adm-grupo">
              <span className="adm-grupo-titulo">{g.grupo}</span>
              {g.items.map((it) => (
                <NavLink key={it.a} to={it.a} end={it.exacto} className={({ isActive }) => `adm-item ${isActive ? "activo" : ""}`}>
                  <Icono nombre={it.icono} />
                  <span>{it.texto}</span>
                  {it.alerta && criticos > 0 && (
                    <span className="adm-globito" title={`${criticos} en stock crítico`}>{criticos}</span>
                  )}
                </NavLink>
              ))}
            </div>
          ))}
        </nav>

        <main className="adm-contenido">
          <Outlet />
        </main>
      </div>
    </div>
  );
}
