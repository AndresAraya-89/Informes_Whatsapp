// src/App.jsx  <-- Este es el único archivo 'App' que necesitas

import './App.css';
import { Routes, Route } from 'react-router-dom';

// --- Importa tus componentes/páginas aquí ---
import ContactsPage from './components/ContactsPage';
// import ProtectedRoute from './components/ProtectedRoute'; // Descomenta esto cuando lo necesites

function App() {
  return (
    <Routes>
      {/* Ruta para la página principal */}
      <Route path="/" element={<div>Página de Inicio</div>} />

      {/* --- Tu ruta de contactos --- */}
      {/* Para depurar, la dejamos fuera del ProtectedRoute por ahora */}
      <Route path="/contacts" element={<ContactsPage />} />
      <Route path="/ReportPDF" element={<ContactsPage />} />

      {/* Aquí irían tus otras rutas. Ejemplo con ruta protegida: */}
      {/*
      <Route element={<ProtectedRoute />}>
        <Route path="/dashboard" element={<div>Dashboard Protegido</div>} />
      </Route>
      */}

    </Routes>
  );
}

export default App;