// src/App.jsx

import './App.css';
import { Routes, Route } from 'react-router-dom';
import GenerarReporte from './components/GenerarReporte.jsx';
import ArchivoPDF from './components/archivoPDF.jsx';
import ContactsPage from './components/ContactsPage.jsx';
import LoginPage from './components/LoginPage.jsx';
import UsersPage from './components/UsersPage.jsx';
import ProtectedRoute from './components/ProtectedRoute.jsx';
import ForceChangePassword from './components/ForceChangePassword.jsx';


function App() {
  return (
    <Routes>
      {/* --- Ruta Pública --- */}
      <Route path="/login" element={<LoginPage />} />

      {/* --- Rutas Protegidas --- */}
      <Route element={<ProtectedRoute />}>
        <Route path="/" element={<GenerarReporte />} />
        <Route path="/archivo-pdf" element={<ArchivoPDF />} />
        <Route path="/contacts" element={<ContactsPage />} />
        <Route path="/users" element={<UsersPage />} />
        <Route path="/cambiar-password" element={<ForceChangePassword />} />
      </Route>

    </Routes>
  );
}

export default App;