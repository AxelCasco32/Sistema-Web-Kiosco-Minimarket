// App.jsx
// Componente raíz: define las rutas de la aplicación.
//   /login, /recuperar-contrasena      -> públicas
//   /apertura-caja, /pos               -> Cajero y Admin
//   Panel de Admin (menú lateral en components/admin/AdminLayout.jsx):
//     /admin (ganancias en vivo), /admin/stock, /admin/usuarios,
//     /crear-producto, /editar-producto, /historial-ventas, /reportes,
//     /cierres-caja, /auditoria-stock

import { Navigate, Route, Routes } from "react-router-dom";
import Login from "./pages/Login";
import Pos from "./pages/Pos";
import CrearProducto from "./pages/CrearProducto";
import EditarProducto from "./pages/EditarProducto";
import RutaProtegida from "./components/RutaProtegida"; 
import HistorialVentas from "./pages/HistorialVentas";
import AperturaCaja from './components/AperturaCaja';
import Reportes from "./pages/Reportes";
import AuditoriaStock from "./pages/AuditoriaStock";
import CierresCaja from "./pages/CierresCaja";
import RecuperarContrasena from "./pages/RecuperarContrasena";
import AdminLayout from "./components/admin/AdminLayout";
import Resumen from "./pages/admin/Resumen";
import Usuarios from "./pages/admin/Usuarios";
import Stock from "./pages/admin/Stock";

function App() {
  return (
    <Routes>
      {/* Redirección automática de la raíz al login */}
      <Route path="/" element={<Navigate to="/login" replace />} />
      
      {/* 1. Ruta Pública */}
      <Route path="/login" element={<Login />} />
      <Route path="/recuperar-contrasena" element={<RecuperarContrasena />} />

      {/* 2. Ruta de Apertura de Caja (¡Protegida!) */}
      <Route 
        path="/apertura-caja" 
        element={
          <RutaProtegida rolesPermitidos={['Cajero', 'Admin']}>
            <AperturaCaja />
          </RutaProtegida>
        } 
      />

      {/* 3. Ruta del POS */}
      <Route 
        path="/pos" 
        element={
          <RutaProtegida rolesPermitidos={['Cajero', 'Admin']}>
            <Pos />
          </RutaProtegida>
        } 
      />

      {/* 4. Panel del Administrador: todos los módulos comparten el menú lateral */}
      <Route element={<RutaProtegida rolesPermitidos={['Admin']}><AdminLayout /></RutaProtegida>}>
        <Route path="/admin" element={<Resumen />} />
        <Route path="/admin/stock" element={<Stock />} />
        <Route path="/admin/usuarios" element={<Usuarios />} />
        <Route path="/crear-producto" element={<CrearProducto />} />
        <Route path="/editar-producto" element={<EditarProducto />} />
        <Route path="/historial-ventas" element={<HistorialVentas />} />
        <Route path="/reportes" element={<Reportes />} />
        <Route path="/auditoria-stock" element={<AuditoriaStock />} />
        <Route path="/cierres-caja" element={<CierresCaja />} />
      </Route>

      {/* 5. Ruta Comodín: Si tipean cualquier fruta, los mandamos al login */}
      <Route path="*" element={<Navigate to="/login" replace />} />

    </Routes>
  );
}

export default App;