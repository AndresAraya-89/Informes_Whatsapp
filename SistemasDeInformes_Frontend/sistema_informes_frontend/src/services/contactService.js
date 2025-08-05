// src/services/contactService.js (CORREGIDO)
import axios from 'axios';

const API_URL = 'http://127.0.0.1:8000/api/contactos/';

const getAllContacts = (params = {}) => {
    return axios.get(API_URL, { params });
};

const getContactById = (id) => {
    return axios.get(`${API_URL}${id}/`);
};

// POST: Crear un nuevo contacto
const createContact = (contactData) => {
    // Leemos las propiedades en camelCase y las mapeamos a PascalCase que la API espera.
    const dataToSend = {
        Nombre: contactData.nombre,
        Telefono: contactData.telefono,
        CorreoElectronico: contactData.correoElectronico,
    };
    return axios.post(API_URL, dataToSend);
};

// PUT: Actualizar un contacto existente
const updateContact = (id, contactData) => {
    const dataToSend = {
        Nombre: contactData.nombre,
        Telefono: contactData.telefono,
        CorreoElectronico: contactData.correoElectronico,
        Estado: contactData.estado,
    };
    return axios.put(`${API_URL}${id}/`, dataToSend);
};

// DELETE: Eliminar un contacto
const deleteContact = (id) => {
    // Aseguramos que el ID no sea undefined antes de construir la URL
    if (!id) {
        return Promise.reject(new Error("El ID del contacto no es válido"));
    }
    return axios.delete(`${API_URL}${id}/`);
};

const contactService = {
    getAllContacts,
    getContactById,
    createContact,
    updateContact,
    deleteContact,
};

export default contactService;