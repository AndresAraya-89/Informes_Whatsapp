// src/components/ArchivoPDF.jsx

import React, { useRef, useState, useEffect, useCallback } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import jsPDF from 'jspdf';
import html2canvas from 'html2canvas';
import { Button, Container, Alert, Spinner, InputGroup, Form } from 'react-bootstrap';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faArrowLeft, faCheckCircle, faExclamationTriangle, faCopy, faKey, faSyncAlt } from '@fortawesome/free-solid-svg-icons';
import archiveService from '../services/archiveService';
import Logo from '../assets/Logo.png'; // Asegúrate de que la ruta al logo es correcta

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

    const [copySuccess, setCopySuccess] = useState(false); // Estado para el botón de copiar
    const hasRun = useRef(false);

    // --- LÓGICA DE GUARDADO Y ENVÍO AUTOMÁTICO ---
    const generateAndUpload = useCallback(async () => {
        setIsProcessing(true);
        setProcessStatus({ status: 'processing', message: 'Iniciando subida a Google Drive...', url: '' });

        const input = reportTemplateRef.current;

        if (!input || !reportData) {
            setProcessStatus({ status: 'error', message: 'Faltan datos o la plantilla no se pudo cargar.' });
            setIsProcessing(false);
            return;
        }

        // 1. Guardamos los estilos responsivos originales
        const originalStyles = {
            width: input.style.width,
            maxWidth: input.style.maxWidth,
            margin: input.style.margin
        };

        // 2. FORZAMOS el ancho a 800px para que html2canvas genere el PDF en alta calidad
        input.style.width = '800px';
        input.style.maxWidth = '800px';
        input.style.margin = '0'; // Quitar 'auto' temporalmente

        await new Promise(resolve => setTimeout(resolve, 100));

        try {
            // --- PASO 1: Generar Canvas ---
            setProcessStatus(prev => ({ ...prev, message: 'Procesando informe (1/3)...' }));

            const canvas = await html2canvas(input, { scale: 2, useCORS: true });

            // --- LÓGICA DE PAGINACIÓN DE PDF (Corregida) ---
            const canvasImgData = canvas.toDataURL('image/png', 1.0);
            const pdf = new jsPDF('p', 'mm', 'a4');

            const pdfWidth = pdf.internal.pageSize.getWidth();
            const pdfHeight = pdf.internal.pageSize.getHeight();

            const canvasWidth = canvas.width;
            const canvasHeight = canvas.height;
            const ratio = pdfWidth / canvasWidth;
            const imgHeight = canvasHeight * ratio;

            let heightLeft = imgHeight;
            let position = 0;

            pdf.addImage(canvasImgData, 'PNG', 0, position, pdfWidth, imgHeight);
            heightLeft -= pdfHeight;

            while (heightLeft > 0) {
                position -= pdfHeight;
                pdf.addPage();
                pdf.addImage(canvasImgData, 'PNG', 0, position, pdfWidth, imgHeight);
                heightLeft -= pdfHeight;
            }
            // --- FIN DE LA CORRECCIÓN DE PAGINACIÓN ---

            const pdfBase64 = pdf.output('datauristring').split(',')[1];
            const fileName = `Informe_Contacto_${reportData.contactoSeleccionadoId}_${Date.now()}.pdf`;

            // --- PASO 2: Subir a Google Drive ---
            setProcessStatus(prev => ({ ...prev, message: 'Subiendo a Google Drive (2/3)...' }));
            const uploadResponse = await archiveService.uploadReportToDrive(pdfBase64, fileName);
            const driveUrl = uploadResponse.data.drive_url;

            // --- PASO 3: Enviar por WhatsApp ---
            setProcessStatus(prev => ({ ...prev, status: 'processing', message: '¡Guardado! Enviando por WhatsApp (3/3)...', url: driveUrl }));

            if (!reportData.contactoSeleccionadoId) {
                throw new Error("No se seleccionó un contacto para el envío.");
            }

            const whatsAppResponse = await archiveService.sendReportByWhatsApp(
                reportData.contactoSeleccionadoId,
                driveUrl
            );

            // --- PASO 4: Éxito Total ---
            setProcessStatus({
                status: 'success',
                message: whatsAppResponse.data.message || '¡Informe guardado y enviado exitosamente!',
                url: driveUrl
            });

        } catch (error) {
            // Manejo de errores
            if (error.response && error.response.status === 401) {
                setProcessStatus({
                    status: 'authorization_required',
                    message: 'Se necesita permiso para acceder a Google Drive. Por favor, autoriza la aplicación.',
                });
            } else {
                console.error("Error en el proceso:", error);
                const serverErrorMessage = error.response?.data?.error || error.response?.data?.message;
                const errorMessage = serverErrorMessage || error.message || "Ocurrió un error desconocido.";
                setProcessStatus({ status: 'error', message: `Fallo en el proceso: ${errorMessage}` });
            }
        } finally {
            setIsProcessing(false);

            // 4. DEVOLVEMOS el elemento a su estilo responsivo original
            if (input) {
                input.style.width = originalStyles.width;
                input.style.maxWidth = originalStyles.maxWidth;
                input.style.margin = originalStyles.margin;
            }
        }
    }, [reportData]);

    // Este useEffect inicia todo el proceso automáticamente
    useEffect(() => {
        if (hasRun.current || !reportData) return;
        hasRun.current = true;

        generateAndUpload();
    }, [generateAndUpload, reportData]);


    // --- FUNCIÓN DE COPIAR (Sin 'alert') ---
    const copyToClipboard = (text) => {
        const textArea = document.createElement("textarea");
        textArea.value = text;
        document.body.appendChild(textArea);
        textArea.focus();
        textArea.select();
        try {
            document.execCommand('copy');
            setCopySuccess(true);
            setTimeout(() => setCopySuccess(false), 2000);
        } catch (err) {
            console.error('No se pudo copiar el enlace: ', err);
        }
        document.body.removeChild(textArea);
    };

    const redirectToAuth = () => {
        window.open('http://127.0.0.1:8000/api/authorize/', '_blank');
        setProcessStatus({
            status: 'info',
            message: 'Una vez que completes la autorización en la nueva pestaña, haz clic en Reintentar.',
        });
    };

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
        <Container className="my-5 p-3 p-md-4">

            {/* --- PARTE 1: INTERFAZ DE CONTROL --- */}
            <div className="text-center mb-4">
                {isProcessing && (
                    <Alert variant="info">
                        <Spinner size="sm" className="me-2" />
                        {processStatus.message}
                    </Alert>
                )}

                {processStatus.status === 'success' && (
                    <Alert variant="success">
                        <Alert.Heading><FontAwesomeIcon icon={faCheckCircle} className="me-2" /> ¡Éxito!</Alert.Heading>
                        <p>{processStatus.message}</p>
                        <InputGroup>
                            <Form.Control value={processStatus.url} readOnly />

                            <Button
                                variant={copySuccess ? "success" : "outline-success"}
                                onClick={() => copyToClipboard(processStatus.url)}
                                disabled={copySuccess}
                            >
                                <FontAwesomeIcon icon={copySuccess ? faCheckCircle : faCopy} />
                                <span className="d-none d-sm-inline ms-2">
                                    {copySuccess ? "¡Copiado!" : "Copiar Enlace"}
                                </span>
                            </Button>
                        </InputGroup>
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
                            <FontAwesomeIcon icon={faSyncAlt} className="me-2" /> Reintentar Subida
                        </Button>
                    </Alert>
                )}

                {processStatus.status === 'error' && (
                    <Alert variant="danger">
                        <FontAwesomeIcon icon={faExclamationTriangle} className="me-2" /> {processStatus.message}
                    </Alert>
                )}

                <Button variant="secondary" onClick={() => navigate('/')} disabled={isProcessing}>
                    <FontAwesomeIcon icon={faArrowLeft} className="me-2" /> Crear Otro Informe
                </Button>
            </div>

            {/* --- PARTE 2: VISTA PREVIA DEL INFORME (RESPONSIVA) --- */}
            <div
                ref={reportTemplateRef}
                className="bg-white p-4 shadow w-100"
                style={{
                    maxWidth: '800px',
                    margin: '0 auto',
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

                {/* --- ¡SECCIÓN CORREGIDA CON FLEXBOX! --- */}
                <div style={{ marginBottom: '20px' }}>
                    <div style={{ fontWeight: 'bold', marginTop: '15px' }}>
                        Fecha: {reportData.fecha}
                    </div>

                    {/* CAMBIO: de 'inline-block' a 'flex' */}
                    <div style={{ display: 'flex', marginBottom: '8px', marginTop: '15px' }}>
                        <span style={{ fontWeight: 'bold', width: '180px', flexShrink: 0 }}>Lugar del evento:</span>
                        <span>{reportData.lugar}</span>
                    </div>

                    {/* CAMBIO: de 'inline-block' a 'flex' */}
                    <div style={{ display: 'flex', marginBottom: '8px' }}>
                        <span style={{ fontWeight: 'bold', width: '180px', flexShrink: 0 }}>Oficiales en servicio:</span>
                        <span>{reportData.oficiales}</span>
                    </div>

                    {/* CAMBIO: de 'inline-block' a 'flex' */}
                    <div style={{ display: 'flex', marginBottom: '8px' }}>
                        <span style={{ fontWeight: 'bold', width: '180px', flexShrink: 0 }}>Tipo de incidente:</span>
                        <span>{reportData.tipoIncidente}</span>
                    </div>

                    {/* CAMBIO: de 'inline-block' a 'flex' */}
                    <div style={{ display: 'flex', marginBottom: '8px' }}>
                        <span style={{ fontWeight: 'bold', width: '180px', flexShrink: 0 }}>Datos del o los afectado:</span>
                        <span>{reportData.afectado}</span>
                    </div>

                    {/* CAMBIO: de 'inline-block' a 'flex' */}
                    <div style={{ display: 'flex', marginBottom: '8px' }}>
                        <span style={{ fontWeight: 'bold', width: '180px', flexShrink: 0 }}>Número de Cámara:</span>
                        <span>{reportData.numeroCamara || 'N/A'}</span>
                    </div>

                    {/* CAMBIO: de 'inline-block' a 'flex' */}
                    <div style={{ display: 'flex', marginBottom: '8px' }}>
                        <span style={{ fontWeight: 'bold', width: '180px', flexShrink: 0 }}>Contacto Seleccionado:</span>
                        <span>{reportData.contactoSeleccionadoDisplay || 'N/A'}</span>
                    </div>
                </div>
                {/* --- FIN DE LA SECCIÓN CORREGIDA --- */}


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