// src/components/LoginPage.jsx

import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Container, Form, Button, Card, Alert, Modal, Spinner } from 'react-bootstrap';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faKey, faPaperPlane, faPhone, faEnvelope } from '@fortawesome/free-solid-svg-icons';
import authService from '../services/authService';

function LoginPage() {
    const [username, setUsername] = useState('');
    const [password, setPassword] = useState('');
    const [error, setError] = useState('');
    const [loading, setLoading] = useState(false);
    const navigate = useNavigate();

    // --- Estados para el modal de recuperación (AHORA UN OBJETO) ---
    const [showForgotModal, setShowForgotModal] = useState(false);
    const [forgotLoading, setForgotLoading] = useState(false);
    const [forgotMessage, setForgotMessage] = useState({ type: '', text: '' });
    // Estado para los 3 campos del modal
    const [forgotData, setForgotData] = useState({
        username: '',
        telefono: '',
        email: ''
    });

    /**
     * Maneja el envío del formulario de inicio de sesión.
     */
    const handleSubmit = async (e) => {
        e.preventDefault();
        setError('');
        setLoading(true);

        try {
            const { isRecoveryNeeded } = await authService.login(username, password);
            if (isRecoveryNeeded) {
                navigate('/cambiar-password');
            } else {
                navigate('/');
            }
        } catch (err) {
            setError('Usuario o contraseña incorrectos. Por favor, intente de nuevo.');
        } finally {
            setLoading(false);
        }
    };

    // --- Nuevo HANDLER para los inputs del modal ---
    const handleForgotInputChange = (e) => {
        const { id, value } = e.target;
        setForgotData(prevData => ({ ...prevData, [id]: value }));
    };

    /**
     * Maneja el envío del formulario de recuperación (desde el modal).
     */
    const handleForgotPassword = async (e) => {
        e.preventDefault();
        setForgotMessage({ type: '', text: '' });
        setForgotLoading(true);

        const { username, telefono, email } = forgotData;

        try {
            // Llama al backend con los 3 campos
            await authService.forgotPassword(username, telefono, email);

            // --- LÓGICA DE SEGURIDAD ---
            // Mostramos un mensaje genérico SIEMPRE, incluso si falla
            setForgotMessage({
                type: 'success',
                text: 'Solicitud procesada. Si sus datos son correctos, recibirá un mensaje en breve.'
            });

        } catch (err) {
            // --- LÓGICA DE SEGURIDAD ---
            // En caso de error (ej. usuario no encontrado), mostrar el mismo mensaje generico
            setForgotMessage({
                type: 'success',
                text: 'Solicitud procesada. Si sus datos son correctos, recibirá un mensaje en breve.'
            });
            // Registramos el error real solo en la consola, para depuración
            console.error("Error en recuperación (oculto al usuario):", err);
        } finally {
            setForgotLoading(false);
            // Cerramos el modal y limpiamos el formulario después de 3 segundos
            setTimeout(() => {
                setShowForgotModal(false);
                setForgotData({ username: '', telefono: '', email: '' });
                setForgotMessage({ type: '', text: '' });
            }, 3000);
        }
    };

    const closeForgotModal = () => {
        setShowForgotModal(false);
        setForgotData({ username: '', telefono: '', email: '' });
        setForgotMessage({ type: '', text: '' });
    };

    return (
        <>
            <Container className="d-flex align-items-center justify-content-center" style={{ minHeight: '100vh', backgroundColor: '#f8f9fa' }}>
                <Card className="p-4 p-md-5 shadow-sm" style={{ width: '100%', maxWidth: '450px' }}>
                    <Card.Body>
                        <Card.Title as="h1" className="text-center mb-4">
                            <FontAwesomeIcon icon={faKey} className="me-2" />
                            Inicio de Sesión
                        </Card.Title>
                        <Form onSubmit={handleSubmit}>
                            {error && <Alert variant="danger">{error}</Alert>}
                            <Form.Group className="mb-3" controlId="username">
                                <Form.Label>Nombre de Usuario</Form.Label>
                                <Form.Control
                                    type="text"
                                    placeholder="Ingrese su usuario"
                                    value={username}
                                    onChange={(e) => setUsername(e.target.value)}
                                    required
                                />
                            </Form.Group>
                            <Form.Group className="mb-3" controlId="password">
                                <Form.Label>Contraseña</Form.Label>
                                <Form.Control
                                    type="password"
                                    placeholder="Ingrese su contraseña"
                                    value={password}
                                    onChange={(e) => setPassword(e.target.value)}
                                    required
                                />
                            </Form.Group>
                            <div className="d-grid">
                                <Button variant="primary" type="submit" disabled={loading}>
                                    {loading ? <Spinner as="span" animation="border" size="sm" /> : 'Ingresar'}
                                </Button>
                            </div>
                            <div className="text-center mt-4">
                                <Button variant="link" onClick={() => setShowForgotModal(true)}>
                                    ¿Olvidó su contraseña?
                                </Button>
                            </div>
                        </Form>
                    </Card.Body>
                </Card>
            </Container>

            {/* --- MODAL PARA RECUPERAR CONTRASEÑA (Actualizado) --- */}
            <Modal show={showForgotModal} onHide={closeForgotModal} centered>
                <Modal.Header closeButton>
                    <Modal.Title>Recuperar Contraseña</Modal.Title>
                </Modal.Header>
                <Modal.Body>
                    {forgotMessage.text && (
                        <Alert variant={forgotMessage.type}>{forgotMessage.text}</Alert>
                    )}
                    <Form onSubmit={handleForgotPassword}>
                        <p>Ingrese sus datos de usuario. Si coinciden, se le enviará una contraseña temporal a su número de WhatsApp asociado.</p>

                        {/* CAMPO 1: USUARIO */}
                        <Form.Group className="mb-3" controlId="username">
                            <Form.Label>Nombre de Usuario</Form.Label>
                            <Form.Control
                                type="text"
                                placeholder="Ingrese su usuario"
                                value={forgotData.username}
                                onChange={handleForgotInputChange}
                                required
                            />
                        </Form.Group>

                        {/* CAMPO 2: TELÉFONO */}
                        <Form.Group className="mb-3" controlId="telefono">
                            <Form.Label>
                                <FontAwesomeIcon icon={faPhone} className="me-2" />
                                Teléfono (8 dígitos)
                            </Form.Label>
                            <Form.Control
                                type="tel"
                                placeholder="Ej: 88887777"
                                maxLength={8}
                                value={forgotData.telefono}
                                onChange={handleForgotInputChange}
                                required
                            />
                        </Form.Group>

                        {/* CAMPO 3: CORREO */}
                        <Form.Group className="mb-3" controlId="email">
                            <Form.Label>
                                <FontAwesomeIcon icon={faEnvelope} className="me-2" />
                                Correo Electrónico
                            </Form.Label>
                            <Form.Control
                                type="email"
                                placeholder="ejemplo@email.com"
                                value={forgotData.email}
                                onChange={handleForgotInputChange}
                                required
                            />
                        </Form.Group>

                        <div className="d-flex justify-content-end gap-2">
                            <Button variant="secondary" onClick={closeForgotModal}>
                                Cancelar
                            </Button>
                            <Button variant="primary" type="submit" disabled={forgotLoading}>
                                {forgotLoading ? <Spinner as="span" animation="border" size="sm" /> : (
                                    <>
                                        <FontAwesomeIcon icon={faPaperPlane} className="me-2" />
                                        Solicitar
                                    </>
                                )}
                            </Button>
                        </div>
                    </Form>
                </Modal.Body>
            </Modal>
        </>
    );
}

export default LoginPage;