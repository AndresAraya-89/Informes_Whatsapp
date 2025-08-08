// src/components/GenerarReporte.jsx

import React, { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { Container, Form, Button, Card, Row, Col, Image, Spinner } from 'react-bootstrap';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faFileAlt, faPaperPlane, faAddressBook, faVideo, faUserCheck } from '@fortawesome/free-solid-svg-icons';

// Importamos el servicio de contactos para poder obtener la lista
import contactService from '../services/contactService';

function GenerarReporte() {
    const navigate = useNavigate();

    // --- ESTADOS ---
    // Añadimos los nuevos campos al estado del formulario
    const [formData, setFormData] = useState({
        lugar: '',
        oficiales: '',
        tipoIncidente: '',
        afectado: '',
        narracion: '',
        numeroCamara: '', // Nuevo campo
        contactoSeleccionado: '' // Nuevo campo para el contacto
    });

    // Nuevos estados para manejar la carga de contactos
    const [activeContacts, setActiveContacts] = useState([]);
    const [loadingContacts, setLoadingContacts] = useState(true);
    const [anexoUrl, setAnexoUrl] = useState(null);

    // --- LÓGICA DE DATOS ---
    // Este useEffect se ejecuta una vez al cargar el componente para obtener los contactos
    useEffect(() => {
        const loadActiveContacts = async () => {
            try {
                // Por defecto, getAllContacts() obtiene los contactos activos
                const response = await contactService.getAllContacts();
                const data = response.data.results || response.data;
                setActiveContacts(data);
            } catch (error) {
                console.error("Error al cargar los contactos activos:", error);
                // Opcional: mostrar un error al usuario
            } finally {
                setLoadingContacts(false);
            }
        };

        loadActiveContacts();
    }, []); // El array vacío asegura que se ejecute solo una vez

    // --- MANEJADORES DE EVENTOS ---
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
        // Buscamos el objeto del contacto seleccionado para pasarlo al reporte
        const selectedContactObject = activeContacts.find(c => c.IdContacto.toString() === formData.contactoSeleccionado);
        // Creamos una cadena de texto con el nombre y el teléfono para el reporte
        const contactDetails = selectedContactObject
            ? `${selectedContactObject.Nombre} (${selectedContactObject.Telefono})`
            : 'No seleccionado';

        const reportData = {
            ...formData,
            contactoSeleccionado: contactDetails, // Pasamos los detalles completos en lugar de solo el nombre
            anexoUrl,
            fecha: new Date().toLocaleDateString('es-ES', {
                year: 'numeric',
                month: 'long',
                day: 'numeric'
            })
        };
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

                        {/* --- NUEVOS CAMPOS AÑADIDOS --- */}
                        <Row>
                            <Col md={6} className="mb-3">
                                <Form.Group>
                                    <Form.Label htmlFor="numeroCamara">
                                        <FontAwesomeIcon icon={faVideo} className="me-2" />
                                        Número de Cámara
                                    </Form.Label>
                                    <Form.Control type="text" id="numeroCamara" value={formData.numeroCamara} onChange={handleInputChange} />
                                </Form.Group>
                            </Col>
                            <Col md={6} className="mb-3">
                                <Form.Group>
                                    <Form.Label htmlFor="contactoSeleccionado">
                                        <FontAwesomeIcon icon={faUserCheck} className="me-2" />
                                        Seleccionar Contacto Activo
                                    </Form.Label>
                                    {loadingContacts ? <Spinner animation="border" size="sm" /> : (
                                        <Form.Select id="contactoSeleccionado" value={formData.contactoSeleccionado} onChange={handleInputChange}>
                                            <option value="">-- Seleccione un contacto --</option>
                                            {activeContacts.map(contact => (
                                                <option key={contact.IdContacto} value={contact.IdContacto}>
                                                    {/* --- CAMBIO AQUÍ: Se muestra el nombre y el teléfono --- */}
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
