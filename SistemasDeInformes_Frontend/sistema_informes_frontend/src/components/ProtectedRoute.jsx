// src/components/ProtectedRoute.jsx
// Actualizado para manejar el "estado de recuperación"

import React from 'react';
import { Navigate, Outlet, useLocation } from 'react-router-dom';
import authService from '../services/authService'; // Ajusta la ruta si es necesario

function ProtectedRoute() {
    const authToken = authService.getAuthToken();
    const isRecoveryNeeded = authService.isRecoveryNeeded();
    const location = useLocation();

    // 1. No está logueado
    if (!authToken) {
        // Redirige al login, guardando la página que intentaba visitar
        return <Navigate to="/login" state={{ from: location }} replace />;
    }

    // 2. Está logueado, PERO necesita cambiar su contraseña
    if (isRecoveryNeeded) {
        // Si está en modo recuperación, SÓLO puede acceder a la página de /cambiar-password
        // Si intenta ir a cualquier otra página (ej. '/'), lo redirigimos forzosamente.
        if (location.pathname !== '/cambiar-password') {
            return <Navigate to="/cambiar-password" replace />;
        }
    }

    // 3. Está logueado, Y NO necesita cambiar contraseña
    if (!isRecoveryNeeded) {
        // Si ya cambió su contraseña e intenta volver a /cambiar-password,
        // lo mandamos a la página principal.
        if (location.pathname === '/cambiar-password') {
            return <Navigate to="/" replace />;
        }
    }

    // 4. Si pasa todas las validaciones, le damos acceso
    return <Outlet />;
}

export default ProtectedRoute;