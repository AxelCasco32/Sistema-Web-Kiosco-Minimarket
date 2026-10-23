// App.jsx
// Componente raíz. Responsabilidad: definir el router (react-router-dom)
// y las rutas principales de la app:
//   /login   -> pages/Login.jsx
//   /pos     -> pages/Pos.jsx        (pantalla de cobro del Cajero)
//   /admin   -> pages/AdminDashboard.jsx
//   /cierre  -> pages/CierreCaja.jsx
// También debe envolver la app con el AuthContext para saber qué usuario/rol
// está logueado y proteger rutas según corresponda.

// App.jsx
// Componente raíz. Responsabilidad: definir el router (react-router-dom)
// y las rutas principales de la app:
//   /login   -> pages/Login.jsx
//   /pos     -> pages/Pos.jsx        (pantalla de cobro del Cajero)
//   /admin   -> pages/AdminDashboard.jsx
//   /cierre  -> pages/CierreCaja.jsx (Nota: se agregará en el próximo sprint)
// También debe envolver la app con el AuthContext para saber qué usuario/rol
// está logueado y proteger rutas según corresponda.

import { Navigate, Route, Routes } from "react-router-dom";
import Login from "./pages/Login";
import Pos from "./pages/Pos";
import AdminDashboard from "./pages/AdminDashboard";
import CrearProducto from "./pages/CrearProducto";
import EditarProducto from "./pages/EditarProducto";
import RutaProtegida from "./components/RutaProtegida"; 
import HistorialVentas from "./pages/HistorialVentas";
import AperturaCaja from './components/AperturaCaja';
import Reportes from "./pages/Reportes";

function App() {
  return (
    <Routes>
      {/* Redirección automática de la raíz al login */}
      <Route path="/" element={<Navigate to="/login" replace />} />
      
      {/* 1. Ruta Pública */}
      <Route path="/login" element={<Login />} />

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

      {/* 4. Rutas exclusivas del Administrador */}
      <Route path="/admin" element={<RutaProtegida rolesPermitidos={['Admin']}><AdminDashboard /></RutaProtegida>} />
      <Route path="/crear-producto" element={<RutaProtegida rolesPermitidos={['Admin']}><CrearProducto /></RutaProtegida>} />
      <Route path="/editar-producto" element={<RutaProtegida rolesPermitidos={['Admin']}><EditarProducto /></RutaProtegida>} />
      <Route path="/historial-ventas" element={<RutaProtegida rolesPermitidos={['Admin']}><HistorialVentas /></RutaProtegida>} />

      {/* 5. Ruta Comodín: Si tipean cualquier fruta, los mandamos al login */}
      <Route path="*" element={<Navigate to="/login" replace />} />

      <Route path="/reportes" element={<Reportes />} />
    </Routes>
  );
}

export default App;