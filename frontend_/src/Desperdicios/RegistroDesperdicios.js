import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { Link } from 'react-router-dom';

export default function RegistroDesperdicios() {
  const [productos, setProductos] = useState([]);
  const [ingredientes, setIngredientes] = useState([]);
  const [cantidades, setCantidades] = useState({});
  const [motivo, setMotivo] = useState('');
  const [activeTab, setActiveTab] = useState('productos');
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedItems, setSelectedItems] = useState([]);
  const [showHelp, setShowHelp] = useState(false);

  useEffect(() => {
    cargarDatosIniciales();
  }, []);

  const cargarDatosIniciales = async () => {
    const [prodRes, ingRes] = await Promise.all([
      axios.get('http://localhost:9090/api/productos'),
      axios.get('http://localhost:9090/api/ingredientes')
    ]);
    setProductos(prodRes.data);
    setIngredientes(ingRes.data);
  };

  const handleCantidadChange = (id, type, cantidad) => {
    setCantidades(prev => ({ ...prev, [`${type}-${id}`]: cantidad }));

    // Agregar o actualizar en la lista seleccionada
    if (cantidad > 0) {
      const item = type === 'producto'
        ? productos.find(p => p.id === id)
        : ingredientes.find(i => i.id === id);

      if (item && !selectedItems.some(i => i.id === id && i.type === type)) {
        setSelectedItems(prev => [...prev, { ...item, type }]);
      }
    } else {
      setSelectedItems(prev => prev.filter(item => !(item.id === id && item.type === type)));
    }
  };

  const handleSubmit = async () => {
    if (!motivo.trim()) {
      alert('Por favor ingresa un motivo para el desperdicio');
      return;
    }

    if (selectedItems.length === 0) {
      alert('Debe ingresar al menos un desperdicio');
      return;
    }

    try {
      const desperdicios = selectedItems.map(item => {
        const cantidad = cantidades[`${item.type}-${item.id}`] || 0;

        if (item.type === 'producto') {
          return {
            productoId: item.id,
            cantidadProducto: parseFloat(cantidad),
            motivo: motivo
          };
        } else {
          return {
            ingredienteId: item.id,
            cantidadIngrediente: parseFloat(cantidad),
            motivo: motivo
          };
        }
      });

      const response = await axios.post('http://localhost:9090/api/desperdicios', desperdicios);
      alert('Desperdicios registrados correctamente!');
      resetEstado();
    } catch (error) {
      alert('Error al registrar: ' + (error.response?.data?.error || error.message));
    }
  };

  const resetEstado = () => {
    setCantidades({});
    setMotivo('');
    setSelectedItems([]);
  };

  const filteredItems = activeTab === 'productos'
    ? productos.filter(p => p.nombre.toLowerCase().includes(searchTerm.toLowerCase()))
    : ingredientes.filter(i => i.nombre.toLowerCase().includes(searchTerm.toLowerCase()));

  return (
    <div className="container-fluid p-0">
      <div className="d-flex justify-content-between align-items-center p-3 bg-light border-bottom">
        <h2 className="mb-0 text-primary">
          <i className="bi bi-trash3 me-2"></i>
          Registro de Desperdicios
        </h2>
        <div>
          <button
            className="btn btn-outline-info me-2"
            onClick={() => setShowHelp(!showHelp)}
          >
            <i className="bi bi-question-circle me-1"></i> Ayuda
          </button>
          <Link to="/historialDesperdicios" className="btn btn-info">
            <i className="bi bi-clock-history me-1"></i> Ver Historial
          </Link>
        </div>
      </div>

      {showHelp && (
        <div className="alert alert-info mb-0 rounded-0">
          <div className="container">
            <h5><i className="bi bi-info-circle me-2"></i> ¿Cómo registrar desperdicios?</h5>
            <ul className="mb-0">
              <li>Busca productos o ingredientes usando la barra de búsqueda</li>
              <li>Haz clic en un elemento para agregarlo a la lista</li>
              <li>Ajusta las cantidades directamente en la lista</li>
              <li>Agrega un motivo y presiona "Registrar"</li>
            </ul>
          </div>
        </div>
      )}

      <div className="container-fluid py-4">
        <div className="row">
          {/* Panel lateral para seleccionar productos/ingredientes */}
          <div className="col-lg-4 mb-4">
            <div className="card shadow-sm h-100">
              <div className="card-header bg-white">
                <ul className="nav nav-tabs card-header-tabs">
                  <li className="nav-item">
                    <button
                      className={`nav-link ${activeTab === 'productos' ? 'active' : ''}`}
                      onClick={() => setActiveTab('productos')}
                    >
                      Productos
                    </button>
                  </li>
                  <li className="nav-item">
                    <button
                      className={`nav-link ${activeTab === 'ingredientes' ? 'active' : ''}`}
                      onClick={() => setActiveTab('ingredientes')}
                    >
                      Ingredientes
                    </button>
                  </li>
                </ul>
              </div>

              <div className="card-body">
                <div className="input-group mb-3">
                  <span className="input-group-text">
                    <i className="bi bi-search"></i>
                  </span>
                  <input
                    type="text"
                    className="form-control"
                    placeholder={`Buscar ${activeTab === 'productos' ? 'productos' : 'ingredientes'}...`}
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                  />
                </div>

                <div className="overflow-auto" style={{ maxHeight: '60vh' }}>
                  {filteredItems.length === 0 ? (
                    <div className="text-center py-5">
                      <i className="bi bi-search" style={{ fontSize: '3rem', opacity: 0.5 }}></i>
                      <p className="mt-3">No se encontraron {activeTab === 'productos' ? 'productos' : 'ingredientes'}</p>
                    </div>
                  ) : (
                    <div className="list-group">
                      {filteredItems.map(item => (
                        <button
                          key={item.id}
                          className={`list-group-item list-group-item-action d-flex justify-content-between align-items-center ${selectedItems.some(i => i.id === item.id && i.type === activeTab.slice(0, -1))
                              ? 'active' : ''
                            }`}
                          onClick={() => {
                            const currentCant = cantidades[`${activeTab.slice(0, -1)}-${item.id}`] || 0;
                            handleCantidadChange(
                              item.id,
                              activeTab.slice(0, -1),
                              currentCant > 0 ? currentCant : 1
                            );
                          }}
                        >
                          <span>{item.nombre}</span>
                          {activeTab === 'ingredientes' && item.unidadMedida && (
                            <span className="badge bg-secondary ms-2">
                              {item.unidadMedida.simbolo}
                            </span>
                          )}
                        </button>
                      ))}
                    </div>
                  )}
                </div>
              </div>
            </div>
          </div>

          {/* Panel principal con elementos seleccionados y formulario */}
          <div className="col-lg-8">
            <div className="card shadow-sm h-100">
              <div className="card-header bg-white d-flex justify-content-between align-items-center">
                <h5 className="mb-0">Elementos a desperdiciar</h5>
                <span className="badge bg-primary">
                  {selectedItems.length} {selectedItems.length === 1 ? 'elemento' : 'elementos'}
                </span>
              </div>

              <div className="card-body">
                {selectedItems.length === 0 ? (
                  <div className="text-center py-5 text-muted">
                    <i className="bi bi-inbox" style={{ fontSize: '3rem' }}></i>
                    <p className="mt-3">No hay elementos seleccionados</p>
                    <p>Selecciona productos o ingredientes del panel izquierdo</p>
                  </div>
                ) : (
                  <div className="overflow-auto mb-4" style={{ maxHeight: '50vh' }}>
                    <div className="list-group">
                      {selectedItems.map((item, index) => (
                        <div
                          key={`${item.type}-${item.id}`}
                          className="list-group-item"
                        >
                          <div className="d-flex justify-content-between align-items-center">
                            <div>
                              <h6 className="mb-0">{item.nombre}</h6>
                              {item.type === 'ingrediente' && item.unidadMedida && (
                                <small className="text-muted">
                                  Unidad: {item.unidadMedida.nombre} ({item.unidadMedida.simbolo})
                                </small>
                              )}
                            </div>

                            <div className="d-flex align-items-center">
                              <div className="input-group" style={{ width: '150px' }}>
                                <button
                                  className="btn btn-outline-secondary"
                                  onClick={() => handleCantidadChange(
                                    item.id,
                                    item.type,
                                    Math.max(0, (cantidades[`${item.type}-${item.id}`] || 0) - 1)
                                  )}
                                >
                                  <i className="bi bi-dash"></i>
                                </button>
                                <input
                                  type="number"
                                  min="0"
                                  step="0.01"
                                  className="form-control text-center"
                                  value={cantidades[`${item.type}-${item.id}`] || 0}
                                  onChange={(e) => handleCantidadChange(
                                    item.id,
                                    item.type,
                                    e.target.value
                                  )}
                                />
                                <button
                                  className="btn btn-outline-secondary"
                                  onClick={() => handleCantidadChange(
                                    item.id,
                                    item.type,
                                    (parseFloat(cantidades[`${item.type}-${item.id}`]) || 0) + 1
                                  )}
                                >
                                  <i className="bi bi-plus"></i>
                                </button>
                              </div>
                              <button
                                className="btn btn-link text-danger ms-2"
                                onClick={() => {
                                  handleCantidadChange(item.id, item.type, 0);
                                  setSelectedItems(prev => prev.filter(i => !(i.id === item.id && i.type === item.type)));
                                }}
                              >
                                <i className="bi bi-trash"></i>
                              </button>
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                <div className="border-top pt-3">
                  <label htmlFor="motivo" className="form-label">
                    <i className="bi bi-chat-text me-2"></i> Motivo del desperdicio
                  </label>
                  <textarea
                    id="motivo"
                    className="form-control mb-3"
                    value={motivo}
                    onChange={(e) => setMotivo(e.target.value)}
                    rows="3"
                    placeholder="Describe la razón del desperdicio..."
                    required
                  />

                  <div className="d-flex justify-content-end">
                    <button
                      className="btn btn-outline-secondary me-2"
                      onClick={resetEstado}
                      disabled={selectedItems.length === 0}
                    >
                      <i className="bi bi-x-circle me-1"></i> Limpiar
                    </button>
                    <button
                      onClick={handleSubmit}
                      className="btn btn-success"
                      disabled={selectedItems.length === 0 || !motivo.trim()}
                    >
                      <i className="bi bi-check-circle me-1"></i> Registrar Desperdicios
                    </button>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}