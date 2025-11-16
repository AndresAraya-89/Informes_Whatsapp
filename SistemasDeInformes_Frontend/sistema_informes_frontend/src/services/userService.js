// src/services/userService.js

import axios from 'axios';
// Importamos authService para poder obtener el token
import authService from './authService.js';

// URL base de tu API de Django
const API_URL = 'http://127.0.0.1:8000/api/';

// --- Creamos un "cliente" de Axios ---
// Esto nos permite configurar un cliente que *automáticamente*
// incluirá el token de autenticación en todas sus peticiones.
const apiClient = axios.create({
    baseURL: API_URL
});

apiClient.interceptors.request.use(
    (config) => {
        // 1. Obtenemos el token del authService
        const token = authService.getAuthToken();
        if (token) {
            // 2. Si el token existe, lo añadimos a la cabecera 'Authorization'
            config.headers['Authorization'] = `Bearer ${token}`;
        }
        return config;
    },
    (error) => {
        return Promise.reject(error);
    }
);

// --- 3. Definimos todas las funciones que tus componentes necesitan ---

/**
 * Obtiene la lista completa de usuarios.
 * Llama a: GET /api/users/
 */
const getAllUsers = () => {
    return apiClient.get('users/');
};

/**
 * Obtiene el perfil del usuario que ha iniciado sesión.
 * Llama a: GET /api/users/me/
 */
const getSelfProfile = () => {
    return apiClient.get('users/me/');
};

/**
 * Crea un nuevo usuario.
 * Llama a: POST /api/users/
 */
const createUser = (userData) => {
    return apiClient.post('users/', userData);
};

/**
 * Actualiza un usuario por su ID.
 * Llama a: PUT /api/users/{id}/
 */
const updateUser = (id, userData) => {
    return apiClient.put(`users/${id}/`, userData);
};

/**
 * Actualiza solo el estado de un usuario.
 * Llama a: PATCH /api/users/update-status/{id}/
 */
const updateUserStatus = (id, estadoActividad) => {
    return apiClient.patch(`users/update-status/${id}/`, { estadoActividad });
};

/**
 * Desactiva (eliminado lógico) un usuario por su ID.
 * Llama a: DELETE /api/users/{id}/
 */
const deleteUser = (id) => {
    return apiClient.delete(`users/${id}/`);
};


// --- 4. Exportamos todas las funciones en un solo objeto ---
const userService = {
    getAllUsers,
    getSelfProfile,
    createUser,
    updateUser,
    updateUserStatus,
    deleteUser
};

export default userService;