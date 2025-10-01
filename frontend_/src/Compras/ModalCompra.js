// ModalCompra.js - Versión Corregida Completa
import React, { useState } from 'react';
import { Modal, Button, Form, FloatingLabel, Row, Col } from 'react-bootstrap';
import { CurrencyDollar, CartCheck, XCircle, Save, Search } from 'react-bootstrap-icons';
import './ModalCompra.css';
import api from '../api';

const ModalCompra = ({ show, handleClose, tipos, ingredientes, onSave }) => {
  const urlBase = '/api/compras';
  const [formData, setFormData] = useState({
    tipo: 'INGREDIENTE',
    ingredienteId: '',
    descripcion: '',
    cantidad: '',
    costoTotal: '',
  });
  const [ingredientesFiltrados, setIngredientesFiltrados] = useState([]);
  const [searchText, setSearchText] = useState('');
  const [validated, setValidated] = useState(false);

  // Filtrar ingredientes basado en texto de búsqueda
  const filtrarIngredientes = (search) => {
    setSearchText(search);
    if (!search) {
      setIngredientesFiltrados(ingredientes);
      return;
    }

    const filtrados = ingredientes.filter(ing =>
      ing.nombre.toLowerCase().includes(search.toLowerCase())
    );
    setIngredientesFiltrados(filtrados);
  };

  // Seleccionar ingrediente del dropdown
  const seleccionarIngrediente = (ingredienteId) => {
    setFormData({
      ...formData,
      ingredienteId: ingredienteId
    });
    setSearchText(ingredientes.find(i => i.id === ingredienteId)?.nombre || '');
  };

  const handleChange = (e) => {
    const { name, value } = e.target;
    
    // Si cambia el tipo, resetear campos específicos
    if (name === 'tipo') {
      setFormData({
        ...formData,
        tipo: value,
        ingredienteId: '',
        descripcion: '',
        cantidad: '',
      });
      setSearchText('');
    } else {
      setFormData(prev => ({
        ...prev,
        [name]: value
      }));
    }
  };

  const resetForm = () => {
    setFormData({
      tipo: 'INGREDIENTE',
      ingredienteId: '',
      descripcion: '',
      cantidad: '',
      costoTotal: '',
    });
    setSearchText('');
    setValidated(false);
  };

  const handleCloseModal = () => {
    resetForm();
    handleClose();
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    const form = e.currentTarget;

    if (!form.checkValidity()) {
      e.stopPropagation();
      setValidated(true);
      return;
    }

    // Construcción del payload según el tipo
    let payload;
    
    if (formData.tipo === 'INGREDIENTE') {
      // Para tipo INGREDIENTE: puede tener ingrediente + cantidad o solo descripción
      if (formData.ingredienteId) {
        payload = {
          tipo: formData.tipo,
          ingrediente: { id: Number(formData.ingredienteId) },
          cantidad: Number(formData.cantidad),
          costoTotal: Number(formData.costoTotal)
        };
      } else {
        payload = {
          tipo: formData.tipo,
          descripcion: formData.descripcion,
          costoTotal: Number(formData.costoTotal)
        };
      }
    } else {
      // Para otros tipos: SOLO tipo, descripción y costoTotal
      payload = {
        tipo: formData.tipo,
        descripcion: formData.descripcion,
        costoTotal: Number(formData.costoTotal)
      };
    }

    console.log('📦 Enviando payload:', payload);

    try {
      const response = await api.post(urlBase, payload);
      console.log('✅ Compra guardada:', response.data);
      onSave();
      handleCloseModal();
    } catch (error) {
      console.error('❌ Error al guardar compra:', error);
      console.error('Response data:', error.response?.data);
      alert('Error al guardar la compra. Verifica los datos.');
    }
  };

  return (
    <Modal
      show={show}
      onHide={handleCloseModal}
      size="lg"
      centered
      backdrop="static"
      className="custom-modal"
    >
      <Modal.Header className="modal-header-custom">
        <div className="d-flex align-items-center">
          <CartCheck className="modal-icon" />
          <Modal.Title className="ms-2">Registro de Compra</Modal.Title>
        </div>
        <XCircle className="close-icon" onClick={handleCloseModal} />
      </Modal.Header>

      <Form noValidate validated={validated} onSubmit={handleSubmit}>
        <Modal.Body className="modal-body-custom">
          <Row className="g-3">
            <Col md={6}>
              <FloatingLabel controlId="tipo" label="Tipo de compra *">
                <Form.Select
                  name="tipo"
                  value={formData.tipo}
                  onChange={handleChange}
                  required
                  className="form-select-custom"
                >
                  {tipos.map((tipo) => (
                    <option key={tipo} value={tipo}>{tipo}</option>
                  ))}
                </Form.Select>
              </FloatingLabel>
            </Col>

            {formData.tipo === 'INGREDIENTE' ? (
              <>
                <Col md={12}>
                  <Form.Group controlId="ingredienteSearch" className="mb-3">
                    <Form.Label>Buscar ingrediente (opcional)</Form.Label>
                    <div className="position-relative">
                      <Form.Control
                        type="text"
                        placeholder="Escribe para buscar... (dejar vacío si no aplica)"
                        value={searchText}
                        onChange={(e) => filtrarIngredientes(e.target.value)}
                        className="form-input-custom ps-4"
                      />
                      <Search className="position-absolute top-50 start-0 translate-middle-y ms-2" />
                    </div>

                    {searchText && (
                      <div className="mt-2" style={{ maxHeight: '200px', overflowY: 'auto' }}>
                        {ingredientesFiltrados.map(ing => (
                          <div
                            key={ing.id}
                            className={`p-2 mb-1 rounded ${formData.ingredienteId === ing.id ? 'bg-primary text-white' : 'bg-light'}`}
                            onClick={() => seleccionarIngrediente(ing.id)}
                            style={{ cursor: 'pointer' }}
                          >
                            {ing.nombre}
                            <span className="ms-2 text-muted">
                              ({ing.unidadMedida?.simbolo || 'sin unidad'})
                            </span>
                          </div>
                        ))}
                      </div>
                    )}

                    {formData.ingredienteId && (
                      <div className="mt-2 alert alert-info">
                        <strong>✓ Seleccionado:</strong>
                        <span className="ms-2">
                          {ingredientes.find(i => i.id === formData.ingredienteId)?.nombre || ''}
                        </span>
                        <Button 
                          size="sm" 
                          variant="link" 
                          className="ms-2 text-danger"
                          onClick={() => {
                            setFormData({...formData, ingredienteId: '', cantidad: ''});
                            setSearchText('');
                          }}
                        >
                          Quitar
                        </Button>
                      </div>
                    )}
                  </Form.Group>
                </Col>

                {formData.ingredienteId ? (
                  <Col md={6}>
                    <FloatingLabel controlId="cantidad" label="Cantidad *">
                      <Form.Control
                        type="number"
                        step="0.1"
                        min="0.1"
                        name="cantidad"
                        value={formData.cantidad}
                        onChange={handleChange}
                        required
                        className="form-input-custom"
                      />
                    </FloatingLabel>
                  </Col>
                ) : (
                  <Col md={12}>
                    <FloatingLabel controlId="descripcion" label="Descripción *">
                      <Form.Control
                        as="textarea"
                        name="descripcion"
                        value={formData.descripcion}
                        onChange={handleChange}
                        required
                        placeholder="Ej: Compra de ingredientes varios sin inventario específico..."
                        className="form-input-custom"
                        style={{ height: '100px' }}
                      />
                    </FloatingLabel>
                  </Col>
                )}
              </>
            ) : (
              <Col md={12}>
                <FloatingLabel controlId="descripcion" label="Descripción *">
                  <Form.Control
                    as="textarea"
                    name="descripcion"
                    value={formData.descripcion}
                    onChange={handleChange}
                    required
                    placeholder="Ej: Materiales de limpieza, utensilios..."
                    className="form-input-custom"
                    style={{ height: '100px' }}
                  />
                </FloatingLabel>
              </Col>
            )}

            <Col md={formData.ingredienteId ? 6 : 12}>
              <FloatingLabel controlId="costoTotal" label="Monto total *">
                <Form.Control
                  type="number"
                  min="1"
                  name="costoTotal"
                  value={formData.costoTotal}
                  onChange={handleChange}
                  required
                  className="form-input-custom"
                />
                <div className="input-icon">
                  <CurrencyDollar className="currency-icon" />
                </div>
              </FloatingLabel>
            </Col>
          </Row>
        </Modal.Body>

        <Modal.Footer className="modal-footer-custom">
          <Button
            variant="outline-secondary"
            onClick={handleCloseModal}
            className="btn-custom"
          >
            <XCircle className="me-2" /> Cancelar
          </Button>
          <Button
            variant="primary"
            type="submit"
            className="btn-custom"
          >
            <Save className="me-2" /> Guardar Compra
          </Button>
        </Modal.Footer>
      </Form>
    </Modal>
  );
};

export default ModalCompra;