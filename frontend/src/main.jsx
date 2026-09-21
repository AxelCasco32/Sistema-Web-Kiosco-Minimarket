// main.jsx
// Punto de entrada de la app React.
// Responsabilidad: montar el componente raíz (App) dentro del <div id="root">
// del index.html. No debe contener lógica, solo el bootstrap de React.
import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import { BrowserRouter } from "react-router-dom";

import App from "./App";
import { AuthProvider } from "./context/AuthContext";
// https://react.dev/reference/react-dom/client/createRoot
// https://reactrouter.com/api/declarative-router/BrowserRouter
// StrictMode durante el desarrollo
createRoot(document.getElementById("root")).render(
  <StrictMode>
    <BrowserRouter>
      <AuthProvider>
        <App></App>
      </AuthProvider>
    </BrowserRouter>
  </StrictMode>
);
