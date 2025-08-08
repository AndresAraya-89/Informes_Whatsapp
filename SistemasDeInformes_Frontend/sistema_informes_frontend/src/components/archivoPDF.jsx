// src/components/ArchivoPDF.jsx
// VERSIÓN FINAL CON AUTORIZACIÓN PERSONAL (OAUTH 2.0) Y LÓGICA DE REINTENTO CORREGIDA

import React, { useRef, useState, useEffect, useCallback } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import jsPDF from 'jspdf';
import html2canvas from 'html2canvas';
import { Button, Container, Alert, Spinner, InputGroup, Form } from 'react-bootstrap';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faArrowLeft, faCloudUploadAlt, faCheckCircle, faExclamationTriangle, faCopy, faKey, faSyncAlt } from '@fortawesome/free-solid-svg-icons';

import archiveService from '../services/archiveService';
import Logo from '../assets/Logo.png';

function ArchivoPDF() {
    const location = useLocation();
    const navigate = useNavigate();
    const reportTemplateRef = useRef(null);
    const reportData = location.state?.reportData;

    const [isProcessing, setIsProcessing] = useState(true);
    const [processStatus, setProcessStatus] = useState({
        status: 'processing', // 'processing', 'success', 'error', 'authorization_required', 'info'
        message: 'Generando y guardando informe en Google Drive...',
        url: ''
    });

    // --- LÓGICA DE GUARDADO REFACTORIZADA ---
    // Se extrae la lógica a una función useCallback para poder llamarla desde múltiples lugares.
    const generateAndUpload = useCallback(async () => {
        setIsProcessing(true);
        setProcessStatus({ status: 'processing', message: 'Iniciando subida a Google Drive...', url: '' });

        const input = reportTemplateRef.current;
        // Esperamos un momento para que el DOM se renderice completamente
        await new Promise(resolve => setTimeout(resolve, 500));

        if (!input || !reportData) {
            setProcessStatus({ status: 'error', message: 'Faltan datos o la plantilla no se pudo cargar.' });
            setIsProcessing(false);
            return;
        }

        try {
            const canvas = await html2canvas(input, { scale: 2, useCORS: true });
            const pdf = new jsPDF('p', 'mm', 'a4');
            const pdfWidth = pdf.internal.pageSize.getWidth();
            const ratio = canvas.width / canvas.height;
            const imgHeight = pdfWidth / ratio;
            pdf.addImage(canvas.toDataURL('image/png'), 'PNG', 0, 0, pdfWidth, imgHeight);

            const pdfBase64 = pdf.output('datauristring').split(',')[1];
            const fileName = `Informe_${reportData.lugar?.replace(/\s/g, '_')}_${Date.now()}.pdf`;

            const response = await archiveService.uploadReportToDrive(pdfBase64, fileName);

            setProcessStatus({
                status: 'success',
                message: '¡Informe guardado en Google Drive exitosamente!',
                url: response.data.drive_url
            });

        } catch (error) {
            if (error.response && error.response.status === 401) {
                setProcessStatus({
                    status: 'authorization_required',
                    message: 'Se necesita permiso para acceder a Google Drive. Por favor, autoriza la aplicación.',
                    url: ''
                });
            } else {
                console.error("Error al guardar el informe:", error);
                const errorMessage = error.response?.data?.error || error.message || "Ocurrió un error desconocido.";
                setProcessStatus({ status: 'error', message: `Fallo al guardar: ${errorMessage}`, url: '' });
            }
        } finally {
            setIsProcessing(false);
        }
    }, [reportData]); // La función depende de 'reportData' para tener la información correcta

    // Este useEffect se ejecuta una sola vez cuando el componente se monta para iniciar el proceso
    useEffect(() => {
        generateAndUpload();
    }, [generateAndUpload]); // Se ejecuta cuando la función memoizada está lista

    const copyToClipboard = (text) => {
        navigator.clipboard.writeText(text);
    };

    const redirectToAuth = () => {
        window.open('http://127.0.0.1:8000/api/authorize/', '_blank');
        setProcessStatus({
            status: 'info',
            message: 'Una vez que completes la autorización en la nueva pestaña, haz clic en Reintentar.',
            url: ''
        });
    };

    // La función de reintento ahora simplemente llama a la función principal
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
                {isProcessing && (<Alert variant="info"> <Spinner size="sm" className="me-2" /> {processStatus.message} </Alert>)}

                {processStatus.status === 'success' && (
                    <Alert variant="success">
                        <Alert.Heading><FontAwesomeIcon icon={faCheckCircle} className="me-2" /> {processStatus.message}</Alert.Heading>
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
                            Reintentar Subida
                        </Button>
                    </Alert>
                )}

                {processStatus.status === 'error' && (<Alert variant="danger"><FontAwesomeIcon icon={faExclamationTriangle} className="me-2" /> {processStatus.message}</Alert>)}

                <Button variant="secondary" onClick={() => navigate('/')}> <FontAwesomeIcon icon={faArrowLeft} className="me-2" /> Crear Otro Informe </Button>
            </div>

            {/* La plantilla del PDF se oculta visualmente para no estorbar */}
            <div style={{ position: 'absolute', left: '-9999px', top: '-9999px' }}>
                <div ref={reportTemplateRef} style={{ width: '800px', backgroundColor: 'white', padding: '30px', fontFamily: 'Arial, sans-serif' }}>
                    {/* El contenido de la plantilla del PDF va aquí... */}
                    <h1>Informe de Incidente</h1>
                    <p>Fecha: {reportData.fecha}</p>
                    <p>Lugar: {reportData.lugar}</p>
                    {/* ...etc... */}
                </div>
            </div>
        </Container>
    );
}

export default ArchivoPDF;
