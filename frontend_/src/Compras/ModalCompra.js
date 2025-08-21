// ModalCompra.js
import React, { useState } from 'react';
import { Modal, Button, Form, FloatingLabel, Row, Col, AutoComplete } from 'react-bootstrap';
import { CurrencyDollar, CartCheck, XCircle, Save, Search } from 'react-bootstrap-icons';
import './ModalCompra.css';
import api from '../api';

const ModalCompra = ({ show, handleClose, tipos, ingredientes, onSave }) => {
  const urlBase = 'http://localhost:9090/api/compras';
  const [formData, setFormData] = useState({
    tipo: 'INGREDIENTE',
    ingredienteId: '',
    descripcion: '',
    cantidad: 0,
    costoTotal: 0,
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
  };

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    const form = e.currentTarget;

    if (!form.checkValidity()) {
      e.stopPropagation();
      setValidated(true);
      return;
    }

    // Construcción del payload
    const payload = {
      tipo: formData.tipo,
      costoTotal: Number(formData.costoTotal),
      ...(formData.tipo === 'INGREDIENTE' ? {
        ingrediente: { id: Number(formData.ingredienteId) },
        cantidad: Number(formData.cantidad)
      } : {
        descripcion: formData.descripcion
      })
    };

    try {
      await api.post(urlBase, payload);
      onSave();
      handleClose();
      setValidated(false);
    } catch (error) {
      console.error('Error al guardar compra:', error);
    }
  };

  return (
    <Modal
      show={show}
      onHide={handleClose}
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
        <XCircle className="close-icon" onClick={handleClose} />
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
                    <Form.Label>Buscar ingrediente *</Form.Label>
                    <div className="position-relative">
                      <Form.Control
                        type="text"
                        placeholder="Escribe para buscar..."
                        value={searchText}
                        onChange={(e) => filtrarIngredientes(e.target.value)}
                        className="form-input-custom ps-4"
                      />
                      <Search className="position-absolute top-50 start-0 translate-middle-y ms-2" />
                    </div>

                    <div className="mt-2" style={{ maxHeight: '200px', overflowY: 'auto' }}>
                      {(searchText ? ingredientesFiltrados : ingredientes).map(ing => (
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

                    {formData.ingredienteId && (
                      <div className="mt-2">
                        <strong>Seleccionado:</strong>
                        <span className="ms-2">
                          {ingredientes.find(i => i.id === formData.ingredienteId)?.nombre || ''}
                        </span>
                      </div>
                    )}
                  </Form.Group>
                </Col>

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

            <Col md={formData.tipo === 'INGREDIENTE' ? 6 : 12}>
              <FloatingLabel controlId="costoTotal" label="Monto total *">
                <Form.Control
                  type="number"
                  min="1"
                  name="costoTotal"
                  value={formData.costoTotal}
                  onChange={handleChange}
                  required
                  className="form-input-custom"
                  prefix={<CurrencyDollar />}
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
            onClick={handleClose}
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