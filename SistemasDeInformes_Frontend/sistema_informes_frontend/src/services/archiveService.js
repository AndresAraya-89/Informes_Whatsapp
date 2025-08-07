// src/services/archiveService.js
import axios from 'axios';

// Nuevo endpoint en tu API de Django para subir a Drive
const API_URL_DRIVE = 'http://127.0.0.1:8000/api/upload-to-drive/'; 

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

const archiveService = {
  uploadReportToDrive,
};

export default archiveService;
