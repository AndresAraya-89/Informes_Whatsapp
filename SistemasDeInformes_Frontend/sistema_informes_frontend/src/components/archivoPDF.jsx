// src/components/ArchivoPDF.jsx
// VERSIÓN CON GUARDADO AUTOMÁTICO EN GOOGLE DRIVE AL CARGAR LA PÁGINA

import React, { useRef, useState, useEffect } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import jsPDF from 'jspdf';
import html2canvas from 'html2canvas';
import { Button, Container, Alert, Spinner, InputGroup, Form } from 'react-bootstrap';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faArrowLeft, faCloudUploadAlt, faCheckCircle, faExclamationTriangle, faCopy } from '@fortawesome/free-solid-svg-icons';

import archiveService from '../services/archiveService'; // Importamos el servicio
import Logo from '../assets/Logo.png';

function ArchivoPDF() {
    const location = useLocation();
    const navigate = useNavigate();
    const reportTemplateRef = useRef(null);
    const reportData = location.state?.reportData;

    const [isProcessing, setIsProcessing] = useState(true); // Inicia en true para el proceso automático
    const [processStatus, setProcessStatus] = useState({
        status: 'processing', // 'processing', 'success', 'error'
        message: 'Generando y guardando informe en Google Drive...',
        url: ''
    });

    // --- LÓGICA DE GUARDADO AUTOMÁTICO ---
    // Este useEffect se ejecuta una sola vez cuando el componente se monta
    useEffect(() => {
        const generateAndUpload = async () => {
            const input = reportTemplateRef.current;
            // Esperamos un breve momento para asegurar que todo el DOM esté renderizado
            await new Promise(resolve => setTimeout(resolve, 500));

            if (!input || !reportData) {
                setProcessStatus({ status: 'error', message: 'Faltan datos o la plantilla no se pudo cargar.' });
                setIsProcessing(false);
                return;
            }

            try {
                // 1. Generar el PDF en memoria
                const canvas = await html2canvas(input, { scale: 2, useCORS: true });
                const pdf = new jsPDF('p', 'mm', 'a4');
                const pdfWidth = pdf.internal.pageSize.getWidth();
                const ratio = canvas.width / canvas.height;
                const imgHeight = pdfWidth / ratio;
                pdf.addImage(canvas.toDataURL('image/png'), 'PNG', 0, 0, pdfWidth, imgHeight);

                // 2. Obtener el PDF como un string Base64
                const pdfBase64 = pdf.output('datauristring').split(',')[1];
                const fileName = `Informe_${reportData.lugar?.replace(/\s/g, '_')}_${Date.now()}.pdf`;

                // 3. Enviar al backend para subir a Google Drive
                const response = await archiveService.uploadReportToDrive(pdfBase64, fileName);

                // 4. Mostrar el éxito y la URL devuelta por el backend
                setProcessStatus({
                    status: 'success',
                    message: '¡Informe guardado en Google Drive exitosamente!',
                    url: response.data.drive_url
                });

            } catch (error) {
                console.error("Error al guardar el informe:", error);
                const errorMessage = error.response?.data?.error || error.message || "Ocurrió un error desconocido.";
                setProcessStatus({ status: 'error', message: `Fallo al guardar: ${errorMessage}`, url: '' });
            } finally {
                setIsProcessing(false);
            }
        };

        generateAndUpload();
    }, []); // El array vacío asegura que se ejecute solo una vez

    const copyToClipboard = (text) => {
        navigator.clipboard.writeText(text);
        // Opcional: podrías añadir una pequeña alerta de "¡Copiado!" aquí
    };

    if (!reportData) {
        // ... (código para manejar el caso sin datos, no cambia)
    }

    return (
        <Container className="my-5 bg-light p-4">
            <div className="text-center mb-4">
                {/* --- INTERFAZ DE ESTADO DEL PROCESO --- */}
                {isProcessing && (
                    <Alert variant="info" className="d-flex align-items-center justify-content-center">
                        <Spinner as="span" animation="border" size="sm" role="status" aria-hidden="true" className="me-2" />
                        {processStatus.message}
                    </Alert>
                )}
                {processStatus.status === 'success' && (
                    <Alert variant="success">
                        <Alert.Heading><FontAwesomeIcon icon={faCheckCircle} className="me-2" /> {processStatus.message}</Alert.Heading>
                        <p className="mb-2">Ya puedes copiar el enlace para compartirlo.</p>
                        <InputGroup>
                            <Form.Control value={processStatus.url} readOnly />
                            <Button variant="outline-success" onClick={() => copyToClipboard(processStatus.url)}>
                                <FontAwesomeIcon icon={faCopy} /> Copiar Enlace
                            </Button>
                        </InputGroup>
                    </Alert>
                )}
                {processStatus.status === 'error' && (
                    <Alert variant="danger">
                        <FontAwesomeIcon icon={faExclamationTriangle} className="me-2" /> {processStatus.message}
                    </Alert>
                )}
                <Button variant="secondary" onClick={() => navigate('/')}>
                    <FontAwesomeIcon icon={faArrowLeft} className="me-2" />
                    Crear Otro Informe
                </Button>
            </div>

            {/* La plantilla del PDF sigue aquí para que html2canvas pueda "verla" */}
            <div ref={reportTemplateRef} style={{ maxWidth: '800px', margin: '0 auto', backgroundColor: 'white', padding: '30px', boxShadow: '0 0 10px rgba(0, 0, 0, 0.1)', fontFamily: 'Arial, sans-serif' }}>
                {/* El contenido de la plantilla no cambia */}
                {/* ... (código del diseño del informe) ... */}
            </div>
        </Container>
    );
}

export default ArchivoPDF;
