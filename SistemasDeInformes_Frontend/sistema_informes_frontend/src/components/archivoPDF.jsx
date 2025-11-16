// src/components/ArchivoPDF.jsx
// VERSIÓN CON FLUJO AUTOMÁTICO COMPLETO (DRIVE + WHATSAPP)

import React, { useRef, useState, useEffect, useCallback } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import jsPDF from 'jspdf';
import html2canvas from 'html2canvas';
import { Button, Container, Alert, Spinner, InputGroup, Form } from 'react-bootstrap';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
// --- Añadimos el ícono de envío (avión de papel) ---
import { faArrowLeft, faCloudUploadAlt, faCheckCircle, faExclamationTriangle, faCopy, faKey, faSyncAlt, faPaperPlane } from '@fortawesome/free-solid-svg-icons';

import archiveService from '../services/archiveService';
import Logo from '../assets/Logo.png'; // Asegúrate de que la ruta al logo es correcta

function ArchivoPDF() {
    const location = useLocation();
    const navigate = useNavigate();
    const reportTemplateRef = useRef(null);
    // Asumimos que 'reportData' viene de GenerarReporte.jsx
    // y que contiene 'contactoSeleccionadoId'
    const reportData = location.state?.reportData;

    const [isProcessing, setIsProcessing] = useState(true);
    const [processStatus, setProcessStatus] = useState({
        status: 'processing',
        message: 'Generando informe...', // Mensaje inicial
        url: ''
    });

    // Usamos un ref para evitar la doble ejecución en Modo Estricto de React
    const hasRun = useRef(false);

    // --- LÓGICA DE GUARDADO Y ENVÍO AUTOMÁTICO ---
    const generateAndUpload = useCallback(async () => {
        setIsProcessing(true);
        setProcessStatus({ status: 'processing', message: 'Iniciando subida a Google Drive...', url: '' });

        const input = reportTemplateRef.current;
        await new Promise(resolve => setTimeout(resolve, 500));

        if (!input || !reportData) {
            setProcessStatus({ status: 'error', message: 'Faltan datos o la plantilla no se pudo cargar.' });
            setIsProcessing(false);
            return;
        }

        try {
            // --- PASO 1: Generar y Subir a Google Drive ---
            setProcessStatus(prev => ({ ...prev, message: 'Subiendo informe a Google Drive...' }));
            const canvas = await html2canvas(input, { scale: 2, useCORS: true });
            const pdf = new jsPDF('p', 'mm', 'a4');
            const pdfWidth = pdf.internal.pageSize.getWidth();
            const ratio = canvas.width / canvas.height;
            const imgHeight = pdfWidth / ratio;
            pdf.addImage(canvas.toDataURL('image/png'), 'PNG', 0, 0, pdfWidth, imgHeight);

            const pdfBase64 = pdf.output('datauristring').split(',')[1];
            // Usamos el ID del contacto en el nombre del archivo para asegurar que sea único
            const fileName = `Informe_Contacto_${reportData.contactoSeleccionadoId}_${Date.now()}.pdf`;

            const uploadResponse = await archiveService.uploadReportToDrive(pdfBase64, fileName);
            const driveUrl = uploadResponse.data.drive_url;
            console.log("Informe subido a Drive:", driveUrl);

            // --- PASO 2: Enviar por WhatsApp ---
            setProcessStatus(prev => ({ ...prev, status: 'processing', message: '¡Guardado! Enviando por WhatsApp...', url: driveUrl }));

            if (!reportData.contactoSeleccionadoId) {
                // Esta validación es clave
                throw new Error("No se seleccionó un contacto para el envío.");
            }

            const whatsAppResponse = await archiveService.sendReportByWhatsApp(
                reportData.contactoSeleccionadoId,
                driveUrl
            );

            // --- PASO 3: Éxito Total ---
            setProcessStatus({
                status: 'success',
                message: whatsAppResponse.data.message || '¡Informe guardado y enviado exitosamente!',
                url: driveUrl
            });

        } catch (error) {
            // Manejo de errores mejorado
            if (error.response && error.response.status === 401) {
                setProcessStatus({
                    status: 'authorization_required',
                    message: 'Se necesita permiso para acceder a Google Drive. Por favor, autoriza la aplicación.',
                });
            } else {
                console.error("Error en el proceso:", error);
                // Si el error es de la API de backend, mostramos ese mensaje
                const serverErrorMessage = error.response?.data?.error || error.response?.data?.message;
                // Si no, mostramos el error general
                const errorMessage = serverErrorMessage || error.message || "Ocurrió un error desconocido.";
                setProcessStatus({ status: 'error', message: `Fallo en el proceso: ${errorMessage}` });
            }
        } finally {
            setIsProcessing(false);
        }
    }, [reportData]); // Depende de 'reportData'

    // Este useEffect inicia todo el proceso automáticamente
    useEffect(() => {
        // Evita la doble ejecución en Modo Estricto
        if (hasRun.current || !reportData) return;
        hasRun.current = true;

        generateAndUpload();
    }, [generateAndUpload, reportData]); // Se ejecuta cuando la función y los datos están listos

    const copyToClipboard = (text) => {
        navigator.clipboard.writeText(text);
    };

    const redirectToAuth = () => {
        window.open('http://127.0.0.1:8000/api/authorize/', '_blank');
        setProcessStatus({
            status: 'info',
            message: 'Una vez que completes la autorización en la nueva pestaña, haz clic en Reintentar.',
        });
    };

    // La función de reintento ahora simplemente vuelve a llamar a la función principal
    const retryUpload = () => {
        generateAndUpload();
    };

    if (!reportData) {
        return (
            <Container className="text-center mt-5">
                <Alert variant="warning">No se han proporcionado datos para generar el informe.</Alert>
                <Button variant="secondary" onClick={() => navigate('/')}>
                    <FontAwesomeIcon icon={faArrowLeft} className="me-2" />
                    Volver al Formulario
                </Button>
            </Container>
        );
    }

    return (
        <Container className="my-5 bg-light p-4">
            <div className="text-center mb-4">
                {/* --- INTERFAZ DE ESTADO MEJORADA --- */}

                {isProcessing && (
                    <Alert variant="info">
                        <Spinner size="sm" className="me-2" />
                        {processStatus.message} {/* Muestra mensajes dinámicos */}
                    </Alert>
                )}

                {processStatus.status === 'success' && (
                    <Alert variant="success">
                        <Alert.Heading><FontAwesomeIcon icon={faCheckCircle} className="me-2" /> {processStatus.message}</Alert.Heading>
                        <InputGroup>
                            <Form.Control value={processStatus.url} readOnly />
                            <Button variant="outline-success" onClick={() => copyToClipboard(processStatus.url)}>
                                <FontAwesomeIcon icon={faCopy} /> Copiar Enlace
                            </Button>
                        </InputGroup>
                    </Alert>
                )}

                {/* ... (Alertas de autorización, info y error sin cambios) ... */}
                {processStatus.status === 'authorization_required' && (
                    <Alert variant="warning">
                        <Alert.Heading><FontAwesomeIcon icon={faKey} className="me-2" /> Se requiere autorización</Alert.Heading>
                        <p>{processStatus.message}</p>
                        <Button variant="warning" onClick={redirectToAuth}>Autorizar con Google</Button>
                    </Alert>
                )}
                {processStatus.status === 'info' && (
                    <Alert variant="info">
                        <p>{processStatus.message}</p>
                        <Button variant="info" onClick={retryUpload}>
                            <FontAwesomeIcon icon={faSyncAlt} className="me-2" />
                            Reintentar Subida
                        </Button>
                    </Alert>
                )}
                {processStatus.status === 'error' && (
                    <Alert variant="danger">
                        <FontAwesomeIcon icon={faExclamationTriangle} className="me-2" /> {processStatus.message}
                    </Alert>
                )}

                <Button variant="secondary" onClick={() => navigate('/')}>
                    <FontAwesomeIcon icon={faArrowLeft} className="me-2" /> Crear Otro Informe
                </Button>
            </div>

            {/* --- INICIO DE LA PLANTILLA VISUAL RESTAURADA --- */}
            <div
                ref={reportTemplateRef}
                style={{
                    width: '800px', // Ancho fijo para consistencia del PDF
                    margin: '0 auto',
                    backgroundColor: 'white',
                    padding: '30px',
                    boxShadow: '0 0 10px rgba(0, 0, 0, 0.1)',
                    fontFamily: 'Arial, sans-serif',
                    textAlign: 'left',
                }}
            >
                {/* Header */}
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
                    <img src={Logo} alt="Logo de la empresa" style={{ maxHeight: '80px' }} />
                    <div style={{ fontSize: '24px', fontWeight: 'bold', textAlign: 'center', flexGrow: 1 }}>
                        Informe de Incidente
                    </div>
                    <div style={{ width: '80px' }}>&nbsp;</div>
                </div>

                <div style={{ textAlign: 'right', fontStyle: 'italic', marginBottom: '20px' }}>
                    Aprobado por:<br />
                    Gerencia General
                </div>

                {/* Detalles del Incidente */}
                <div style={{ marginBottom: '20px' }}>
                    <div style={{ fontWeight: 'bold', marginTop: '15px' }}>
                        Fecha: {reportData.fecha}
                    </div>
                    <div style={{ marginBottom: '8px', marginTop: '15px' }}>
                        <span style={{ fontWeight: 'bold', display: 'inline-block', width: '180px' }}>Lugar del evento:</span>
                        {reportData.lugar}
                    </div>
                    <div style={{ marginBottom: '8px' }}>
                        <span style={{ fontWeight: 'bold', display: 'inline-block', width: '180px' }}>Oficiales en servicio:</span>
                        {reportData.oficiales}
                    </div>
                    <div style={{ marginBottom: '8px' }}>
                        <span style={{ fontWeight: 'bold', display: 'inline-block', width: '180px' }}>Tipo de incidente:</span>
                        {reportData.tipoIncidente}
                    </div>
                    <div style={{ marginBottom: '8px' }}>
                        <span style={{ fontWeight: 'bold', display: 'inline-block', width: '180px' }}>Datos del o los afectado:</span>
                        {reportData.afectado}
                    </div>
                    <div style={{ marginBottom: '8px' }}>
                        <span style={{ fontWeight: 'bold', display: 'inline-block', width: '180px' }}>Número de Cámara:</span>
                        {reportData.numeroCamara || 'N/A'}
                    </div>
                    <div style={{ marginBottom: '8px' }}>
                        <span style={{ fontWeight: 'bold', display: 'inline-block', width: '180px' }}>Contacto Seleccionado:</span>
                        {/* Usamos la propiedad 'Display' para el texto amigable */}
                        {reportData.contactoSeleccionadoDisplay || 'N/A'}
                    </div>
                </div>

                {/* Narración */}
                <div style={{ marginTop: '20px', lineHeight: '1.5' }}>
                    <div style={{ fontWeight: 'bold', marginTop: '15px' }}>Narración de Hecho:</div>
                    <p style={{ whiteSpace: 'pre-line', textAlign: 'justify' }}>
                        {reportData.narracion}
                    </p>
                </div>

                {/* Anexo */}
                <div style={{ marginTop: '30px', borderTop: '1px solid #ddd', paddingTop: '20px' }}>
                    <div style={{ fontWeight: 'bold', marginTop: '15px' }}>Anexo:</div>
                    {reportData.anexoUrl ? (
                        <img
                            src={reportData.anexoUrl}
                            alt="Incidente del informe"
                            style={{
                                maxWidth: '100%',
                                height: 'auto',
                                marginTop: '15px',
                                border: '1px solid #ddd',
                            }}
                        />
                    ) : (
                        <p>No se adjuntó anexo.</p>
                    )}
                </div>

                {/* Footer */}
                <div style={{ marginTop: '30px', textAlign: 'right', fontStyle: 'italic', fontSize: '11px' }}>
                    Teléfono: 8831-4676<br />
                    Email: sirymcr@gmail.com<br />
                    Dirección: Limón Urbanización Los Cocos
                </div>
            </div>
            {/* --- FIN DE LA PLANTILLA --- */}
        </Container>
    );
}

export default ArchivoPDF;