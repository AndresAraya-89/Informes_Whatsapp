// src/services/authService.js
import axios from 'axios';
import { jwtDecode } from 'jwt-decode';

const API_URL = 'http://127.0.0.1:8000/api/';

// URLs de los endpoints
const LOGIN_URL = `${API_URL}token/`;
const FORGOT_PASSWORD_URL = `${API_URL}recuperar-password/`;
const CHANGE_PASSWORD_URL = `${API_URL}cambiar-password/`;

/**
 * Intenta iniciar sesión en el backend.
 */
const login = async (username, password) => {
    try {
        const response = await axios.post(LOGIN_URL, {
            username,
            password
        });

        if (response.data.access) {
            localStorage.setItem('authToken', JSON.stringify(response.data));
            const decodedToken = jwtDecode(response.data.access);
            return { isRecoveryNeeded: decodedToken.estadoRecuperacion };
        }
        return { isRecoveryNeeded: false };
    } catch (error) {
        console.error("Error en el inicio de sesión:", error.response?.data || error.message);
        throw error;
    }
};

/**
 * Cierra la sesión del usuario eliminando los tokens.
 */
const logout = () => {
    localStorage.removeItem('authToken');
};

/**
 * Obtiene el token de acceso actual del localStorage.
 */
const getAuthToken = () => {
    const tokenData = localStorage.getItem('authToken');
    if (tokenData) {
        return JSON.parse(tokenData).access;
    }
    return null;
};

/**
 * Verifica si el usuario está en modo de recuperación de contraseña.
 */
const isRecoveryNeeded = () => {
    const token = getAuthToken();
    if (!token) return false;

    try {
        const decodedToken = jwtDecode(token);
        return decodedToken.estadoRecuperacion === true;
    } catch (error) {
        return false;
    }
};

/**
 * Llama al endpoint de "Olvidé mi contraseña".
 * @param {string} username - El nombre de usuario.
 * @param {string} telefono - El teléfono (8 dígitos).
 * @param {string} email - El correo electrónico.
 */
// --- CAMBIO AQUÍ ---
// Ahora la función acepta y envía los tres campos.
// Usamos 'email' (minúscula) para ser consistentes con el modelo de Django
// (que aunque en la BD se llame 'CorreoElectronico', Django lo maneja como 'email').
const forgotPassword = (username, telefono, email) => {
    return axios.post(FORGOT_PASSWORD_URL, {
        username: username,
        telefono: telefono,
        email: email
    });
};


/**
 * Llama al endpoint para cambiar la contraseña (para usuarios ya logueados).
 */
const changePassword = (oldPassword, newPassword) => {
    const token = getAuthToken();
    return axios.post(CHANGE_PASSWORD_URL, {
        old_password: oldPassword,
        new_password: newPassword
    }, {
        headers: { Authorization: `Bearer ${token}` }
    });
};

// Asegúrate de que todas las funciones estén exportadas
const authService = {
    login,
    logout,
    getAuthToken,
    isRecoveryNeeded,
    forgotPassword,
    changePassword,
};

export default authService;