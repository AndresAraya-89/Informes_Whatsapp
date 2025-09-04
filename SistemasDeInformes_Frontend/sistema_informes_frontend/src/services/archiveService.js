// src/services/archiveService.js
import axios from 'axios';

// URLs de los endpoints de la API
const API_URL_DRIVE = 'http://127.0.0.1:8000/api/upload-to-drive/';
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

/**
 * Llama al endpoint del backend para enviar el informe por WhatsApp.
 * @param {string} contactId - El ID del contacto.
 * @param {string} fileName - El nombre del archivo que se está enviando.
 * @param {string} pdfUrl - La URL pública del archivo en Google Drive.
 * @returns {Promise<any>}
 */
// --- CORRECCIÓN AQUÍ: La función ahora acepta los 3 parámetros ---
const sendReportByWhatsApp = (contactId, fileName, pdfUrl) => {
  const dataToSend = {
    id_contacto: contactId,
    nombre_archivo: fileName, // Se vuelve a incluir este campo
    pdf_url: pdfUrl,
  };
  return axios.post(API_URL_WHATSAPP, dataToSend);
};

// El objeto que se exporta ahora incluye ambas funciones
const archiveService = {
  uploadReportToDrive,
  sendReportByWhatsApp,
};

export default archiveService;
