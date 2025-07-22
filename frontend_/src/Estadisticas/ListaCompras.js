import React, { useState, useEffect } from 'react';
import { Card, List, Input, Button, Tag, Tooltip, Alert, Spin } from 'antd';
import { PlusOutlined, CheckOutlined, DeleteOutlined } from '@ant-design/icons';
import './Reporte.css';
import jsPDF from 'jspdf';
import moment from 'moment';
import axios from 'axios';

const API_BASE_URL = 'http://localhost:9090/api';

const ListaCompras = () => {
  const [todosIngredientesBajos, setTodosIngredientesBajos] = useState([]);
  const [ingredientesBajosAMostrar, setIngredientesBajosAMostrar] = useState([]);
  const [nuevoItem, setNuevoItem] = useState('');
  const [listaCompras, setListaCompras] = useState([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    const fetchIngredientesBajos = async () => {
      setLoading(true);
      try {
        const res = await axios.get(`${API_BASE_URL}/ingredientes/bajo-stock`);
        setTodosIngredientesBajos(res.data);
        setIngredientesBajosAMostrar(res.data);
        console.log('Ingredientes bajos:', res.data);
      } catch (err) {
        console.error('Error cargando ingredientes bajos:', err);
      } finally {
        setLoading(false);
      }
    };
    fetchIngredientesBajos();
  }, []);

  const agregarItem = () => {
    if (nuevoItem.trim() !== '') {
      setListaCompras([...listaCompras, {
        id: Date.now(),
        nombre: nuevoItem,
        completado: false,
        esIngrediente: false
      }]);
      setNuevoItem('');
    }
  };

  const agregarIngredienteALista = (ingrediente) => {
    const nuevoItem = {
      id: ingrediente.id,
      nombre: ingrediente.nombre,
      cantidad: `${(ingrediente.cantidadMinima - ingrediente.cantidadActual).toFixed(2)} ${ingrediente.unidadMedida?.simbolo || ''}`,
      completado: false,
      esIngrediente: true
    };
    setListaCompras([...listaCompras, nuevoItem]);
    setIngredientesBajosAMostrar(
      ingredientesBajosAMostrar.filter(ing => ing.id !== ingrediente.id)
    );
  };

  const toggleCompletado = (id) => {
    setListaCompras(
      listaCompras.map(item =>
        item.id === id ? { ...item, completado: !item.completado } : item
      )
    );
  };

  const eliminarItem = (id) => {
    const item = listaCompras.find(item => item.id === id);
    if (item && item.esIngrediente) {
      const ingredienteOriginal = todosIngredientesBajos.find(ing => ing.id === id);
      if (ingredienteOriginal) {
        setIngredientesBajosAMostrar([...ingredientesBajosAMostrar, ingredienteOriginal]);
      }
    }
    setListaCompras(listaCompras.filter(item => item.id !== id));
  };

  const generarPDFListaCompras = () => {
    const pdf = new jsPDF();
    pdf.setFontSize(18);
    pdf.text('Lista de Compras', 105, 15, null, null, 'center');
    pdf.setFontSize(12);
    pdf.text(`Fecha: ${moment().format('DD/MM/YYYY')}`, 15, 25);
    pdf.setFontSize(14);
    pdf.text('Ítems:', 15, 35);
    pdf.setFontSize(12);
    let yPos = 45;
    listaCompras.forEach((item, index) => {
      if (yPos > 280) {
        pdf.addPage();
        yPos = 15;
      }
      const texto = `${index + 1}. ${item.nombre}${item.cantidad ? ` - ${item.cantidad}` : ''}`;
      pdf.text(texto, 20, yPos);
      yPos += 10;
    });
    pdf.save(`lista-compras-${moment().format('YYYYMMDD')}.pdf`);
  };

  return (
    <div className="compras-grid-2col">
      <div className="ingredientes-stock-card">
        <h3 className="section-title">Ingredientes con Stock Bajo</h3>
        <div className="ingredientes-scroll">
          {loading ? (
            <div className="loading-container">
              <Spin size="large" />
              <p>Cargando ingredientes...</p>
            </div>
          ) : ingredientesBajosAMostrar.length > 0 ? (
            <List
              dataSource={ingredientesBajosAMostrar}
              renderItem={item => (
                <List.Item className="ingrediente-item">
                  <div className="ingrediente-info">
                    <div className="ingrediente-header">
                      <div>
                        <div className="ingrediente-nombre">{item.nombre}</div>
                        <div className="stock-info">
                          <span className="stock-label">Stock Actual:</span>
                          <span className="stock-value">{item.cantidadActual} {item.unidadMedida?.simbolo || ''}</span>
                          <span className="stock-label">Mínimo:</span>
                          <span className="stock-value">{item.cantidadMinima} {item.unidadMedida?.simbolo || ''}</span>
                        </div>
                      </div>
                      <Tooltip title="Agregar a lista de compras">
                        <Button
                          type="primary"
                          shape="circle"
                          icon={<PlusOutlined />}
                          onClick={() => agregarIngredienteALista(item)}
                          className="add-ingredient-btn"
                        />
                      </Tooltip>
                    </div>
                  </div>
                </List.Item>
              )}
              className="ingredientes-list"
            />
          ) : (
            <Alert
              message="No hay ingredientes con stock bajo"
              type="success"
              showIcon
              className="empty-alert"
            />
          )}
        </div>
      </div>
      <div className="mi-lista-compras-card">
        <div className="lista-header">
          <h3 className="section-title">Mi Lista de Compras</h3>
          <Tag color="blue" className="total-tag">
            Total: {listaCompras.length} ítem{listaCompras.length !== 1 ? 's' : ''}
          </Tag>
          <Button
            type="primary"
            icon={<PlusOutlined />}
            onClick={generarPDFListaCompras}
            className="download-pdf-btn"
          >
            Descargar PDF
          </Button>
        </div>
        <div className="mi-lista-scroll">
          {listaCompras.length > 0 ? (
            <List
              dataSource={listaCompras}
              renderItem={item => (
                <List.Item
                  className={`compra-item ${item.completado ? 'completed' : ''}`}
                  actions={[
                    <Tooltip title={item.completado ? "Marcar como pendiente" : "Marcar como completado"}>
                      <Button
                        type="text"
                        icon={<CheckOutlined />}
                        onClick={() => toggleCompletado(item.id)}
                        className={`complete-btn ${item.completado ? 'completed' : ''}`}
                      />
                    </Tooltip>,
                    <Tooltip title="Eliminar">
                      <Button
                        type="text"
                        icon={<DeleteOutlined />}
                        onClick={() => eliminarItem(item.id)}
                        className="delete-btn"
                      />
                    </Tooltip>
                  ]}
                >
                  <List.Item.Meta
                    title={
                      <div className="item-title-container">
                        <span className={item.completado ? 'completed-text' : ''}>{item.nombre}</span>
                        {item.cantidad && (
                          <Tag color="geekblue" className="quantity-tag">
                            {item.cantidad}
                          </Tag>
                        )}
                      </div>
                    }
                  />
                </List.Item>
              )}
              className="compras-list"
            />
          ) : (
            <Alert
              message="Tu lista de compras está vacía"
              description="Agrega ingredientes desde el panel izquierdo o añade nuevos ítem manualmente"
              type="info"
              showIcon
              className="empty-alert"
            />
          )}
        </div>
        <div className="add-item-container">
          <Input
            placeholder="Agregar ítem a la lista (ej: Servilletas, Bolsas, etc.)"
            value={nuevoItem}
            onChange={(e) => setNuevoItem(e.target.value)}
            onPressEnter={agregarItem}
            className="add-item-input"
          />
          <Button
            type="primary"
            icon={<PlusOutlined />}
            onClick={agregarItem}
            className="add-item-button"
            disabled={!nuevoItem.trim()}
          />
        </div>
      </div>
    </div>
  );
};

export default ListaCompras;
