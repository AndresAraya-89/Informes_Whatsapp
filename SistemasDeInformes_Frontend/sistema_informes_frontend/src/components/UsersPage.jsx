// src/components/UsersPage.jsx
// VERSIÓN CORREGIDA

import React, { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { Container, Row, Col, Form, Button, Table, Alert, Spinner, InputGroup, Modal } from 'react-bootstrap';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
// --- 1. CORRECCIÓN: Se añade 'faArrowLeft' a la lista de importaciones ---
import { faUsers, faPlus, faSave, faTimes, faEdit, faTrash, faSyncAlt, faArrowLeft } from '@fortawesome/free-solid-svg-icons';
// --- 2. CORRECCIÓN: Se usa una ruta relativa para el servicio ---
import userService from '../services/userService.js';

function UsersPage() {
    const navigate = useNavigate();
    const [users, setUsers] = useState([]);
    const [currentUser, setCurrentUser] = useState(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);

    // Estado para el modal de crear/editar
    const [showModal, setShowModal] = useState(false);
    const [isEditing, setIsEditing] = useState(false);
    const [formData, setFormData] = useState({
        username: '',
        first_name: '',
        last_name: '',
        email: '',
        telefono: '',
        password: '',
    });

    // Carga inicial de datos
    const loadData = useCallback(async () => {
        setLoading(true);
        setError(null);
        try {
            // Hacemos ambas llamadas en paralelo
            const [usersResponse, profileResponse] = await Promise.all([
                userService.getAllUsers(),
                userService.getSelfProfile()
            ]);
            setUsers(usersResponse.data);
            setCurrentUser(profileResponse.data);
        } catch (err) {
            setError('No se pudieron cargar los datos de usuario. ¿Ha iniciado sesión?');
            console.error(err);
        } finally {
            setLoading(false);
        }
    }, []);

    useEffect(() => {
        loadData();
    }, [loadData]);

    // --- MANEJO DEL MODAL ---
    const handleShowModal = (user = null) => {
        if (user) {
            // Editando
            setIsEditing(true);
            setFormData({
                id: user.id,
                username: user.username,
                first_name: user.first_name,
                last_name: user.last_name,
                email: user.email,
                telefono: user.telefono || '',
                password: '', // Dejar la contraseña vacía por seguridad
            });
        } else {
            // Creando
            setIsEditing(false);
            setFormData({
                username: '',
                first_name: '',
                last_name: '',
                email: '',
                telefono: '',
                password: '',
            });
        }
        setShowModal(true);
    };

    const handleCloseModal = () => {
        setShowModal(false);
        setError(null); // Limpiar errores del modal
    };

    const handleInputChange = (e) => {
        const { id, value } = e.target;
        setFormData(prev => ({ ...prev, [id]: value }));
    };

    // --- LÓGICA DEL CRUD ---

    const handleSubmit = async (e) => {
        e.preventDefault();
        setError(null);

        // Preparamos los datos a enviar
        const dataToSubmit = { ...formData };
        // Si no se escribió una nueva contraseña, la eliminamos del objeto
        if (!dataToSubmit.password) {
            delete dataToSubmit.password;
        }

        try {
            if (isEditing) {
                // Actualizar usuario
                await userService.updateUser(formData.id, dataToSubmit);
            } else {
                // Crear usuario (solo admin)
                await userService.createUser(dataToSubmit);
            }
            await loadData(); // Recargar todos los datos
            handleCloseModal();
        } catch (err) {
            setError(err.response?.data?.error || 'Error al guardar el usuario. Por favor, revise los datos e intente nuevamente.');
            console.error(err);
        }
    };

    const handleToggleStatus = async (user) => {
        if (user.id === currentUser.id) return; // No puede cambiar su propio estado

        const newStatus = !user.estadoActividad;
        try {
            await userService.updateUserStatus(user.id, newStatus);
            await loadData(); // Recargar lista
        } catch (err) {
            setError('Error al cambiar el estado del usuario.');
            console.error(err);
        }
    };

    const handleDeleteUser = async (id) => {
        if (window.confirm('¿Estás seguro de que deseas desactivar este usuario?')) {
            try {
                await userService.deleteUser(id);
                await loadData(); // Recargar lista
            } catch (err) {
                setError('Error al desactivar el usuario.');
                console.error(err);
            }
        }
    };

    // --- RENDERIZADO ---
    if (loading) {
        return <Container className="text-center mt-5"><Spinner animation="border" /></Container>;
    }

    return (
        <Container className="mt-4">
            {/* Este es el botón que causaba el error si 'faArrowLeft' no estaba importado */}
            <Button variant="secondary" onClick={() => navigate('/')} className="mb-3">
                <FontAwesomeIcon icon={faArrowLeft} className="me-2" />
                Volver
            </Button>

            <h1 className="text-center mb-4"><FontAwesomeIcon icon={faUsers} /> Gestión de Usuarios</h1>

            {error && <Alert variant="danger">{error}</Alert>}

            <div className="d-flex justify-content-end mb-3">
                {currentUser?.is_staff && (
                    <Button variant="primary" onClick={() => handleShowModal(null)}>
                        <FontAwesomeIcon icon={faPlus} className="me-2" />
                        Crear Usuario
                    </Button>
                )}
            </div>

            <Table striped bordered hover responsive="sm">
                <thead className="table-dark">
                    <tr>
                        <th>ID</th>
                        <th>Usuario</th>
                        <th>Nombre Completo</th>
                        <th>Email</th>
                        <th>Teléfono</th>
                        <th>Estado</th>
                        <th>Admin</th>
                        <th>Acciones</th>
                    </tr>
                </thead>
                <tbody>
                    {users.map(user => (
                        <tr key={user.id}>
                            <td>{user.id}</td>
                            <td>{user.username}</td>
                            <td>{user.first_name} {user.last_name}</td>
                            <td>{user.email}</td>
                            <td>{user.telefono}</td>
                            <td>
                                <Form.Check
                                    type="switch"
                                    label={user.estadoActividad ? 'Activo' : 'Inactivo'}
                                    checked={user.estadoActividad}
                                    onChange={() => handleToggleStatus(user)}
                                    // Deshabilitado si es el usuario actual (no puede desactivarse a sí mismo)
                                    disabled={user.id === currentUser?.id}
                                />
                            </td>
                            <td>{user.is_staff ? 'Sí' : 'No'}</td>
                            <td>
                                <Button
                                    variant="warning"
                                    size="sm"
                                    className="me-2"
                                    onClick={() => handleShowModal(user)}
                                    // Deshabilitado si no es admin Y no es el propio usuario
                                    disabled={!currentUser?.is_staff && user.id !== currentUser?.id}
                                >
                                    <FontAwesomeIcon icon={faEdit} />
                                </Button>
                                {currentUser?.is_staff && (
                                    <Button
                                        variant="danger"
                                        size="sm"
                                        onClick={() => handleDeleteUser(user.id)}
                                        // Deshabilitado si es el usuario actual
                                        disabled={user.id === currentUser?.id}
                                    >
                                        <FontAwesomeIcon icon={faTrash} />
                                    </Button>
                                )}
                            </td>
                        </tr>
                    ))}
                </tbody>
            </Table>

            {/* Modal para Crear/Editar Usuario */}
            <Modal show={showModal} onHide={handleCloseModal}>
                <Modal.Header closeButton>
                    <Modal.Title>
                        {isEditing ? 'Editar Usuario' : 'Crear Nuevo Usuario'}
                    </Modal.Title>
                </Modal.Header>
                <Modal.Body>
                    {error && <Alert variant="danger">{error}</Alert>}
                    <Form onSubmit={handleSubmit}>
                        <Form.Group className="mb-3">
                            <Form.Label htmlFor="username">Nombre de Usuario (Sin espacios)</Form.Label>
                            <Form.Control
                                type="text"
                                id="username"
                                value={formData.username}
                                onChange={(e) => {
                                    // Elimina los espacios mientras el usuario escribe
                                    const value = e.target.value.replace(/\s+/g, '');
                                    handleInputChange({ target: { id: 'username', value } });
                                }}
                                required
                                placeholder="Ej: NombreApellido"
                            />
                        </Form.Group>
                        <Row>
                            <Col>
                                <Form.Group className="mb-3">
                                    <Form.Label htmlFor="first_name">Nombre</Form.Label>
                                    <Form.Control type="text" id="first_name" value={formData.first_name} onChange={handleInputChange} />
                                </Form.Group>
                            </Col>
                            <Col>
                                <Form.Group className="mb-3">
                                    <Form.Label htmlFor="last_name">Apellido</Form.Label>
                                    <Form.Control type="text"
                                        id="last_name"
                                        value={formData.last_name}
                                        onChange={handleInputChange}
                                    />
                                </Form.Group>
                            </Col>
                        </Row>
                        <Form.Group className="mb-3">
                            <Form.Label htmlFor="email">Email</Form.Label>
                            <Form.Control
                                type="email"
                                id="email"
                                value={formData.email}
                                onChange={handleInputChange} required
                                placeholder="Ej: ejemplo@gmail.com"
                            />
                        </Form.Group>

                        <Form.Group className="mb-3">
                            <Form.Label htmlFor="telefono">Teléfono (8 dígitos)</Form.Label>
                            <Form.Control
                                type="tel"
                                id="telefono"
                                value={formData.telefono}
                                onChange={handleInputChange}
                                maxLength={8}
                                placeholder="Ej: 88887777"
                            />
                        </Form.Group>

                        <Form.Group className="mb-3">
                            <Form.Label htmlFor="password">Contraseña</Form.Label>
                            <Form.Control type="password" id="password" onChange={handleInputChange} placeholder={isEditing ? "Dejar en blanco para no cambiar" : ""} required={!isEditing} />
                        </Form.Group>
                        <hr />
                        <div className="d-flex justify-content-end">
                            <Button variant="secondary" onClick={handleCloseModal} className="me-2">
                                <FontAwesomeIcon icon={faTimes} className="me-2" />
                                Cancelar
                            </Button>
                            <Button variant="primary" type="submit">
                                <FontAwesomeIcon icon={faSave} className="me-2" />
                                {isEditing ? 'Actualizar' : 'Crear'}
                            </Button>
                        </div>
                    </Form>
                </Modal.Body>
            </Modal>

        </Container>
    );
}

export default UsersPage;