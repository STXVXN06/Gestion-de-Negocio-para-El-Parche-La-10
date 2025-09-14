import React, { useState, useEffect } from 'react';
import { Input, Card, Tag, List, Typography, Alert, Spin, Button } from 'antd';
import { SearchOutlined, ExclamationCircleOutlined } from '@ant-design/icons';
import api from '../../api';

import './StockView.css';
import { useLocation, useNavigate } from 'react-router-dom';
import { hayPedidoEnCurso } from '../../utils/PedidoStorage';


const { Text } = Typography;
const { Search } = Input;

export default function StockView() {

  const navigate = useNavigate();
  const location = useLocation();

  const [ingredientes, setIngredientes] = useState([]);
  const [filteredIngredientes, setFilteredIngredientes] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchText, setSearchText] = useState('');

  useEffect(() => {
    // Verificar si hay un pedido en curso
    const pedidoEnCurso = localStorage.getItem('pedidoEnCurso');
    // Podemos hacer algo con esta información si es necesario
  }, []);

  // Función para volver al pedido si hay uno en curso
  const volverAPedido = () => {
    navigate('/pedidos-mobile/agregarPedido');
  };

  // Función para volver a la página anterior
  const volverAtras = () => {
    navigate(-1);
  };


  useEffect(() => {
    cargarIngredientes();
  }, []);

  useEffect(() => {
    filtrarIngredientes();
  }, [searchText, ingredientes]);

  const cargarIngredientes = async () => {
    try {
      const response = await api.get('/api/ingredientes');
      setIngredientes(response.data);
    } catch (error) {
      console.error("Error cargando ingredientes:", error);
    } finally {
      setLoading(false);
    }
  };

  const filtrarIngredientes = () => {
    if (!searchText) {
      setFilteredIngredientes(ingredientes);
      return;
    }

    const filtered = ingredientes.filter(ingrediente =>
      ingrediente.nombre.toLowerCase().includes(searchText.toLowerCase())
    );
    setFilteredIngredientes(filtered);
  };

  const getStockStatus = (ingrediente) => {
    if (ingrediente.cantidadMinima && ingrediente.cantidadActual < ingrediente.cantidadMinima) {
      return 'low';
    }
    if (ingrediente.cantidadActual === 0) {
      return 'out';
    }
    return 'normal';
  };

  const getStatusColor = (status) => {
    switch (status) {
      case 'low': return 'orange';
      case 'out': return 'red';
      default: return 'green';
    }
  };

  const getStatusText = (status) => {
    switch (status) {
      case 'low': return 'Stock Bajo';
      case 'out': return 'Sin Stock';
      default: return 'Disponible';
    }
  };

  if (loading) {
    return (
      <div className="stock-view-container">
        <div className="loading-spinner">
          <Spin size="large" />
          <p>Cargando inventario...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="stock-view-container">
      <div className="stock-header">
        <div className="stock-header-actions">

          {/* Mostrar botón para volver al pedido si hay uno en curso */}
          {hayPedidoEnCurso() && (<Button
            type="primary"
            onClick={volverAPedido}
          >
            Volver al Pedido
          </Button>
          )}
        </div>

        <h2>Inventario de Ingredientes</h2>
        <p>Consulta el stock actual de ingredientes</p>
      </div>

      <div className="search-container">
        <Search
          placeholder="Buscar ingrediente..."
          allowClear
          enterButton={<SearchOutlined />}
          size="large"
          value={searchText}
          onChange={(e) => setSearchText(e.target.value)}
          className="search-input"
        />
      </div>

      {filteredIngredientes.length === 0 ? (
        <div className="no-results">
          <ExclamationCircleOutlined style={{ fontSize: '24px', marginBottom: '10px' }} />
          <p>No se encontraron ingredientes</p>
        </div>
      ) : (
        <List
          dataSource={filteredIngredientes}
          renderItem={ingrediente => {
            const status = getStockStatus(ingrediente);
            const statusColor = getStatusColor(status);
            const statusText = getStatusText(status);

            return (
              <Card className="ingredient-card" size="small">
                <div className="card-content">
                  <div className="ingredient-info">
                    <Text strong className="ingredient-name">{ingrediente.nombre}</Text>
                    <div className="ingredient-details">
                      <span className="quantity">
                        {ingrediente.cantidadActual} {ingrediente.unidadMedida?.nombre || ''}
                      </span>
                      <Tag color={statusColor} className="status-tag">
                        {statusText}
                      </Tag>
                    </div>
                  </div>

                  {ingrediente.cantidadMinima && (
                    <div className="min-quantity">
                      <Text type="secondary" className="min-quantity-text">
                        Mínimo: {ingrediente.cantidadMinima} {ingrediente.unidadMedida?.nombre || ''}
                      </Text>
                    </div>
                  )}
                </div>
              </Card>
            );
          }}
        />
      )}

      <div className="stock-summary">
        <Alert
          message="Resumen de inventario"
          description={
            <div className="summary-content">
              <div className="summary-item">
                <Tag color="green">Disponible</Tag>
                <span>{ingredientes.filter(i => getStockStatus(i) === 'normal').length} ingredientes</span>
              </div>
              <div className="summary-item">
                <Tag color="orange">Stock Bajo</Tag>
                <span>{ingredientes.filter(i => getStockStatus(i) === 'low').length} ingredientes</span>
              </div>
              <div className="summary-item">
                <Tag color="red">Sin Stock</Tag>
                <span>{ingredientes.filter(i => getStockStatus(i) === 'out').length} ingredientes</span>
              </div>
            </div>
          }
          type="info"
          showIcon
        />
      </div>
    </div>
  );
}