// src/components/ForceChangePassword.jsx
// Página para forzar al usuario a cambiar su contraseña temporal

import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Container, Form, Button, Card, Alert, Spinner } from 'react-bootstrap';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faShieldAlt } from '@fortawesome/free-solid-svg-icons';
import authService from '../services/authService'; // Ajusta la ruta si es necesario

function ForceChangePassword() {
    const [oldPassword, setOldPassword] = useState('');
    const [newPassword, setNewPassword] = useState('');
    const [confirmPassword, setConfirmPassword] = useState('');
    const [error, setError] = useState('');
    const [success, setSuccess] = useState('');
    const [loading, setLoading] = useState(false);
    const navigate = useNavigate();

    const handleSubmit = async (e) => {
        e.preventDefault();
        setError('');
        setSuccess('');

        if (newPassword !== confirmPassword) {
            setError('Las nuevas contraseñas no coinciden.');
            return;
        }

        // Validación simple de contraseña
        if (newPassword.length < 8) {
            setError('La nueva contraseña debe tener al menos 8 caracteres.');
            return;
        }

        setLoading(true);
        try {
            await authService.changePassword(oldPassword, newPassword);
            setSuccess('¡Contraseña actualizada con éxito! Saliendo...');

            // Deslogueamos al usuario y lo mandamos al login para que inicie sesión con su nueva contraseña
            authService.logout();
            setTimeout(() => {
                navigate('/login');
            }, 2000);

        } catch (err) {
            // El backend nos devuelve errores específicos (ej. "La contraseña antigua es incorrecta.")
            const errorMsg = err.response?.data?.old_password?.[0] || err.response?.data?.new_password?.[0] || 'Error al cambiar la contraseña.';
            setError(errorMsg);
            console.error("Error al cambiar contraseña:", err.response?.data);
        } finally {
            setLoading(false);
        }
    };

    return (
        <Container className="d-flex align-items-center justify-content-center" style={{ minHeight: '100vh', backgroundColor: '#f8f9fa' }}>
            <Card className="p-4 p-md-5 shadow-sm" style={{ width: '100%', maxWidth: '500px' }}>
                <Card.Body>
                    <Card.Title as="h1" className="text-center mb-4">
                        <FontAwesomeIcon icon={faShieldAlt} className="me-2" />
                        Cambiar Contraseña
                    </Card.Title>
                    <Alert variant="warning">
                        Por motivos de seguridad, debe cambiar la contraseña temporal que recibió.
                    </Alert>

                    <Form onSubmit={handleSubmit}>
                        {error && <Alert variant="danger">{error}</Alert>}
                        {success && <Alert variant="success">{success}</Alert>}

                        <Form.Group className="mb-3" controlId="oldPassword">
                            <Form.Label>Contraseña Antigua (Temporal)</Form.Label>
                            <Form.Control
                                type="password"
                                placeholder="Contraseña recibida por WhatsApp"
                                value={oldPassword}
                                onChange={(e) => setOldPassword(e.target.value)}
                                required
                            />
                        </Form.Group>

                        <Form.Group className="mb-3" controlId="newPassword">
                            <Form.Label>Contraseña Nueva</Form.Label>
                            <Form.Control
                                type="password"
                                placeholder="Ingrese su nueva contraseña"
                                value={newPassword}
                                onChange={(e) => setNewPassword(e.target.value)}
                                required
                            />
                        </Form.Group>

                        <Form.Group className="mb-4" controlId="confirmPassword">
                            <Form.Label>Confirmar Contraseña Nueva</Form.Label>
                            <Form.Control
                                type="password"
                                placeholder="Confirme su nueva contraseña"
                                value={confirmPassword}
                                onChange={(e) => setConfirmPassword(e.target.value)}
                                required
                            />
                        </Form.Group>

                        <div className="d-grid">
                            <Button variant="primary" type="submit" disabled={loading}>
                                {loading ? <Spinner as="span" animation="border" size="sm" /> : 'Actualizar Contraseña'}
                            </Button>
                        </div>
                    </Form>
                </Card.Body>
            </Card>
        </Container>
    );
}

export default ForceChangePassword;