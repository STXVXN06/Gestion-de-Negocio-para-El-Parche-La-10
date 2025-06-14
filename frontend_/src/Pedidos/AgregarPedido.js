import axios from 'axios';
import React, { useEffect, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { NumericFormat } from 'react-number-format';
import { Tabs, Input, Button, Card, Badge, Row, Col, InputNumber, Switch, Descriptions } from 'antd';
import { SearchOutlined, PlusOutlined, MinusOutlined, DeleteOutlined, HomeOutlined } from '@ant-design/icons';
import './AgregarPedido.css';

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
  const [cantidadP1, setCantidadP1] = useState(0);
  const [cantidadC1, setCantidadC1] = useState(0);
  const [stockDesechables, setStockDesechables] = useState({});
  const [domicilio, setDomicilio] = useState(false);
  const [costoDomicilio, setCostoDomicilio] = useState(2000);

  // Obtener productos, combos y stock de desechables
  useEffect(() => {
    const cargarDatos = async () => {
      try {
        const [productosResponse, combosResponse, ingredientesResponse] = await Promise.all([
          axios.get('http://localhost:9090/api/productos'),
          axios.get('http://localhost:9090/api/combos'),
          axios.get('http://localhost:9090/api/ingredientes')
        ]);

        setProductosDisponibles(productosResponse.data.filter(p => p.activo));
        setCombosDisponibles(combosResponse.data.filter(c => c.activo));

        // Obtener stock de desechables (P1 y C1)
        const p1 = ingredientesResponse.data.find(i => i.nombre === 'P1');
        const c1 = ingredientesResponse.data.find(i => i.nombre === 'C1');

        setStockDesechables({
          P1: p1 ? p1.cantidadActual : 0,
          C1: c1 ? c1.cantidadActual : 0
        });
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

    // Verificar stock de desechables
    if (cantidadP1 > stockDesechables.P1) {
      alert(`No hay suficiente stock de P1. Disponible: ${stockDesechables.P1}`);
      return;
    }

    if (cantidadC1 > stockDesechables.C1) {
      alert(`No hay suficiente stock de C1. Disponible: ${stockDesechables.C1}`);
      return;
    }

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
      detalles,
      cantidadP1,
      cantidadC1,
      domicilio,
      costoDomicilio: domicilio ? costoDomicilio : 0
    };

    try {
      await axios.post('http://localhost:9090/api/pedidos', pedidoDTO);
      navigate('/pedidos');
    } catch (error) {
      if (error.response?.data?.message) {
        // Mostrar error específico del backend
        alert(`Error: ${error.response.data.message}`);
      } else {
        alert("Error desconocido al crear el pedido");
      }
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

  // Función para calcular los subtotales
  const calcularSubtotales = () => {
    const totalProductos = productosSeleccionados.reduce((total, item) => {
      const producto = obtenerInfoProducto(item.productoId);
      return total + (producto?.precio || 0) * item.cantidad;
    }, 0);

    const totalCombos = combosSeleccionados.reduce((total, item) => {
      const combo = obtenerInfoCombo(item.comboId);
      return total + (combo?.precio || 0) * item.cantidad;
    }, 0);

    // Calcular subtotal de desechables: P1 y C1 cuestan $500 cada uno
    const subtotalP1 = cantidadP1 * 500;
    const subtotalC1 = cantidadC1 * 500;
    const totalDesechables = subtotalP1 + subtotalC1;

    // Agregar costo de domicilio si está activado
    const totalDomicilio = domicilio ? costoDomicilio : 0;

    const totalGeneral = totalProductos + totalCombos + totalDesechables + totalDomicilio;

    return {
      totalProductos,
      totalCombos,
      subtotalP1,
      subtotalC1,
      totalDesechables,
      totalDomicilio,
      totalGeneral
    };
  };

  const {
    totalProductos,
    totalCombos,
    subtotalP1,
    subtotalC1,
    totalDesechables,
    totalDomicilio,
    totalGeneral
  } = calcularSubtotales();

  return (
    <div className='container'>
      <div className='container text-center' style={{ margin: '30px' }}>
        <h1>Crear Nuevo Pedido</h1>
        <p className="text-muted">Seleccione productos y combos para agregar a su pedido</p>
      </div>

      <Row gutter={[16, 16]}>
        <Col xs={24} md={16}>
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
        </Col>

        <Col xs={24} md={8}>
          <Card className="resumen-pedido" style={{ position: 'sticky', top: '20px' }}>
            <h3>Resumen del Pedido</h3>

            {/* Desglose de costos */}
            <Descriptions bordered size="small" column={1} className="mb-3">
              <Descriptions.Item label="Productos">
                <NumericFormat
                  value={totalProductos}
                  displayType="text"
                  thousandSeparator=","
                  prefix="$"
                  decimalScale={0}
                />
              </Descriptions.Item>
              <Descriptions.Item label="Combos">
                <NumericFormat
                  value={totalCombos}
                  displayType="text"
                  thousandSeparator=","
                  prefix="$"
                  decimalScale={0}
                />
              </Descriptions.Item>

              {/* Subtotal para desechables */}
              <Descriptions.Item label="Desechables">
                <div className="d-flex justify-content-between">
                  <span>P1 ({cantidadP1} x $500):</span>
                  <span>
                    <NumericFormat
                      value={subtotalP1}
                      displayType="text"
                      thousandSeparator=","
                      prefix="$"
                      decimalScale={0}
                    />
                  </span>
                </div>
                <div className="d-flex justify-content-between">
                  <span>C1 ({cantidadC1} x $500):</span>
                  <span>
                    <NumericFormat
                      value={subtotalC1}
                      displayType="text"
                      thousandSeparator=","
                      prefix="$"
                      decimalScale={0}
                    />
                  </span>
                </div>
                <div className="d-flex justify-content-between fw-bold">
                  <span>Subtotal:</span>
                  <span>
                    <NumericFormat
                      value={totalDesechables}
                      displayType="text"
                      thousandSeparator=","
                      prefix="$"
                      decimalScale={0}
                    />
                  </span>
                </div>
              </Descriptions.Item>

              {domicilio && (
                <Descriptions.Item label="Domicilio">
                  <NumericFormat
                    value={totalDomicilio}
                    displayType="text"
                    thousandSeparator=","
                    prefix="$"
                    decimalScale={0}
                  />
                </Descriptions.Item>
              )}

              <Descriptions.Item label="Total" className="fw-bold">
                <NumericFormat
                  value={totalGeneral}
                  displayType="text"
                  thousandSeparator=","
                  prefix="$"
                  decimalScale={0}
                />
              </Descriptions.Item>
            </Descriptions>

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
                        const subtotal = producto ? producto.precio * item.cantidad : 0;

                        return (
                          <li key={item.productoId} className="item-resumen">
                            <div className="item-info">
                              <div className="d-flex justify-content-between align-items-start">
                                <div>
                                  <span className="item-nombre">{item.cantidad}x {producto?.nombre || 'Producto eliminado'}</span>
                                  <div className="text-muted small">
                                    <NumericFormat
                                      value={producto?.precio || 0}
                                      displayType="text"
                                      thousandSeparator=","
                                      prefix="$ c/u"
                                    />
                                  </div>
                                </div>
                                <span className="item-subtotal">
                                  <NumericFormat
                                    value={subtotal}
                                    displayType="text"
                                    thousandSeparator=","
                                    prefix="$"
                                  />
                                </span>
                              </div>
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
                        const subtotal = combo ? combo.precio * item.cantidad : 0;

                        return (
                          <li key={item.comboId} className="item-resumen">
                            <div className="item-info">
                              <div className="d-flex justify-content-between align-items-start">
                                <div>
                                  <span className="item-nombre">{item.cantidad}x {combo?.nombre || 'Combo eliminado'}</span>
                                  <div className="text-muted small">
                                    <NumericFormat
                                      value={combo?.precio || 0}
                                      displayType="text"
                                      thousandSeparator=","
                                      prefix="$ c/u"
                                    />
                                  </div>
                                </div>
                                <span className="item-subtotal">
                                  <NumericFormat
                                    value={subtotal}
                                    displayType="text"
                                    thousandSeparator=","
                                    prefix="$"
                                  />
                                </span>
                              </div>
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
              </div>
            )}

            {/* Desechables */}
            <div className="seccion-resumen mt-3">
              <h5>Desechables</h5>
              <div className="d-flex justify-content-between align-items-center mb-2">
                <div>
                  <span>P1</span>
                  {stockDesechables.P1 !== undefined && (
                    <small className="text-muted ms-2">(Stock: {stockDesechables.P1})</small>
                  )}
                </div>
                <InputNumber
                  min={0}
                  max={stockDesechables.P1}
                  value={cantidadP1}
                  onChange={setCantidadP1}
                  style={{ width: '80px' }}
                />
              </div>

              <div className="d-flex justify-content-between align-items-center mb-2">
                <div>
                  <span>C1</span>
                  {stockDesechables.C1 !== undefined && (
                    <small className="text-muted ms-2">(Stock: {stockDesechables.C1})</small>
                  )}
                </div>
                <InputNumber
                  min={0}
                  max={stockDesechables.C1}
                  value={cantidadC1}
                  onChange={setCantidadC1}
                  style={{ width: '80px' }}
                />
              </div>
            </div>

            {/* Opciones de domicilio */}
            <div className="seccion-resumen mt-3">
              <div className="d-flex justify-content-between align-items-center mb-2">
                <div className="d-flex align-items-center">
                  <HomeOutlined style={{ marginRight: '8px', color: '#1890ff' }} />
                  <span>Domicilio</span>
                </div>
                <Switch
                  checked={domicilio}
                  onChange={setDomicilio}
                  checkedChildren="Sí"
                  unCheckedChildren="No"
                />
              </div>

              {domicilio && (
                <div className="d-flex justify-content-between align-items-center mt-2">
                  <span>Costo de domicilio:</span>
                  <InputNumber
                    min={0}
                    value={costoDomicilio}
                    onChange={setCostoDomicilio}
                    formatter={value => `$ ${value}`.replace(/\B(?=(\d{3})+(?!\d))/g, ',')}
                    parser={value => value.replace(/\$\s?|(,*)/g, '')}
                    style={{ width: '120px' }}
                  />
                </div>
              )}
            </div>

            {/* Detalles adicionales */}
            <div className="detalles-adicionales mt-3">
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
            <div className="botones-resumen mt-3">
              <Button
                type="primary"
                size="large"
                onClick={onSubmit}
                disabled={productosSeleccionados.length === 0 && combosSeleccionados.length === 0 && cantidadP1 === 0 && cantidadC1 === 0}
                block
              >
                Confirmar Pedido
              </Button>
              <Link to="/pedidos">
                <Button type="default" size="large" block className="mt-2">
                  Cancelar
                </Button>
              </Link>
            </div>
          </Card>
        </Col>
      </Row>
    </div>
  );
}