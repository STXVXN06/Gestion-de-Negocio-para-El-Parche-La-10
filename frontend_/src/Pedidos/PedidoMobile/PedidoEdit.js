import React, { useEffect, useMemo, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { Input, Button, Badge, InputNumber, Switch, Descriptions, Collapse, message } from 'antd';
import { NumericFormat } from 'react-number-format';
import { SearchOutlined, PlusOutlined, MinusOutlined, DeleteOutlined, HomeOutlined, CaretDownOutlined, CaretRightOutlined } from '@ant-design/icons';
import api from '../../api';
import './PedidoForm.css';

const PedidoEdit = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  
  const [productosDisponibles, setProductosDisponibles] = useState([]);
  const [combosDisponibles, setCombosDisponibles] = useState([]);
  const [ingredientesAdicionables, setIngredientesAdicionables] = useState([]);

  const [productosSeleccionados, setProductosSeleccionados] = useState([]);
  const [combosSeleccionados, setCombosSeleccionados] = useState([]);
  const [adicionesSeleccionadas, setAdicionesSeleccionadas] = useState([]);

  const [busquedaProducto, setBusquedaProducto] = useState('');
  const [busquedaCombo, setBusquedaCombo] = useState('');
  const [busquedaAdicion, setBusquedaAdicion] = useState('');
  const [activeTab, setActiveTab] = useState('productos');

  const [detalles, setDetalles] = useState('');
  const [domicilio, setDomicilio] = useState(false);
  const [costoDomicilio, setCostoDomicilio] = useState(2000);
  const [estado, setEstado] = useState('PENDIENTE');

  const [cantidadP1, setCantidadP1] = useState(0);
  const [cantidadC1, setCantidadC1] = useState(0);
  const [stockDesechables, setStockDesechables] = useState({ P1: 0, C1: 0 });

  const [loading, setLoading] = useState(true);

  useEffect(() => {
    cargarDatosIniciales();
  }, [id]);

  const cargarDatosIniciales = async () => {
    try {
      setLoading(true);
      const [pedidoResponse, productosResponse, combosResponse, ingredientesResponse] = await Promise.all([
        api.get(`/api/pedidos/${id}`),
        api.get('/api/productos'),
        api.get('/api/combos'),
        api.get('/api/ingredientes')
      ]);

      const pedido = pedidoResponse.data;
      
      // Configurar productos seleccionados
      const productosIniciales = pedido.productos?.map(p => ({
        productoId: p.id,
        cantidad: p.cantidad
      })) || [];
      setProductosSeleccionados(productosIniciales);

      // Configurar combos seleccionados
      const combosIniciales = pedido.combos?.map(c => ({
        comboId: c.id,
        cantidad: c.cantidad
      })) || [];
      setCombosSeleccionados(combosIniciales);

      // Configurar adiciones seleccionadas
      const adicionesIniciales = pedido.adiciones?.map(a => ({
        ingredienteId: a.ingredienteId,
        cantidad: a.cantidad,
        aplicadoA: a.aplicadoA || ''
      })) || [];
      setAdicionesSeleccionadas(adicionesIniciales);

      // Configurar otros campos
      setDetalles(pedido.detalles || '');
      setDomicilio(pedido.domicilio || false);
      setCostoDomicilio(pedido.costoDomicilio || 2000);
      setEstado(pedido.estado || 'PENDIENTE');
      setCantidadP1(pedido.cantidadP1 || 0);
      setCantidadC1(pedido.cantidadC1 || 0);

      // Configurar datos disponibles
      setProductosDisponibles((productosResponse.data || []).filter(p => p.activo));
      setCombosDisponibles((combosResponse.data || []).filter(c => c.activo));
      
      const adicionables = (ingredientesResponse.data || []).filter(i => i.adicionable);
      setIngredientesAdicionables(adicionables);

      // Configurar stock de desechables
      const p1 = (ingredientesResponse.data || []).find(i => i.nombre === 'P1');
      const c1 = (ingredientesResponse.data || []).find(i => i.nombre === 'C1');
      setStockDesechables({
        P1: p1 ? p1.cantidadActual : 0,
        C1: c1 ? c1.cantidadActual : 0
      });

      setLoading(false);
    } catch (error) {
      console.error('Error cargando datos del pedido:', error);
      message.error('Error al cargar el pedido');
      setLoading(false);
    }
  };

  const productosFiltrados = useMemo(() => (
    productosDisponibles.filter(p => p.nombre.toLowerCase().includes(busquedaProducto.toLowerCase()))
  ), [productosDisponibles, busquedaProducto]);

  const combosFiltrados = useMemo(() => (
    combosDisponibles.filter(c => c.nombre.toLowerCase().includes(busquedaCombo.toLowerCase()))
  ), [combosDisponibles, busquedaCombo]);

  const adicionablesFiltrados = useMemo(() => (
    ingredientesAdicionables.filter(a => a.nombre.toLowerCase().includes(busquedaAdicion.toLowerCase()))
  ), [ingredientesAdicionables, busquedaAdicion]);

  const actualizarCantidadProducto = (productoId, nuevaCantidad) => {
    const cantidad = Math.max(nuevaCantidad, 0);
    setProductosSeleccionados(prev => {
      const existe = prev.find(p => p.productoId === productoId);
      if (existe) {
        return prev
          .map(p => (p.productoId === productoId ? { ...p, cantidad } : p))
          .filter(p => p.cantidad > 0);
      }
      return [...prev, { productoId, cantidad }];
    });
  };

  const actualizarCantidadCombo = (comboId, nuevaCantidad) => {
    const cantidad = Math.max(nuevaCantidad, 0);
    setCombosSeleccionados(prev => {
      const existe = prev.find(c => c.comboId === comboId);
      if (existe) {
        return prev
          .map(c => (c.comboId === comboId ? { ...c, cantidad } : c))
          .filter(c => c.cantidad > 0);
      }
      return [...prev, { comboId, cantidad }];
    });
  };

  const actualizarCantidadAdicion = (ingredienteId, nuevaCantidad, aplicadoA = '') => {
    const cantidad = Math.max(nuevaCantidad, 0);
    setAdicionesSeleccionadas(prev => {
      const existe = prev.find(a => a.ingredienteId === ingredienteId);
      if (existe) {
        return prev
          .map(a => (a.ingredienteId === ingredienteId ? { ...a, cantidad, aplicadoA: aplicadoA || a.aplicadoA } : a))
          .filter(a => a.cantidad > 0);
      }
      return [...prev, { ingredienteId, cantidad, aplicadoA }];
    });
  };

  const quitarProducto = (productoId) => setProductosSeleccionados(prev => prev.filter(p => p.productoId !== productoId));
  const quitarCombo = (comboId) => setCombosSeleccionados(prev => prev.filter(c => c.comboId !== comboId));
  const quitarAdicion = (ingredienteId) => setAdicionesSeleccionadas(prev => prev.filter(a => a.ingredienteId !== ingredienteId));

  const obtenerInfoProducto = (id) => productosDisponibles.find(p => p.id === id);
  const obtenerInfoCombo = (id) => combosDisponibles.find(c => c.id === id);
  const obtenerInfoIngrediente = (id) => ingredientesAdicionables.find(i => i.id === id);

  const subtotales = useMemo(() => {
    const totalProductos = productosSeleccionados.reduce((total, item) => {
      const producto = obtenerInfoProducto(item.productoId);
      return total + (producto?.precio || 0) * item.cantidad;
    }, 0);
    const totalCombos = combosSeleccionados.reduce((total, item) => {
      const combo = obtenerInfoCombo(item.comboId);
      return total + (combo?.precio || 0) * item.cantidad;
    }, 0);
    const totalAdiciones = adicionesSeleccionadas.reduce((total, item) => {
      const ingrediente = obtenerInfoIngrediente(item.ingredienteId);
      return total + (ingrediente?.precioAdicion || 0) * item.cantidad;
    }, 0);
    const subtotalP1 = cantidadP1 * 500;
    const subtotalC1 = cantidadC1 * 500;
    const totalDesechables = subtotalP1 + subtotalC1;
    const totalDomicilio = domicilio ? Number(costoDomicilio || 0) : 0;
    const totalGeneral = totalProductos + totalCombos + totalAdiciones + totalDesechables + totalDomicilio;
    return { totalProductos, totalCombos, totalAdiciones, subtotalP1, subtotalC1, totalDesechables, totalDomicilio, totalGeneral };
  }, [productosSeleccionados, combosSeleccionados, adicionesSeleccionadas, cantidadP1, cantidadC1, domicilio, costoDomicilio]);

  const cambiarTab = (nuevo) => setActiveTab(nuevo);

  const guardarCambios = async () => {
    if (cantidadP1 > stockDesechables.P1) {
      message.error(`No hay suficiente stock de P1. Disponible: ${stockDesechables.P1}`);
      return;
    }
    if (cantidadC1 > stockDesechables.C1) {
      message.error(`No hay suficiente stock de C1. Disponible: ${stockDesechables.C1}`);
      return;
    }

    const pedidoDTO = {
      productos: productosSeleccionados.filter(p => p.cantidad > 0).map(p => ({ productoId: p.productoId, cantidad: p.cantidad })),
      combos: combosSeleccionados.filter(c => c.cantidad > 0).map(c => ({ comboId: c.comboId, cantidad: c.cantidad })),
      adiciones: adicionesSeleccionadas.filter(a => a.cantidad > 0).map(a => ({ 
        ingredienteId: a.ingredienteId, 
        cantidad: a.cantidad, 
        aplicadoA: a.aplicadoA || '' 
      })),
      detalles,
      cantidadP1,
      cantidadC1,
      domicilio,
      costoDomicilio: domicilio ? Number(costoDomicilio || 0) : 0,
      estado // Mantener el estado actual del pedido
    };

    try {
      await api.put(`/api/pedidos/${id}/productos`, pedidoDTO);
      message.success('Pedido actualizado correctamente');
      navigate('/pedidos-mobile');
    } catch (error) {
      if (error.response?.data?.detalles) {
        const mensajeError = error.response.data.detalles.join('\n');
        message.error(`Error de stock:\n${mensajeError}`);
      } else if (error.response?.data?.message) {
        message.error(`Error: ${error.response.data.message}`);
      } else {
        message.error('Error desconocido al actualizar el pedido');
      }
    }
  };

  const disabledGuardar = (
    productosSeleccionados.length === 0 &&
    combosSeleccionados.length === 0 &&
    adicionesSeleccionadas.length === 0 &&
    cantidadP1 === 0 &&
    cantidadC1 === 0
  );

  if (loading) {
    return <div className="pedido-form-container">Cargando pedido...</div>;
  }

  return (
    <div className="pedido-form-container">
      <div className="pedido-header">
        <h5>Editar Pedido #{id}</h5>
        <Badge 
          count={estado} 
          style={{ 
            backgroundColor: estado === 'PENDIENTE' ? '#faad14' : 
                           estado === 'ENTREGADO' ? '#52c41a' : '#f5222d' 
          }} 
        />
      </div>

      <div className="tabs-container">
        <Button type={activeTab === 'productos' ? 'primary' : 'default'} onClick={() => cambiarTab('productos')}>Productos</Button>
        <Button type={activeTab === 'combos' ? 'primary' : 'default'} onClick={() => cambiarTab('combos')}>Combos</Button>
        <Button type={activeTab === 'adiciones' ? 'primary' : 'default'} onClick={() => cambiarTab('adiciones')}>Adiciones</Button>
      </div>

      {activeTab === 'productos' && (
        <div className="section-container">
          <Input
            placeholder="Buscar productos..."
            prefix={<SearchOutlined />}
            value={busquedaProducto}
            onChange={(e) => setBusquedaProducto(e.target.value)}
            size="large"
            className="search-input"
          />
          <div className="items-list">
            {productosFiltrados.map((producto) => {
              const seleccionado = productosSeleccionados.find(p => p.productoId === producto.id);
              const cantidad = seleccionado?.cantidad || 0;
              return (
                <div key={producto.id} className={`item-card ${cantidad > 0 ? 'selected' : ''}`}>
                  <div className="item-header">
                    <div className="item-info">
                      <div className="item-name">{producto.nombre}</div>
                      <div className="item-type">{producto.tipo}</div>
                    </div>
                    <Badge count={cantidad} className="quantity-badge" />
                  </div>
                  <div className="item-footer">
                    <div className="item-price">
                      <NumericFormat value={producto.precio} displayType="text" thousandSeparator="," prefix="$" />
                    </div>
                    <div className="quantity-controls">
                      <Button shape="circle" size="small" icon={<MinusOutlined />} onClick={() => actualizarCantidadProducto(producto.id, cantidad - 1)} disabled={cantidad === 0} />
                      <InputNumber min={0} value={cantidad} onChange={(v) => actualizarCantidadProducto(producto.id, Number(v || 0))} size="small" />
                      <Button type="primary" shape="circle" size="small" icon={<PlusOutlined />} onClick={() => actualizarCantidadProducto(producto.id, cantidad + 1)} />
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {activeTab === 'combos' && (
        <div className="section-container">
          <Input
            placeholder="Buscar combos..."
            prefix={<SearchOutlined />}
            value={busquedaCombo}
            onChange={(e) => setBusquedaCombo(e.target.value)}
            size="large"
            className="search-input"
          />
          <div className="items-list">
            {combosFiltrados.map((combo) => {
              const seleccionado = combosSeleccionados.find(c => c.comboId === combo.id);
              const cantidad = seleccionado?.cantidad || 0;
              return (
                <div key={combo.id} className={`item-card combo ${cantidad > 0 ? 'selected' : ''}`}>
                  <div className="item-header">
                    <div className="item-name">{combo.nombre}</div>
                    <Badge count={cantidad} className="quantity-badge" />
                  </div>
                  <div className="item-footer">
                    <div className="item-price">
                      <NumericFormat value={combo.precio} displayType="text" thousandSeparator="," prefix="$" />
                    </div>
                    <div className="quantity-controls">
                      <Button shape="circle" size="small" icon={<MinusOutlined />} onClick={() => actualizarCantidadCombo(combo.id, cantidad - 1)} disabled={cantidad === 0} />
                      <InputNumber min={0} value={cantidad} onChange={(v) => actualizarCantidadCombo(combo.id, Number(v || 0))} size="small" />
                      <Button type="primary" shape="circle" size="small" icon={<PlusOutlined />} onClick={() => actualizarCantidadCombo(combo.id, cantidad + 1)} />
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {activeTab === 'adiciones' && (
        <div className="section-container">
          <Input
            placeholder="Buscar adiciones..."
            prefix={<SearchOutlined />}
            value={busquedaAdicion}
            onChange={(e) => setBusquedaAdicion(e.target.value)}
            size="large"
            className="search-input"
          />
          <div className="items-list">
            {adicionablesFiltrados.map((ingrediente) => {
              const seleccionado = adicionesSeleccionadas.find(a => a.ingredienteId === ingrediente.id);
              const cantidad = seleccionado?.cantidad || 0;
              const aplicadoA = seleccionado?.aplicadoA || '';
              return (
                <div key={ingrediente.id} className={`item-card addition ${cantidad > 0 ? 'selected' : ''}`}>
                  <div className="item-header">
                    <div className="item-name">{ingrediente.nombre}</div>
                    <Badge count={cantidad} className="quantity-badge" />
                  </div>
                  <div className="addition-target">
                    <Input
                      size="small"
                      placeholder="Aplicado a (ej: Hamburguesa 1)"
                      value={aplicadoA}
                      onChange={(e) => actualizarCantidadAdicion(ingrediente.id, cantidad, e.target.value)}
                    />
                  </div>
                  <div className="item-footer">
                    <div className="item-price">
                      <NumericFormat value={ingrediente.precioAdicion} displayType="text" thousandSeparator="," prefix="$" />
                    </div>
                    <div className="quantity-controls">
                      <Button shape="circle" size="small" icon={<MinusOutlined />} onClick={() => actualizarCantidadAdicion(ingrediente.id, cantidad - 1, aplicadoA)} disabled={cantidad === 0} />
                      <InputNumber min={0} value={cantidad} onChange={(v) => actualizarCantidadAdicion(ingrediente.id, Number(v || 0), aplicadoA)} size="small" />
                      <Button type="primary" shape="circle" size="small" icon={<PlusOutlined />} onClick={() => actualizarCantidadAdicion(ingrediente.id, cantidad + 1, aplicadoA)} />
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      <div className="card-container">
        <div className="delivery-section">
          <div className="delivery-header">
            <HomeOutlined />
            <span>Domicilio</span>
          </div>
          <Switch checked={domicilio} onChange={setDomicilio} checkedChildren="Sí" unCheckedChildren="No" />
        </div>
        {domicilio && (
          <div className="delivery-cost">
            <span>Costo:</span>
            <InputNumber
              min={0}
              value={costoDomicilio}
              onChange={setCostoDomicilio}
              formatter={value => `$ ${value}`.replace(/\B(?=(\d{3})+(?!\d))/g, ',')}
              parser={value => value.replace(/\$\s?|(,*)/g, '')}
            />
          </div>
        )}
      </div>

      <div className="card-container">
        <div className="section-title">Desechables</div>
        <div className="disposable-item">
          <div className="disposable-info">
            <span>P1</span>
            <small>(Stock: {stockDesechables.P1})</small>
          </div>
          <InputNumber min={0} value={cantidadP1} onChange={setCantidadP1} />
        </div>
        <div className="disposable-item">
          <div className="disposable-info">
            <span>C1</span>
            <small>(Stock: {stockDesechables.C1})</small>
          </div>
          <InputNumber min={0} value={cantidadC1} onChange={setCantidadC1} />
        </div>
      </div>

      <div className="card-container">
        <div className="section-title">Notas</div>
        <textarea
          className="notes-textarea"
          placeholder="Especificaciones o instrucciones..."
          value={detalles}
          onChange={(e) => setDetalles(e.target.value)}
        />
      </div>

      <div className="card-container">
        <div className="section-title">Resumen del Pedido</div>
        
        <Collapse 
          bordered={false} 
          expandIcon={({ isActive }) => isActive ? <CaretDownOutlined /> : <CaretRightOutlined />}
          className="summary-collapse"
        >
          {/* Panel de Productos */}
          {productosSeleccionados.length > 0 && (
            <Collapse.Panel 
              header={
                <div className="summary-header">
                  <span>Productos</span>
                  <span className="summary-total">
                    <NumericFormat value={subtotales.totalProductos} displayType="text" thousandSeparator="," prefix="$" />
                  </span>
                </div>
              } 
              key="1"
              className="summary-panel"
            >
              {productosSeleccionados.map((item) => {
                const producto = obtenerInfoProducto(item.productoId);
                return (
                  <div key={item.productoId} className="detail-item">
                    <div className="detail-info">
                      <span className="detail-name">{producto?.nombre || 'Producto no disponible'}</span>
                      <span className="detail-type">{producto?.tipo || ''}</span>
                    </div>
                    <div className="detail-quantity">x{item.cantidad}</div>
                    <div className="detail-price">
                      <NumericFormat value={(producto?.precio || 0) * item.cantidad} displayType="text" thousandSeparator="," prefix="$" />
                      <div className="detail-unit-price">({producto?.precio || 0} c/u)</div>
                    </div>
                  </div>
                );
              })}
            </Collapse.Panel>
          )}
          
          {/* Panel de Combos */}
          {combosSeleccionados.length > 0 && (
            <Collapse.Panel 
              header={
                <div className="summary-header">
                  <span>Combos</span>
                  <span className="summary-total">
                    <NumericFormat value={subtotales.totalCombos} displayType="text" thousandSeparator="," prefix="$" />
                  </span>
                </div>
              } 
              key="2"
              className="summary-panel"
            >
              {combosSeleccionados.map((item) => {
                const combo = obtenerInfoCombo(item.comboId);
                return (
                  <div key={item.comboId} className="detail-item">
                    <div className="detail-info">
                      <span className="detail-name">{combo?.nombre || 'Combo no disponible'}</span>
                    </div>
                    <div className="detail-quantity">x{item.cantidad}</div>
                    <div className="detail-price">
                      <NumericFormat value={(combo?.precio || 0) * item.cantidad} displayType="text" thousandSeparator="," prefix="$" />
                      <div className="detail-unit-price">({combo?.precio || 0} c/u)</div>
                    </div>
                  </div>
                );
              })}
            </Collapse.Panel>
          )}
          
          {/* Panel de Adiciones */}
          {adicionesSeleccionadas.length > 0 && (
            <Collapse.Panel 
              header={
                <div className="summary-header">
                  <span>Adiciones</span>
                  <span className="summary-total">
                    <NumericFormat value={subtotales.totalAdiciones} displayType="text" thousandSeparator="," prefix="$" />
                  </span>
                </div>
              } 
              key="3"
              className="summary-panel"
            >
              {adicionesSeleccionadas.map((item) => {
                const ingrediente = obtenerInfoIngrediente(item.ingredienteId);
                return (
                  <div key={item.ingredienteId} className="detail-item">
                    <div className="detail-info">
                      <span className="detail-name">{ingrediente?.nombre || 'Adición no disponible'}</span>
                      {item.aplicadoA && <span className="detail-applied-to">Aplicado a: {item.aplicadoA}</span>}
                    </div>
                    <div className="detail-quantity">x{item.cantidad}</div>
                    <div className="detail-price">
                      <NumericFormat value={(ingrediente?.precioAdicion || 0) * item.cantidad} displayType="text" thousandSeparator="," prefix="$" />
                      <div className="detail-unit-price">({ingrediente?.precioAdicion || 0} c/u)</div>
                    </div>
                  </div>
                );
              })}
            </Collapse.Panel>
          )}
          
          {/* Panel de Desechables */}
          {(cantidadP1 > 0 || cantidadC1 > 0) && (
            <Collapse.Panel 
              header={
                <div className="summary-header">
                  <span>Desechables</span>
                  <span className="summary-total">
                    <NumericFormat value={subtotales.totalDesechables} displayType="text" thousandSeparator="," prefix="$" />
                  </span>
                </div>
              } 
              key="4"
              className="summary-panel"
            >
              {cantidadP1 > 0 && (
                <div className="detail-item">
                  <div className="detail-info">
                    <span className="detail-name">P1 (Platos)</span>
                    <span className="detail-stock">Stock: {stockDesechables.P1}</span>
                  </div>
                  <div className="detail-quantity">x{cantidadP1}</div>
                  <div className="detail-price">
                    <NumericFormat value={500 * cantidadP1} displayType="text" thousandSeparator="," prefix="$" />
                    <div className="detail-unit-price">(500 c/u)</div>
                  </div>
                </div>
              )}
              {cantidadC1 > 0 && (
                <div className="detail-item">
                  <div className="detail-info">
                    <span className="detail-name">C1 (Cubiertos)</span>
                    <span className="detail-stock">Stock: {stockDesechables.C1}</span>
                  </div>
                  <div className="detail-quantity">x{cantidadC1}</div>
                  <div className="detail-price">
                    <NumericFormat value={500 * cantidadC1} displayType="text" thousandSeparator="," prefix="$" />
                    <div className="detail-unit-price">(500 c/u)</div>
                  </div>
                </div>
              )}
            </Collapse.Panel>
          )}
          
          {/* Panel de Domicilio */}
          {domicilio && (
            <Collapse.Panel 
              header={
                <div className="summary-header">
                  <span>Domicilio</span>
                  <span className="summary-total">
                    <NumericFormat value={subtotales.totalDomicilio} displayType="text" thousandSeparator="," prefix="$" />
                  </span>
                </div>
              } 
              key="5"
              className="summary-panel"
            >
              <div className="detail-item">
                <div className="detail-info">
                  <span className="detail-name">Costo de envío</span>
                </div>
                <div className="detail-price">
                  <NumericFormat value={costoDomicilio} displayType="text" thousandSeparator="," prefix="$" />
                </div>
              </div>
            </Collapse.Panel>
          )}
        </Collapse>
        
        <div className="summary-grand-total">
          <span>Total General</span>
          <span>
            <NumericFormat value={subtotales.totalGeneral} displayType="text" thousandSeparator="," prefix="$" />
          </span>
        </div>
      </div>

      <div className="actions-container">
        <Button danger icon={<DeleteOutlined />} onClick={() => navigate('/pedidos-mobile')} className="action-button">Cancelar</Button>
        <Button type="primary" icon={<PlusOutlined />} onClick={guardarCambios} disabled={disabledGuardar} className="action-button">Guardar Cambios</Button>
      </div>
    </div>
  );
};

export default PedidoEdit;