// src/components/ArchivoPDF.jsx
// VERSIÓN FINAL CON DISEÑO COMPLETO Y ENVÍO AUTOMÁTICO A WHATSAPP

import React, { useRef, useState, useEffect, useCallback } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import jsPDF from 'jspdf';
import html2canvas from 'html2canvas';
import { Button, Container, Alert, Spinner, InputGroup, Form } from 'react-bootstrap';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faArrowLeft, faCloudUploadAlt, faCheckCircle, faExclamationTriangle, faCopy, faKey, faSyncAlt } from '@fortawesome/free-solid-svg-icons';

// --- CORRECCIÓN: Se utilizan rutas absolutas para asegurar que los módulos se encuentren ---
import archiveService from '/src/services/archiveService.js';
import Logo from '/src/assets/Logo.png';

function ArchivoPDF() {
    const location = useLocation();
    const navigate = useNavigate();
    const reportTemplateRef = useRef(null);
    const reportData = location.state?.reportData;

    const [isProcessing, setIsProcessing] = useState(true);
    const [processStatus, setProcessStatus] = useState({
        status: 'processing',
        message: 'Generando informe...',
        url: ''
    });

    // --- LÓGICA DE GUARDADO Y ENVÍO AUTOMÁTICO ---
    const generateUploadAndSend = useCallback(async () => {
        setIsProcessing(true);
        const input = reportTemplateRef.current;
        await new Promise(resolve => setTimeout(resolve, 500));

        if (!input || !reportData) {
            setProcessStatus({ status: 'error', message: 'Faltan datos o la plantilla no se pudo cargar.' });
            setIsProcessing(false);
            return;
        }

        try {
            // --- PASO 1: Generar y Subir a Google Drive ---
            setProcessStatus({ status: 'processing', message: 'Generando PDF y subiendo a Google Drive...', url: '' });
            const canvas = await html2canvas(input, { scale: 2, useCORS: true });
            const pdf = new jsPDF('p', 'mm', 'a4');
            const pdfWidth = pdf.internal.pageSize.getWidth();
            const ratio = canvas.width / canvas.height;
            const imgHeight = pdfWidth / ratio;
            pdf.addImage(canvas.toDataURL('image/png'), 'PNG', 0, 0, pdfWidth, imgHeight);

            const pdfBase64 = pdf.output('datauristring').split(',')[1];
            const fileName = `Informe_${reportData.lugar?.replace(/\s/g, '_')}_${Date.now()}.pdf`;

            const uploadResponse = await archiveService.uploadReportToDrive(pdfBase64, fileName);
            const driveUrl = uploadResponse.data.drive_url;

            setProcessStatus({
                status: 'processing',
                message: 'Informe guardado en Drive. Enviando por WhatsApp...',
                url: driveUrl
            });

            // --- PASO 2: Enviar por WhatsApp ---
            if (!reportData.contactoSeleccionadoId) {
                throw new Error("No se seleccionó un contacto para el envío.");
            }

            const whatsAppResponse = await archiveService.sendReportByWhatsApp(
                reportData.contactoSeleccionadoId,
                fileName,
                driveUrl
            );

            // --- PASO 3: Mostrar Éxito Final ---
            setProcessStatus({
                status: 'success',
                message: whatsAppResponse.data.message || '¡Informe subido y enviado exitosamente!',
                url: driveUrl
            });

        } catch (error) {
            if (error.response && error.response.status === 401) {
                setProcessStatus({
                    status: 'authorization_required',
                    message: 'Se necesita permiso para acceder a Google Drive. Por favor, autoriza la aplicación.',
                });
            } else {
                console.error("Error en el proceso:", error);
                const errorMessage = error.response?.data?.error || error.response?.data?.message || error.message || "Ocurrió un error desconocido.";
                setProcessStatus({ status: 'error', message: `Fallo en el proceso: ${errorMessage}` });
            }
        } finally {
            setIsProcessing(false);
        }
    }, [reportData]);

    useEffect(() => {
        generateUploadAndSend();
    }, [generateUploadAndSend]);

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

    const retryUpload = () => {
        generateUploadAndSend();
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
                {isProcessing && (<Alert variant="info"> <Spinner size="sm" className="me-2" /> {processStatus.message} </Alert>)}

                {processStatus.status === 'success' && (
                    <Alert variant="success">
                        <Alert.Heading><FontAwesomeIcon icon={faCheckCircle} className="me-2" /> Proceso Completado</Alert.Heading>
                        <p>{processStatus.message}</p>
                        <hr />
                        <InputGroup><Form.Control value={processStatus.url} readOnly /><Button variant="outline-success" onClick={() => copyToClipboard(processStatus.url)}><FontAwesomeIcon icon={faCopy} /> Copiar Enlace</Button></InputGroup>
                    </Alert>
                )}

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
                            Reintentar Proceso
                        </Button>
                    </Alert>
                )}

                {processStatus.status === 'error' && (<Alert variant="danger"><FontAwesomeIcon icon={faExclamationTriangle} className="me-2" /> {processStatus.message}</Alert>)}

                <Button variant="secondary" onClick={() => navigate('/')}> <FontAwesomeIcon icon={faArrowLeft} className="me-2" /> Crear Otro Informe </Button>
            </div>

            {/* --- INICIO DE LA PLANTILLA VISUAL RESTAURADA --- */}
            {/* Se oculta visualmente para no estorbar, pero está disponible para html2canvas */}
            <div style={{ position: 'absolute', left: '-9999px', top: '-9999px' }}>
                <div
                    ref={reportTemplateRef}
                    style={{
                        width: '800px',
                        margin: '0 auto',
                        backgroundColor: 'white',
                        padding: '30px',
                        boxShadow: '0 0 10px rgba(0, 0, 0, 0.1)',
                        fontFamily: 'Arial, sans-serif',
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
            </div>
        </Container>
    );
}

export default ArchivoPDF;
