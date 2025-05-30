import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { Link } from 'react-router-dom';

export default function HistorialDesperdicios() {
  const [desperdicios, setDesperdicios] = useState([]);
  const [filtroFecha, setFiltroFecha] = useState('');

  useEffect(() => {
    cargarHistorial();
  }, []);

  const cargarHistorial = async () => {
    try {
      const response = await axios.get('http://localhost:9090/api/desperdicios');
      setDesperdicios(response.data);
    } catch (error) {
      console.error('Error cargando historial:', error);
    }
  };

  return (
    <div className="container mt-4">
      <div className="d-flex justify-content-between align-items-center mb-4">
        <h2>Historial de Desperdicios</h2>
        <Link to="/registroDesperdicios" className="btn btn-primary">
          Volver al Registro
        </Link>
      </div>

      <div className="card mb-4">
        <div className="card-body">
          <div className="row">
            <div className="col-md-4">
              <input
                type="date"
                className="form-control"
                value={filtroFecha}
                onChange={(e) => setFiltroFecha(e.target.value)}
              />
            </div>
          </div>
        </div>
      </div>

      <div className="row">
        {desperdicios
          .filter(d => !filtroFecha || 
            new Date(d.fecha).toISOString().split('T')[0] === filtroFecha)
          .sort((a, b) => new Date(b.fecha) - new Date(a.fecha)) // Orden descendente
          .map((d, i) => (
            <div key={i} className="col-md-6 mb-3">
              <div className="card">
                <div className="card-body">
                  <h5 className="card-title">
                    {new Date(d.fecha).toLocaleString('es-ES', {
                      weekday: 'long',
                      year: 'numeric',
                      month: 'long',
                      day: 'numeric',
                      hour: '2-digit',
                      minute: '2-digit',
                      hour12: true
                    })}
                  </h5>
                  <div className="row">
                    {d.producto && (
                      <div className="col-md-6">
                        <p className="mb-1">
                          <strong>Producto:</strong> {d.producto.nombre}
                        </p>
                        <p className="mb-1">
                          <strong>Cantidad:</strong> {d.cantidadProducto}
                        </p>
                      </div>
                    )}
                    {d.ingrediente && (
                      <div className="col-md-6">
                        <p className="mb-1">
                          <strong>Ingrediente:</strong> {d.ingrediente.nombre}
                        </p>
                        <p className="mb-1">
                          <strong>Cantidad:</strong> {d.cantidadIngrediente} {d.ingrediente.unidadMedida?.simbolo}
                        </p>
                      </div>
                    )}
                  </div>
                  <p className="mt-2">
                    <strong>Motivo:</strong> {d.motivo}
                  </p>
                </div>
              </div>
            </div>
          ))}
      </div>
    </div>
  );
}
