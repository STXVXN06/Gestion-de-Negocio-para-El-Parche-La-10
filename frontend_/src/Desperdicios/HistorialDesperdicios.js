import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { Pagination, Spin } from 'antd';
import moment from 'moment';
import api from '../api';



export default function HistorialDesperdicios() {
  const [desperdicios, setDesperdicios] = useState([]);
  const [filtroFecha, setFiltroFecha] = useState('');
  const [loading, setLoading] = useState(false);
  const [page, setPage] = useState(1); // 1-based
  const [pageSize, setPageSize] = useState(10);
  const [total, setTotal] = useState(0);

  useEffect(() => {
    cargarHistorial(page, pageSize);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [page, pageSize]);

  // Si cambia el filtro, vuelve a la primera página
  useEffect(() => {
    setPage(1);
  }, [filtroFecha]);

  const cargarHistorial = async (nextPage = 1, nextPageSize = pageSize) => {
    setLoading(true);
    try {
      const params = { page: Math.max(0, nextPage - 1), size: nextPageSize };
      if (filtroFecha) {
        params.fechaInicio = moment(filtroFecha, 'YYYY-MM-DD').startOf('day').format('YYYY-MM-DDTHH:mm:ss');
        params.fechaFin = moment(filtroFecha, 'YYYY-MM-DD').endOf('day').format('YYYY-MM-DDTHH:mm:ss');
      }
      const response = await api.get('/api/desperdicios/page', { params });
      setDesperdicios(response.data?.content ?? []);
      setTotal(response.data?.totalElements ?? 0);
    } catch (error) {
      console.error('Error cargando historial:', error);
    } finally {
      setLoading(false);
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

      {loading && (
        <div className="text-center my-3">
          <Spin />
        </div>
      )}

      <div className="row">
        {desperdicios.map((d, i) => (
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

      <div className="d-flex justify-content-center mt-4">
        <Pagination
          current={page}
          pageSize={pageSize}
          total={total}
          showSizeChanger
          onChange={(nextPage, nextPageSize) => {
            setPage(nextPage);
            setPageSize(nextPageSize);
          }}
        />
      </div>
    </div>
  );
}
