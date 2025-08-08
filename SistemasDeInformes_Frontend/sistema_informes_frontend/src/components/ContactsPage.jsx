// src/components/ContactsPage.jsx

import React, { useState, useEffect, useCallback } from 'react';
import contactService from '../services/contactService';
import { Container, Row, Col, Form, Button, Table, Alert, Spinner, InputGroup } from 'react-bootstrap';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faAddressBook, faPlusCircle, faSave, faTimes, faSearch, faList, faEdit, faTrash, faFilter, faArrowLeft } from '@fortawesome/free-solid-svg-icons';
import { useNavigate } from 'react-router-dom';

function ContactsPage() {
  const navigate = useNavigate();
  const [contacts, setContacts] = useState([]);
  const [filteredContacts, setFilteredContacts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState('todos');
  const [editingId, setEditingId] = useState(null);
  const [formData, setFormData] = useState({
    nombre: '',
    telefono: '',
    correoElectronico: '',
    estado: 1
  });

  const fetchContacts = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const params = { estado: statusFilter };
      const response = await contactService.getAllContacts(params);
      const data = response.data.results || response.data;
      setContacts(data);
    } catch (err) {
      setError('No se pudieron cargar los contactos.');
    } finally {
      setLoading(false);
    }
  }, [statusFilter]);

  useEffect(() => {
    fetchContacts();
  }, [fetchContacts]);

  useEffect(() => {
    let results = [...contacts];
    if (searchQuery) {
      const lowercasedQuery = searchQuery.toLowerCase();
      results = results.filter(contact =>
        contact.Nombre?.toLowerCase().includes(lowercasedQuery) ||
        contact.CorreoElectronico?.toLowerCase().includes(lowercasedQuery) ||
        contact.Telefono?.includes(lowercasedQuery)
      );
    }
    setFilteredContacts(results);
  }, [searchQuery, contacts]);

  const handleInputChange = (e) => {
    const { id, value, type, checked } = e.target;
    if (type === 'checkbox' || type === 'switch') {
      setFormData(prevData => ({ ...prevData, [id]: checked ? 1 : 0 }));
    } else {
      setFormData(prevData => ({ ...prevData, [id]: value }));
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError(null);
    const phoneRegex = /^\d{8}$/;
    if (!phoneRegex.test(formData.telefono)) {
      setError('El teléfono debe contener exactamente 8 dígitos numéricos.'); return;
    }
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(formData.correoElectronico)) {
      setError('Por favor, introduce un formato de correo electrónico válido.'); return;
    }
    const dataToSend = {
      nombre: formData.nombre,
      telefono: `506${formData.telefono}`,
      correoElectronico: formData.correoElectronico,
    };
    if (editingId) {
      dataToSend.estado = Number(formData.estado);
    }
    try {
      if (editingId) {
        await contactService.updateContact(editingId, dataToSend);
      } else {
        await contactService.createContact(dataToSend);
      }
      await fetchContacts();
      handleCancelEdit();
    } catch (err) {
      const serverResponse = err.response?.data;
      console.error("Error en handleSubmit:", serverResponse || err.message);
      const detailMessage = serverResponse?.detalle_del_servicio?.Message || serverResponse?.error;
      if (detailMessage) {
        setError(`Error del servidor: ${detailMessage}`);
      } else if (serverResponse) {
        setError(`Error: ${JSON.stringify(serverResponse)}`);
      } else {
        setError('Ocurrió un error de red. Inténtalo de nuevo.');
      }
    }
  };

  const handleEditClick = (contact) => {
    const contactId = contact.IdContacto;
    if (!contactId) { setError("Error: El contacto seleccionado no tiene un ID válido."); return; }
    setEditingId(contactId);
    const displayPhone = contact.Telefono.startsWith('506') ? contact.Telefono.substring(3) : contact.Telefono;
    setFormData({ nombre: contact.Nombre, telefono: displayPhone, correoElectronico: contact.CorreoElectronico, estado: contact.Estado ?? 1 });
    window.scrollTo(0, 0);
  };

  const handleCancelEdit = () => {
    setEditingId(null);
    setFormData({ nombre: '', telefono: '', correoElectronico: '', estado: 1 });
  };

  const handleDeleteClick = async (contact) => {
    const contactId = contact.IdContacto;
    if (window.confirm(`¿Estás seguro de que deseas eliminar a ${contact.Nombre}?`)) {
      try {
        await contactService.deleteContact(contactId);
        await fetchContacts();
      } catch (err) {
        setError('Error al eliminar el contacto.');
      }
    }
  };

  const getStatusText = (status) => {
    switch (Number(status)) {
      case 0: return 'Inactivo';
      case 1: return 'Activo';
      case 2: return 'Gerencial';
      default: return 'Desconocido';
    }
  };
  const getStatusBadgeClass = (status) => {
    switch (Number(status)) {
      case 0: return 'bg-danger';
      case 1: return 'bg-success';
      case 2: return 'bg-info';
      default: return 'bg-secondary';
    }
  }

  return (
    <Container className="mt-4">
      <Button variant="secondary" onClick={() => navigate('/')} className="mb-3">
        <FontAwesomeIcon icon={faArrowLeft} className="me-2" />
        Volver al Formulario
      </Button>

      <h1 className="text-center mb-4"><FontAwesomeIcon icon={faAddressBook} /> Gestión de Contactos</h1>

      <div className="p-3 mb-4" style={{ backgroundColor: '#f8f9fa', borderRadius: '5px' }}>
        <h3 id="form-title">
          <FontAwesomeIcon icon={editingId ? faEdit : faPlusCircle} /> {editingId ? 'Editar Contacto' : 'Agregar Nuevo Contacto'}
        </h3>
        <Form onSubmit={handleSubmit}>
          <Row className="mb-3">
            <Col xs={12} md={6} lg={4} className="mb-3 mb-lg-0">
              <Form.Group><Form.Label htmlFor="nombre">Nombre</Form.Label><Form.Control type="text" id="nombre" value={formData.nombre} onChange={handleInputChange} required /></Form.Group>
            </Col>
            <Col xs={12} md={6} lg={4} className="mb-3 mb-lg-0">
              <Form.Group><Form.Label htmlFor="telefono">Teléfono (8 dígitos)</Form.Label><Form.Control type="tel" id="telefono" value={formData.telefono} onChange={handleInputChange} required placeholder="Ej: 88887777" maxLength={8} /></Form.Group>
            </Col>
            <Col xs={12} md={12} lg={4} className="mt-3 mt-lg-0">
              <Form.Group><Form.Label htmlFor="correoElectronico">Correo Electrónico</Form.Label><Form.Control type="email" id="correoElectronico" value={formData.correoElectronico} onChange={handleInputChange} required placeholder="ejemplo@email.com" /></Form.Group>
            </Col>
          </Row>
          {editingId && (
            <Row className="mb-3">
              <Col xs={12} md={6} lg={4}>
                <Form.Group>
                  <Form.Label htmlFor="estado">Estado</Form.Label>
                  <Form.Select id="estado" value={formData.estado} onChange={handleInputChange}>
                    <option value="1">Activo</option>
                    <option value="0">Inactivo</option>
                    <option value="2">Gerencial</option>
                  </Form.Select>
                </Form.Group>
              </Col>
            </Row>
          )}
          <div className="d-grid gap-2 d-md-flex justify-content-md-end">
            {editingId && (<Button variant="secondary" type="button" className="me-md-2" onClick={handleCancelEdit}><FontAwesomeIcon icon={faTimes} /> Cancelar</Button>)}
            <Button variant="primary" type="submit"><FontAwesomeIcon icon={faSave} /> {editingId ? 'Actualizar' : 'Guardar'}</Button>
          </div>
        </Form>
      </div>

      <Row className="mb-3 align-items-center">
        <Col md={6}><InputGroup><Form.Control type="text" placeholder="Buscar por nombre, correo o teléfono..." value={searchQuery} onChange={(e) => setSearchQuery(e.target.value)} /><Button variant="outline-secondary"><FontAwesomeIcon icon={faSearch} /> Buscar</Button></InputGroup></Col>
        <Col md={6} lg={4} className="mt-2 mt-md-0">
          <InputGroup><InputGroup.Text><FontAwesomeIcon icon={faFilter} /></InputGroup.Text>
            <Form.Select value={statusFilter} onChange={(e) => setStatusFilter(e.target.value)}>
              <option value="todos">Todos los estados</option>
              <option value="activos">Solo Activos</option>
              <option value="inactivos">Solo Inactivos</option>
              <option value="gerenciales">Solo Gerencial</option>
            </Form.Select>
          </InputGroup>
        </Col>
      </Row>

      <div className="mt-4">
        <h3><FontAwesomeIcon icon={faList} /> Lista de Contactos</h3>
        {error && <Alert variant="danger">{error}</Alert>}
        {loading ? (<div className="text-center"><Spinner animation="border" /></div>) : (
          <Table striped bordered hover responsive="sm">
            <thead className="table-dark">
              <tr><th>ID</th><th>Nombre</th><th>Teléfono</th><th>Correo</th><th>Estado</th><th>Acciones</th></tr>
            </thead>
            <tbody>
              {filteredContacts.map((contact, index) => {
                const contactId = contact.IdContacto;
                return (
                  <tr key={contactId || `contact-row-${index}`}>
                    <td>{contactId}</td>
                    <td>{contact.Nombre}</td>
                    <td>{contact.Telefono}</td>
                    <td>{contact.CorreoElectronico}</td>
                    <td><span className={`badge ${getStatusBadgeClass(contact.Estado)}`}>{getStatusText(contact.Estado)}</span></td>
                    <td>
                      <Button variant="warning" size="sm" className="me-2" onClick={() => handleEditClick(contact)}><FontAwesomeIcon icon={faEdit} /></Button>
                      <Button variant="danger" size="sm" onClick={() => handleDeleteClick(contact)}><FontAwesomeIcon icon={faTrash} /></Button>
                    </td>
                  </tr>
                )
              })}
            </tbody>
          </Table>
        )}
        {!loading && filteredContacts.length === 0 && <Alert variant="info">No se encontraron contactos para los filtros seleccionados.</Alert>}
      </div>
    </Container>
  );
}

export default ContactsPage;
