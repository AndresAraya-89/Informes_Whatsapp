// src/components/GenerarReporte.jsx

import React, { useState, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { Container, Form, Button, Card, Row, Col, Image } from 'react-bootstrap';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faFileAlt, faPaperPlane } from '@fortawesome/free-solid-svg-icons';

function GenerarReporte() {
    const navigate = useNavigate();

    // Estado para cada campo del formulario
    const [formData, setFormData] = useState({
        lugar: '',
        oficiales: '',
        tipoIncidente: '',
        afectado: '',
        narracion: '',
    });

    // Estado para la imagen del anexo (guardaremos su URL temporal)
    const [anexoUrl, setAnexoUrl] = useState(null);

    /**
     * Maneja los cambios en los campos de texto del formulario.
     */
    const handleInputChange = (e) => {
        const { id, value } = e.target;
        setFormData(prevData => ({ ...prevData, [id]: value }));
    };

    /**
     * Maneja la selección de un archivo de imagen.
     */
    const handleFileChange = (e) => {
        const file = e.target.files[0];
        if (file && file.type.startsWith('image/')) {
            // Creamos una URL temporal para la previsualización de la imagen
            const tempUrl = URL.createObjectURL(file);
            setAnexoUrl(tempUrl);
        } else {
            setAnexoUrl(null);
        }
    };

    /**
     * Maneja el pegado de una imagen desde el portapapeles.
     */
    const handlePaste = useCallback((e) => {
        const items = e.clipboardData.items;
        for (let i = 0; i < items.length; i++) {
            if (items[i].type.indexOf('image') !== -1) {
                const blob = items[i].getAsFile();
                const tempUrl = URL.createObjectURL(blob);
                setAnexoUrl(tempUrl);
                // Prevenimos que la imagen se pegue dos veces si el foco está en un input
                e.preventDefault();
            }
        }
    }, []);

    /**
     * Navega a la página de previsualización del PDF, pasando los datos del formulario.
     */
    const handlePreview = () => {
        // Añadimos la fecha actual al momento de generar el reporte
        const reportData = {
            ...formData,
            anexoUrl,
            fecha: new Date().toLocaleDateString('es-ES', {
                year: 'numeric',
                month: 'long',
                day: 'numeric'
            })
        };

        // Usamos el 'state' de navigate para pasar el objeto de datos completo
        navigate('/archivo-pdf', { state: { reportData } });
    };

    return (
        <Container className="mt-5">
            <Card className="p-4 p-md-5 shadow-sm">
                <Card.Body>
                    <Card.Title as="h1" className="text-center mb-4">
                        <FontAwesomeIcon icon={faFileAlt} className="me-2" />
                        Generar Nuevo Informe de Incidente
                    </Card.Title>

                    <Form>
                        <Row>
                            <Col md={6} className="mb-3">
                                <Form.Group>
                                    <Form.Label htmlFor="lugar">Lugar del evento</Form.Label>
                                    <Form.Control type="text" id="lugar" value={formData.lugar} onChange={handleInputChange} required />
                                </Form.Group>
                            </Col>
                            <Col md={6} className="mb-3">
                                <Form.Group>
                                    <Form.Label htmlFor="oficiales">Oficiales en servicio</Form.Label>
                                    <Form.Control type="text" id="oficiales" value={formData.oficiales} onChange={handleInputChange} required />
                                </Form.Group>
                            </Col>
                        </Row>
                        <Row>
                            <Col md={6} className="mb-3">
                                <Form.Group>
                                    <Form.Label htmlFor="tipoIncidente">Tipo de incidente</Form.Label>
                                    <Form.Control type="text" id="tipoIncidente" value={formData.tipoIncidente} onChange={handleInputChange} required />
                                </Form.Group>
                            </Col>
                            <Col md={6} className="mb-3">
                                <Form.Group>
                                    <Form.Label htmlFor="afectado">Datos del o los afectado(s)</Form.Label>
                                    <Form.Control type="text" id="afectado" value={formData.afectado} onChange={handleInputChange} required />
                                </Form.Group>
                            </Col>
                        </Row>
                        <Form.Group className="mb-3">
                            <Form.Label htmlFor="narracion">Narración de Hecho</Form.Label>
                            <Form.Control as="textarea" rows={5} id="narracion" value={formData.narracion} onChange={handleInputChange} required />
                        </Form.Group>

                        <Form.Group className="mb-4" onPaste={handlePaste}>
                            <Form.Label>Anexo (Seleccionar o Pegar Imagen)</Form.Label>
                            <Form.Control type="file" accept="image/*" onChange={handleFileChange} />
                            <Form.Text>
                                Puedes seleccionar un archivo o simplemente hacer clic aquí y pegar una captura de pantalla (Ctrl+V).
                            </Form.Text>
                        </Form.Group>

                        {anexoUrl && (
                            <div className="mb-4 text-center">
                                <p><strong>Previsualización del Anexo:</strong></p>
                                <Image src={anexoUrl} thumbnail fluid style={{ maxHeight: '300px' }} />
                            </div>
                        )}

                        <div className="d-grid">
                            <Button variant="primary" size="lg" onClick={handlePreview}>
                                <FontAwesomeIcon icon={faPaperPlane} className="me-2" />
                                Generar Reporte
                            </Button>
                        </div>
                    </Form>
                </Card.Body>
            </Card>
        </Container>
    );
}

export default GenerarReporte;
