// src/services/archiveService.js
import axios from 'axios';

// URL para subir a Google Drive
const API_URL_DRIVE = 'http://127.0.0.1:8000/api/upload-to-drive/';
// --- 1. Definir la URL de WhatsApp ---
const API_URL_WHATSAPP = 'http://127.0.0.1:8000/api/enviar-informe/';

/**
 * Envía el PDF en formato Base64 al backend para que lo suba a Google Drive.
 * @param {string} pdfBase64 - El contenido del PDF como string Base64.
 * @param {string} fileName - El nombre que tendrá el archivo.
 * @returns {Promise<any>} La respuesta del backend, que debe incluir la URL de Drive.
 */
const uploadReportToDrive = (pdfBase64, fileName) => {
  const dataToSend = {
    pdf_data: pdfBase64,
    file_name: fileName,
  };
  return axios.post(API_URL_DRIVE, dataToSend);
};

// --- 2. Crear la función que falta ---
/**
 * Llama al backend para enviar el informe por WhatsApp.
 * @param {string} contactId - El ID del contacto.
 * @param {string} pdfUrl - La URL pública del archivo en Google Drive.
 */
const sendReportByWhatsApp = (contactId, pdfUrl) => {
  const dataToSend = {
    id_contacto: contactId,
    pdf_url: pdfUrl, // El backend ya no necesita el nombre_archivo
  };
  return axios.post(API_URL_WHATSAPP, dataToSend);
};

// --- 3. Exportar AMBAS funciones ---
const archiveService = {
  uploadReportToDrive,
  sendReportByWhatsApp, // <-- Esta era la línea que faltaba
};

export default archiveService;