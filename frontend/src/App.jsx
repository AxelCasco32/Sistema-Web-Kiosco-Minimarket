// App.jsx
// Componente raíz. Responsabilidad: definir el router (react-router-dom)
// y las rutas principales de la app:
//   /login   -> pages/Login.jsx
//   /pos     -> pages/Pos.jsx        (pantalla de cobro del Cajero)
//   /admin   -> pages/AdminDashboard.jsx
//   /cierre  -> pages/CierreCaja.jsx
// También debe envolver la app con el AuthContext para saber qué usuario/rol
// está logueado y proteger rutas según corresponda.

import { Navigate, Route, Routes } from "react-router-dom";
import { useAuth } from "./context/AuthContext";
import Login from "./pages/Login";
import Pos from "./pages/Pos";
import AdminDashboard from "./pages/AdminDashboard";

//https://reactrouter.com/api/components/Navigate
// https://reactrouter.com/api/components/Routes
// https://reactrouter.com/api/components/Route

function RutaProtegida({ children }) {
  const { autenticado } = useAuth();

  if (!autenticado) {
    return <Navigate to="/login" replace />;
  }

  return children;
}

function App() {
  return (
    <Routes>
      <Route path="/login" element={<Login />} />
      <Route
        path="/pos"
        element={
          <RutaProtegida>
            <Pos />
          </RutaProtegida>
        }
      />
      <Route
        path="/admin"
        element={
          <RutaProtegida>
            <AdminDashboard />
          </RutaProtegida>
        }
      />
      <Route path="*" element={<Navigate to="/login" replace />} />
    </Routes>
  );
}

export default App;
