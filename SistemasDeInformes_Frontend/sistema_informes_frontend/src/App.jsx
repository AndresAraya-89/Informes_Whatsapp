// src/App.jsx

import './App.css';
import { Routes, Route } from 'react-router-dom';

// Importa los componentes de las páginas
import GenerarReporte from './components/GenerarReporte.jsx';
import ArchivoPDF from './components/ArchivoPDF.jsx';
import ContactsPage from './components/ContactsPage.jsx';

function App() {
  return (
    <Routes>
      {/* La página principal ahora es el formulario para generar reportes */}
      <Route path="/" element={<GenerarReporte />} />

      {/* Ruta para la previsualización y generación del PDF */}
      <Route path="/archivo-pdf" element={<ArchivoPDF />} />

      {/* Ruta para la gestión de contactos (sigue disponible) */}
      <Route path="/contacts" element={<ContactsPage />} />
    </Routes>
  );
}

export default App;
