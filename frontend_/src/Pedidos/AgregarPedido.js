import axios from 'axios';
import React, { useEffect, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { NumericFormat } from 'react-number-format';
import { Tabs, Input, Button, Card, Badge } from 'antd';
import { SearchOutlined, PlusOutlined, MinusOutlined, DeleteOutlined } from '@ant-design/icons';
import './AgregarPedido.css'; // Archivo CSS adicional

const { TabPane } = Tabs;

export default function AgregarPedido() {
  const navigate = useNavigate();
  const [productosDisponibles, setProductosDisponibles] = useState([]);
  const [combosDisponibles, setCombosDisponibles] = useState([]);
  const [productosSeleccionados, setProductosSeleccionados] = useState([]);
  const [combosSeleccionados, setCombosSeleccionados] = useState([]);
  const [detalles, setDetalles] = useState('');
  const [busquedaProducto, setBusquedaProducto] = useState('');
  const [busquedaCombo, setBusquedaCombo] = useState('');
  const [activeTab, setActiveTab] = useState('1');

  // Obtener productos y combos activos del backend
  useEffect(() => {
    const cargarDatos = async () => {
      try {
        const [productosResponse, combosResponse] = await Promise.all([
          axios.get('http://localhost:9090/api/productos'),
          axios.get('http://localhost:9090/api/combos')
        ]);
        setProductosDisponibles(productosResponse.data.filter(p => p.activo));
        setCombosDisponibles(combosResponse.data.filter(c => c.activo));
      } catch (error) {
        console.error("Error cargando datos:", error);
      }
    };
    cargarDatos();
  }, []);

  // Filtrar productos según búsqueda
  const productosFiltrados = productosDisponibles.filter(p =>
    p.nombre.toLowerCase().includes(busquedaProducto.toLowerCase())
  );

  // Filtrar combos según búsqueda
  const combosFiltrados = combosDisponibles.filter(c =>
    c.nombre.toLowerCase().includes(busquedaCombo.toLowerCase())
  );

  // Manejar cambios en las cantidades de productos
  const actualizarCantidadProducto = (productoId, nuevaCantidad) => {
    const cantidad = Math.max(nuevaCantidad, 0);

    setProductosSeleccionados(prev => {
      const existe = prev.find(p => p.productoId === productoId);
      if (existe) {
        return prev.map(p =>
          p.productoId === productoId ? { ...p, cantidad } : p
        ).filter(p => p.cantidad > 0);
      }
      return [...prev, { productoId, cantidad }];
    });
  };

  // Manejar cambios en las cantidades de combos
  const actualizarCantidadCombo = (comboId, nuevaCantidad) => {
    const cantidad = Math.max(nuevaCantidad, 0);

    setCombosSeleccionados(prev => {
      const existe = prev.find(c => c.comboId === comboId);
      if (existe) {
        return prev.map(c =>
          c.comboId === comboId ? { ...c, cantidad } : c
        ).filter(c => c.cantidad > 0);
      }
      return [...prev, { comboId, cantidad }];
    });
  };

  // Quitar un producto del pedido
  const quitarProducto = (productoId) => {
    setProductosSeleccionados(prev => prev.filter(p => p.productoId !== productoId));
  };

  // Quitar un combo del pedido
  const quitarCombo = (comboId) => {
    setCombosSeleccionados(prev => prev.filter(c => c.comboId !== comboId));
  };

  // Enviar pedido al backend
  const onSubmit = async (e) => {
    e.preventDefault();

    const pedidoDTO = {
      productos: productosSeleccionados
        .filter(p => p.cantidad > 0)
        .map(p => ({
          productoId: p.productoId,
          cantidad: p.cantidad
        })),
      combos: combosSeleccionados
        .filter(c => c.cantidad > 0)
        .map(c => ({
          comboId: c.comboId,
          cantidad: c.cantidad
        })),
      detalles
    };

    try {
      await axios.post('http://localhost:9090/api/pedidos', pedidoDTO);
      navigate('/pedidos');
    } catch (error) {
      console.error("Error creando pedido:", error.response?.data);
      alert(`Error: ${error.response?.data.mensaje || "Revise los datos"}`);
    }
  };

  // Obtener información de un producto por ID
  const obtenerInfoProducto = (id) => {
    return productosDisponibles.find(p => p.id === id);
  };

  // Obtener información de un combo por ID
  const obtenerInfoCombo = (id) => {
    return combosDisponibles.find(c => c.id === id);
  };

  // Función CORREGIDA para calcular el total
  const calcularTotal = () => {
    const totalProductos = productosSeleccionados.reduce((total, item) => {
      const producto = obtenerInfoProducto(item.productoId);
      return total + (producto?.precio || 0) * item.cantidad;
    }, 0);

    const totalCombos = combosSeleccionados.reduce((total, item) => {
      const combo = obtenerInfoCombo(item.comboId);
      return total + (combo?.precio || 0) * item.cantidad;
    }, 0);

    return totalProductos + totalCombos;
  };

  return (
    <div className='container'>
      <div className='container text-center' style={{ margin: '30px' }}>
        <h1>Crear Nuevo Pedido</h1>
        <p className="text-muted">Seleccione productos y combos para agregar a su pedido</p>
      </div>

      <div className="pedido-container">
        <div className="seleccion-container">
          <Tabs
            defaultActiveKey="1"
            activeKey={activeTab}
            onChange={setActiveTab}
            className="custom-tabs"
          >
            <TabPane tab={<span><i className="fas fa-hamburger"></i> Productos</span>} key="1">
              <div className="mb-3">
                <Input
                  placeholder="Buscar productos..."
                  prefix={<SearchOutlined />}
                  value={busquedaProducto}
                  onChange={(e) => setBusquedaProducto(e.target.value)}
                  size="large"
                />
              </div>

              <div className="productos-grid">
                {productosFiltrados.map((producto) => {
                  const seleccionado = productosSeleccionados.find(p => p.productoId === producto.id);
                  const cantidad = seleccionado?.cantidad || 0;

                  return (
                    <Card
                      key={producto.id}
                      className={`producto-card ${cantidad > 0 ? 'selected' : ''}`}
                      hoverable
                    >
                      <div className="card-content">
                        <div className="card-header">
                          <h5>{producto.nombre}</h5>
                          <Badge
                            count={cantidad}
                            style={{ backgroundColor: '#1890ff' }}
                            className="cantidad-badge"
                          />
                        </div>
                        <p className="card-text">
                          <small className="text-muted">{producto.tipo}</small><br />
                          <NumericFormat
                            value={producto.precio}
                            displayType="text"
                            thousandSeparator=","
                            prefix="$"
                            className="precio"
                          />
                        </p>

                        <div className="controles-cantidad">
                          <Button
                            type="primary"
                            shape="circle"
                            icon={<MinusOutlined />}
                            onClick={() => actualizarCantidadProducto(producto.id, cantidad - 1)}
                            disabled={cantidad === 0}
                          />
                          <Input
                            type="number"
                            className="cantidad-input"
                            value={cantidad}
                            onChange={(e) => actualizarCantidadProducto(producto.id, parseInt(e.target.value) || 0)}
                            min="0"
                          />
                          <Button
                            type="primary"
                            shape="circle"
                            icon={<PlusOutlined />}
                            onClick={() => actualizarCantidadProducto(producto.id, cantidad + 1)}
                          />
                        </div>
                      </div>
                    </Card>
                  );
                })}
              </div>
            </TabPane>

            <TabPane tab={<span><i className="fas fa-box"></i> Combos</span>} key="2">
              <div className="mb-3">
                <Input
                  placeholder="Buscar combos..."
                  prefix={<SearchOutlined />}
                  value={busquedaCombo}
                  onChange={(e) => setBusquedaCombo(e.target.value)}
                  size="large"
                />
              </div>

              <div className="combos-grid">
                {combosFiltrados.map((combo) => {
                  const seleccionado = combosSeleccionados.find(c => c.comboId === combo.id);
                  const cantidad = seleccionado?.cantidad || 0;

                  return (
                    <Card
                      key={combo.id}
                      className={`combo-card ${cantidad > 0 ? 'selected' : ''}`}
                      hoverable
                    >
                      <div className="card-content">
                        <div className="card-header">
                          <h5>{combo.nombre}</h5>
                          <Badge
                            count={cantidad}
                            style={{ backgroundColor: '#52c41a' }}
                            className="cantidad-badge"
                          />
                        </div>
                        <p className="card-text">{combo.descripcion}</p>
                        <p className="card-text">
                          <NumericFormat
                            value={combo.precio}
                            displayType="text"
                            thousandSeparator=","
                            prefix="$"
                            className="precio"
                          />
                        </p>

                        <div className="controles-cantidad">
                          <Button
                            type="primary"
                            shape="circle"
                            icon={<MinusOutlined />}
                            onClick={() => actualizarCantidadCombo(combo.id, cantidad - 1)}
                            disabled={cantidad === 0}
                          />
                          <Input
                            type="number"
                            className="cantidad-input"
                            value={cantidad}
                            onChange={(e) => actualizarCantidadCombo(combo.id, parseInt(e.target.value) || 0)}
                            min="0"
                          />
                          <Button
                            type="primary"
                            shape="circle"
                            icon={<PlusOutlined />}
                            onClick={() => actualizarCantidadCombo(combo.id, cantidad + 1)}
                          />
                        </div>
                      </div>
                    </Card>
                  );
                })}
              </div>
            </TabPane>
          </Tabs>
        </div>

        <div className="resumen-container">
          <div className="resumen-pedido">
            <h3>Resumen del Pedido</h3>
            <div className="d-flex justify-content-between align-items-center mb-3">
              <h3>Total:</h3>
              <h3 className="text-success m-0">
                <NumericFormat
                  value={calcularTotal()}
                  displayType="text"
                  thousandSeparator=","
                  prefix="$"
                  decimalScale={0}
                />
              </h3>
            </div>

            {productosSeleccionados.length === 0 && combosSeleccionados.length === 0 ? (
              <div className="empty-cart">
                <i className="fas fa-shopping-cart fa-3x"></i>
                <p>No hay productos o combos seleccionados</p>
              </div>
            ) : (
              <div className="resumen-content">
                {/* Productos seleccionados */}
                {productosSeleccionados.length > 0 && (
                  <div className="seccion-resumen">
                    <h5>Productos</h5>
                    <ul className="lista-resumen">
                      {productosSeleccionados.map(item => {
                        const producto = obtenerInfoProducto(item.productoId);
                        return (
                          <li key={item.productoId} className="item-resumen">
                            <div className="item-info">
                              <span className="item-nombre">{producto?.nombre || 'Producto eliminado'}</span>
                              <div className="item-controles">
                                <Button
                                  type="text"
                                  icon={<MinusOutlined />}
                                  onClick={() => actualizarCantidadProducto(item.productoId, item.cantidad - 1)}
                                />
                                <span className="item-cantidad">{item.cantidad}</span>
                                <Button
                                  type="text"
                                  icon={<PlusOutlined />}
                                  onClick={() => actualizarCantidadProducto(item.productoId, item.cantidad + 1)}
                                />
                              </div>
                            </div>
                            <Button
                              type="text"
                              icon={<DeleteOutlined />}
                              onClick={() => quitarProducto(item.productoId)}
                              danger
                            />
                          </li>
                        );
                      })}
                    </ul>
                  </div>
                )}

                {/* Combos seleccionados */}
                {combosSeleccionados.length > 0 && (
                  <div className="seccion-resumen">
                    <h5>Combos</h5>
                    <ul className="lista-resumen">
                      {combosSeleccionados.map(item => {
                        const combo = obtenerInfoCombo(item.comboId);
                        return (
                          <li key={item.comboId} className="item-resumen">
                            <div className="item-info">
                              <span className="item-nombre">{combo?.nombre || 'Combo eliminado'}</span>
                              <div className="item-controles">
                                <Button
                                  type="text"
                                  icon={<MinusOutlined />}
                                  onClick={() => actualizarCantidadCombo(item.comboId, item.cantidad - 1)}
                                />
                                <span className="item-cantidad">{item.cantidad}</span>
                                <Button
                                  type="text"
                                  icon={<PlusOutlined />}
                                  onClick={() => actualizarCantidadCombo(item.comboId, item.cantidad + 1)}
                                />
                              </div>
                            </div>
                            <Button
                              type="text"
                              icon={<DeleteOutlined />}
                              onClick={() => quitarCombo(item.comboId)}
                              danger
                            />
                          </li>
                        );
                      })}
                    </ul>
                  </div>
                )}

                {/* Detalles adicionales */}
                <div className="detalles-adicionales">
                  <label htmlFor="detalles" className='form-label'>Notas adicionales</label>
                  <textarea
                    className='form-control'
                    id="detalles"
                    value={detalles}
                    onChange={(e) => setDetalles(e.target.value)}
                    placeholder="Especificaciones especiales, instrucciones de entrega, etc."
                    rows="3"
                  />
                </div>

                {/* Botones */}
                <div className="botones-resumen">
                  <Button
                    type="primary"
                    size="large"
                    onClick={onSubmit}
                    disabled={productosSeleccionados.length === 0 && combosSeleccionados.length === 0}
                    block
                  >
                    Confirmar Pedido
                  </Button>
                  <Link to="/pedidos">
                    <Button type="default" size="large" block>
                      Cancelar
                    </Button>
                  </Link>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}