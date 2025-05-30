import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { Link } from 'react-router-dom';

export default function RegistroDesperdicios() {
  const [productos, setProductos] = useState([]);
  const [ingredientes, setIngredientes] = useState([]);
  const [cantidadesProductos, setCantidadesProductos] = useState({});
  const [cantidadesIngredientes, setCantidadesIngredientes] = useState({});
  const [motivo, setMotivo] = useState('');

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

  const handleCantidadProducto = (id, cantidad) => {
    setCantidadesProductos(prev => ({ ...prev, [id]: cantidad }));
  };

  const handleCantidadIngrediente = (id, cantidad) => {
    setCantidadesIngredientes(prev => ({ ...prev, [id]: cantidad }));
  };

  const handleSubmit = async () => {
    try {
      const desperdicios = [];
      
      // Procesar productos
      Object.entries(cantidadesProductos).forEach(([id, cantidad]) => {
        if (cantidad > 0) {
          desperdicios.push({
            productoId: Number(id),
            cantidadProducto: cantidad,
            motivo: motivo
          });
        }
      });

      // Procesar ingredientes
      Object.entries(cantidadesIngredientes).forEach(([id, cantidad]) => {
        if (cantidad > 0) {
          desperdicios.push({
            ingredienteId: Number(id),
            cantidadIngrediente: cantidad,
            motivo: motivo
          });
        }
      });

      if (desperdicios.length === 0) {
        alert('Debe ingresar al menos un desperdicio');
        return;
      }

      const response = await axios.post('http://localhost:9090/api/desperdicios', desperdicios);
      alert('Desperdicios registrados correctamente!');
      resetEstado();
    } catch (error) {
      alert('Error al registrar: ' + (error.response?.data?.error || error.message));
    }
  };

  const resetEstado = () => {
    setCantidadesProductos({});
    setCantidadesIngredientes({});
    setMotivo('');
  };

  return (
    <div className="container mt-4">
      <div className="d-flex justify-content-between align-items-center mb-4">
        <h2>Registro de Desperdicios</h2>
        <Link to="/historialDesperdicios" className="btn btn-info">
          Ver Historial
        </Link>
      </div>

      <div className="card mb-4">
        <div className="card-body">
          <h4 className="mb-3">Productos</h4>
          <div className="row">
            {productos.map(p => (
              <div key={p.id} className="col-md-4 mb-3">
                <div className="card">
                  <div className="card-body">
                    <h5>{p.nombre}</h5>
                    <div className="input-group">
                      <input
                        type="number"
                        step="0.01"
                        className="form-control"
                        value={cantidadesProductos[p.id] || ''}
                        onChange={(e) => handleCantidadProducto(p.id, e.target.value)}
                        placeholder="Cantidad"
                      />
                      <span className="input-group-text">unidades</span>
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      <div className="card mb-4">
        <div className="card-body">
          <h4 className="mb-3">Ingredientes</h4>
          <div className="row">
            {ingredientes.map(i => (
              <div key={i.id} className="col-md-4 mb-3">
                <div className="card">
                  <div className="card-body">
                    <h5>{i.nombre}</h5>
                    <div className="input-group">
                      <input
                        type="number"
                        step="0.01"
                        className="form-control"
                        value={cantidadesIngredientes[i.id] || ''}
                        onChange={(e) => handleCantidadIngrediente(i.id, e.target.value)}
                        placeholder="Cantidad"
                      />
                      <span className="input-group-text">{i.unidadMedida?.simbolo || 'ud'}</span>
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      <div className="card">
        <div className="card-body">
          <h4 className="mb-3">Motivo del Desperdicio</h4>
          <textarea
            className="form-control"
            value={motivo}
            onChange={(e) => setMotivo(e.target.value)}
            rows="3"
            required
          />
          <button 
            onClick={handleSubmit}
            className="btn btn-success mt-3"
          >
            Registrar Desperdicios
          </button>
        </div>
      </div>
    </div>
  );
}