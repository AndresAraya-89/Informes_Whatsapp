// src/components/GenerarReporte.jsx

import React, { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { Container, Form, Button, Card, Row, Col, Image, Spinner } from 'react-bootstrap';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faFileAlt, faPaperPlane, faAddressBook, faVideo, faUserCheck } from '@fortawesome/free-solid-svg-icons';
// --- CORRECCIÓN: Se utiliza una ruta absoluta para asegurar que el servicio se encuentre ---
import contactService from '/src/services/contactService.js';

function GenerarReporte() {
    const navigate = useNavigate();

    const [formData, setFormData] = useState({
        lugar: '',
        oficiales: '',
        tipoIncidente: '',
        afectado: '',
        narracion: '',
        numeroCamara: '',
        contactoSeleccionado: '' // Este guardará el ID del contacto
    });

    const [activeContacts, setActiveContacts] = useState([]);
    const [loadingContacts, setLoadingContacts] = useState(true);
    const [anexoUrl, setAnexoUrl] = useState(null);

    useEffect(() => {
        const loadActiveContacts = async () => {
            try {
                const response = await contactService.getAllContacts();
                const data = response.data.results || response.data;
                setActiveContacts(data);
            } catch (error) {
                console.error("Error al cargar los contactos activos:", error);
            } finally {
                setLoadingContacts(false);
            }
        };
        loadActiveContacts();
    }, []);

    const handleInputChange = (e) => {
        const { id, value } = e.target;
        setFormData(prevData => ({ ...prevData, [id]: value }));
    };

    const handleFileChange = (e) => {
        const file = e.target.files[0];
        if (file && file.type.startsWith('image/')) {
            const tempUrl = URL.createObjectURL(file);
            setAnexoUrl(tempUrl);
        } else {
            setAnexoUrl(null);
        }
    };

    const handlePaste = useCallback((e) => {
        const items = e.clipboardData.items;
        for (let i = 0; i < items.length; i++) {
            if (items[i].type.indexOf('image') !== -1) {
                const blob = items[i].getAsFile();
                const tempUrl = URL.createObjectURL(blob);
                setAnexoUrl(tempUrl);
                e.preventDefault();
            }
        }
    }, []);

    const handlePreview = () => {
        // 1. Buscamos el objeto completo del contacto seleccionado usando el ID que está en el estado.
        const selectedContactObject = activeContacts.find(c => c.IdContacto.toString() === formData.contactoSeleccionado);

        // 2. Creamos el texto amigable para mostrar en el PDF.
        const contactDisplayText = selectedContactObject
            ? `${selectedContactObject.Nombre} (${selectedContactObject.Telefono})`
            : 'No seleccionado';

        // 3. Construimos el objeto de datos para la siguiente página.
        const reportData = {
            ...formData,
            // Añadimos explícitamente el ID del contacto.
            contactoSeleccionadoId: formData.contactoSeleccionado,
            // Añadimos el texto amigable.
            contactoSeleccionadoDisplay: contactDisplayText,
            anexoUrl,
            fecha: new Date().toLocaleDateString('es-ES', {
                year: 'numeric',
                month: 'long',
                day: 'numeric'
            })
        };
        // 4. Eliminamos la propiedad original para evitar confusiones en el siguiente componente.
        delete reportData.contactoSeleccionado;

        // 5. Navegamos a la página del PDF, pasando el objeto de datos completo.
        navigate('/archivo-pdf', { state: { reportData } });
    };

    return (
        <Container className="mt-5">
            <div className="d-flex justify-content-end mb-3">
                <Button variant="outline-secondary" onClick={() => navigate('/contacts')}>
                    <FontAwesomeIcon icon={faAddressBook} className="me-2" />
                    Gestionar Contactos
                </Button>
            </div>
            <Card className="p-4 p-md-5 shadow-sm">
                <Card.Body>
                    <Card.Title as="h1" className="text-center mb-4">
                        <FontAwesomeIcon icon={faFileAlt} className="me-2" />
                        Generar Nuevo Informe de Incidente
                    </Card.Title>
                    <Form>
                        <Row>
                            <Col md={6} className="mb-3">
                                <Form.Group><Form.Label htmlFor="lugar">Lugar del evento</Form.Label><Form.Control type="text" id="lugar" value={formData.lugar} onChange={handleInputChange} required /></Form.Group>
                            </Col>
                            <Col md={6} className="mb-3">
                                <Form.Group><Form.Label htmlFor="oficiales">Oficiales en servicio</Form.Label><Form.Control type="text" id="oficiales" value={formData.oficiales} onChange={handleInputChange} required /></Form.Group>
                            </Col>
                        </Row>
                        <Row>
                            <Col md={6} className="mb-3">
                                <Form.Group><Form.Label htmlFor="tipoIncidente">Tipo de incidente</Form.Label><Form.Control type="text" id="tipoIncidente" value={formData.tipoIncidente} onChange={handleInputChange} required /></Form.Group>
                            </Col>
                            <Col md={6} className="mb-3">
                                <Form.Group><Form.Label htmlFor="afectado">Datos del o los afectado(s)</Form.Label><Form.Control type="text" id="afectado" value={formData.afectado} onChange={handleInputChange} required /></Form.Group>
                            </Col>
                        </Row>
                        <Row>
                            <Col md={6} className="mb-3">
                                <Form.Group>
                                    <Form.Label htmlFor="numeroCamara"><FontAwesomeIcon icon={faVideo} className="me-2" />Número de Cámara</Form.Label>
                                    <Form.Control type="text" id="numeroCamara" value={formData.numeroCamara} onChange={handleInputChange} />
                                </Form.Group>
                            </Col>
                            <Col md={6} className="mb-3">
                                <Form.Group>
                                    <Form.Label htmlFor="contactoSeleccionado"><FontAwesomeIcon icon={faUserCheck} className="me-2" />Seleccionar Contacto Activo</Form.Label>
                                    {loadingContacts ? <Spinner animation="border" size="sm" /> : (
                                        <Form.Select id="contactoSeleccionado" value={formData.contactoSeleccionado} onChange={handleInputChange}>
                                            <option value="">-- Seleccione un contacto --</option>
                                            {activeContacts.map(contact => (
                                                <option key={contact.IdContacto} value={contact.IdContacto}>
                                                    {contact.Nombre} ({contact.Telefono})
                                                </option>
                                            ))}
                                        </Form.Select>
                                    )}
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
                            <Form.Text>Puedes seleccionar un archivo o pegar una captura de pantalla (Ctrl+V).</Form.Text>
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
