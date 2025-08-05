// src/components/ArchivoPDF.jsx
// VERSIÓN CON EL DISEÑO FIEL AL MACHOTE HTML

import React, { useRef } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import jsPDF from 'jspdf';
import html2canvas from 'html2canvas';
import { Button, Container, Alert } from 'react-bootstrap';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faFilePdf, faArrowLeft } from '@fortawesome/free-solid-svg-icons';

// Asegúrate de que la ruta a tu logo sea correcta
import Logo from '../assets/Logo.png';

function ArchivoPDF() {
    const location = useLocation();
    const navigate = useNavigate();
    const reportTemplateRef = useRef(null);

    const reportData = location.state?.reportData;

    const handleGeneratePdf = () => {
        const input = reportTemplateRef.current;
        if (!input) return;

        html2canvas(input, { scale: 2, useCORS: true })
            .then((canvas) => {
                const imgData = canvas.toDataURL('image/png');
                const pdf = new jsPDF('p', 'mm', 'a4');
                const pdfWidth = pdf.internal.pageSize.getWidth();
                const canvasWidth = canvas.width;
                const canvasHeight = canvas.height;
                const ratio = canvasWidth / canvasHeight;
                const imgHeight = pdfWidth / ratio;

                pdf.addImage(imgData, 'PNG', 0, 0, pdfWidth, imgHeight);
                pdf.save(`Informe_Incidente_${reportData.fecha?.replace(/\s/g, '_') || Date.now()}.pdf`);
            });
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
                <Button variant="primary" onClick={handleGeneratePdf} className="me-2">
                    <FontAwesomeIcon icon={faFilePdf} className="me-2" />
                    Descargar PDF
                </Button>
                <Button variant="secondary" onClick={() => navigate('/')}>
                    <FontAwesomeIcon icon={faArrowLeft} className="me-2" />
                    Volver y Editar
                </Button>
            </div>

            {/* --- INICIO DE LA PLANTILLA VISUAL CORREGIDA --- */}
            <div
                ref={reportTemplateRef}
                style={{
                    maxWidth: '800px',
                    margin: '0 auto',
                    backgroundColor: 'white',
                    padding: '30px',
                    boxShadow: '0 0 10px rgba(0, 0, 0, 0.1)',
                    fontFamily: 'Arial, sans-serif',
                    textAlign: 'left', // 👈 AÑADIR ESTO

                }}
            >
                {/* Header */}
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
                    <img src={Logo} alt="Logo de la empresa" style={{ maxHeight: '80px' }} />
                    <div style={{ fontSize: '24px', fontWeight: 'bold', textAlign: 'center', flexGrow: 1 }}>
                        Informe de Incidente
                    </div>
                    <div style={{ width: '80px' }}>&nbsp;</div> {/* Espacio para alinear el título */}
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
