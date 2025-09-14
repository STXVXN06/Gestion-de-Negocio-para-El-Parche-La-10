import React, { useEffect, useMemo, useRef, useState } from 'react';
import { Input, Button, Badge, InputNumber, Switch, Collapse } from 'antd';
import { NumericFormat } from 'react-number-format';
import { SearchOutlined, PlusOutlined, MinusOutlined, DeleteOutlined, HomeOutlined, CaretDownOutlined, CaretRightOutlined } from '@ant-design/icons';
import { useNavigate, useLocation } from 'react-router-dom';
import api from '../../api';
import './PedidoForm.css';
import {
  guardarPedidoEnCurso,
  obtenerPedidoEnCurso,
  limpiarPedidoEnCurso
} from '../../utils/PedidoStorage';

const PedidoForm = ({ onSave, onCancel }) => {
  const navigate = useNavigate();
  const location = useLocation();

  // Estados
  const [productosDisponibles, setProductosDisponibles] = useState([]);
  const [combosDisponibles, setCombosDisponibles] = useState([]);
  const [ingredientesAdicionables, setIngredientesAdicionables] = useState([]);
  const [productosSeleccionados, setProductosSeleccionados] = useState([]);
  const [combosSeleccionados, setCombosSeleccionados] = useState([]);
  const [adicionesSeleccionadas, setAdicionesSeleccionadas] = useState([]);
  const [detalles, setDetalles] = useState('');
  const [domicilio, setDomicilio] = useState(false);
  const [costoDomicilio, setCostoDomicilio] = useState(2000);
  const [cantidadP1, setCantidadP1] = useState(0);
  const [cantidadC1, setCantidadC1] = useState(0);
  const [stockDesechables, setStockDesechables] = useState({ P1: 0, C1: 0 });
  const [busquedaProducto, setBusquedaProducto] = useState('');
  const [busquedaCombo, setBusquedaCombo] = useState('');
  const [busquedaAdicion, setBusquedaAdicion] = useState('');
  const [activeTab, setActiveTab] = useState('productos');
  const [estadoInicializado, setEstadoInicializado] = useState(false);

  // Usar useRef para controlar la inicialización
  const initializedRef = useRef(false);

  // Efecto para cargar datos iniciales
  useEffect(() => {
    const cargarDatos = async () => {
      try {
        const [productosResponse, combosResponse, ingredientesResponse] = await Promise.all([
          api.get('/api/productos'),
          api.get('/api/combos'),
          api.get('/api/ingredientes')
        ]);

        setProductosDisponibles((productosResponse.data || []).filter(p => p.activo));
        setCombosDisponibles((combosResponse.data || []).filter(c => c.activo));

        const adicionables = (ingredientesResponse.data || []).filter(i => i.adicionable);
        setIngredientesAdicionables(adicionables);

        const p1 = (ingredientesResponse.data || []).find(i => i.nombre === 'P1');
        const c1 = (ingredientesResponse.data || []).find(i => i.nombre === 'C1');
        setStockDesechables({
          P1: p1 ? p1.cantidadActual : 0,
          C1: c1 ? c1.cantidadActual : 0
        });
      } catch (error) {
        console.error('Error cargando datos móviles:', error);
      }
    };

    cargarDatos();
  }, []);

  // Efecto para inicializar el estado del pedido (solo una vez)
  useEffect(() => {
    if (!initializedRef.current) {
      console.log("Inicializando estado del pedido");

      // Verificar si debemos limpiar el estado (nuevo pedido)
      if (location.state?.nuevoPedido) {
        console.log("Iniciando NUEVO pedido");
        limpiarPedidoEnCurso();
      } else {
        // Cargar estado existente
        const estadoExistente = obtenerPedidoEnCurso();
        if (estadoExistente) {
          console.log("Cargando pedido EXISTENTE:", estadoExistente);
          setProductosSeleccionados(estadoExistente.productosSeleccionados || []);
          setCombosSeleccionados(estadoExistente.combosSeleccionados || []);
          setAdicionesSeleccionadas(estadoExistente.adicionesSeleccionadas || []);
          setDetalles(estadoExistente.detalles || '');
          setDomicilio(estadoExistente.domicilio || false);
          setCostoDomicilio(estadoExistente.costoDomicilio || 2000);
          setCantidadP1(estadoExistente.cantidadP1 || 0);
          setCantidadC1(estadoExistente.cantidadC1 || 0);
        }
      }

      initializedRef.current = true;
      setEstadoInicializado(true);
    }
  }, [location.state]);

  // Efecto para guardar el estado cuando cambie
  useEffect(() => {
    if (estadoInicializado) {
      const estadoPedido = {
        productosSeleccionados,
        combosSeleccionados,
        adicionesSeleccionadas,
        detalles,
        domicilio,
        costoDomicilio,
        cantidadP1,
        cantidadC1
      };

      guardarPedidoEnCurso(estadoPedido);

      // Configurar el evento beforeunload para guardar al cerrar/recargar
      const handleBeforeUnload = () => {
        guardarPedidoEnCurso(estadoPedido);
      };

      window.addEventListener('beforeunload', handleBeforeUnload);

      return () => {
        window.removeEventListener('beforeunload', handleBeforeUnload);
      };
    }
  }, [
    productosSeleccionados,
    combosSeleccionados,
    adicionesSeleccionadas,
    detalles,
    domicilio,
    costoDomicilio,
    cantidadP1,
    cantidadC1,
    estadoInicializado
  ]);

  useEffect(() => {
    if (estadoInicializado && productosDisponibles.length > 0) {
      setProductosSeleccionados(prev =>
        prev.filter(item => productosDisponibles.some(p => p.id === item.productoId))
      );
    }
  }, [productosDisponibles, estadoInicializado]);

  // Para combos
  useEffect(() => {
    if (estadoInicializado && combosDisponibles.length > 0) {
      setCombosSeleccionados(prev =>
        prev.filter(item => combosDisponibles.some(c => c.id === item.comboId))
      );
    }
  }, [combosDisponibles, estadoInicializado]);

  // Para adiciones
  useEffect(() => {
    if (estadoInicializado && ingredientesAdicionables.length > 0) {
      setAdicionesSeleccionadas(prev =>
        prev.filter(item => ingredientesAdicionables.some(i => i.id === item.ingredienteId))
      );
    }
  }, [ingredientesAdicionables, estadoInicializado]);

  // Funciones para manejar las cantidades de productos, combos y adiciones
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
  }, [productosSeleccionados, combosSeleccionados, adicionesSeleccionadas, cantidadP1, cantidadC1, domicilio, costoDomicilio, productosDisponibles, combosDisponibles, ingredientesAdicionables]);

  const cambiarTab = (nuevo) => setActiveTab(nuevo);

  // Función para confirmar el pedido
  const confirmarPedido = async () => {
    if (cantidadP1 > stockDesechables.P1) {
      alert(`No hay suficiente stock de P1. Disponible: ${stockDesechables.P1}`);
      return;
    }
    if (cantidadC1 > stockDesechables.C1) {
      alert(`No hay suficiente stock of C1. Disponible: ${stockDesechables.C1}`);
      return;
    }

    const pedidoDTO = {
      productos: productosSeleccionados.filter(p => p.cantidad > 0).map(p => ({ productoId: p.productoId, cantidad: p.cantidad })),
      combos: combosSeleccionados.filter(c => c.cantidad > 0).map(c => ({ comboId: c.comboId, cantidad: c.cantidad })),
      adiciones: adicionesSeleccionadas.filter(a => a.cantidad > 0).map(a => ({ ingredienteId: a.ingredienteId, cantidad: a.cantidad, aplicadoA: a.aplicadoA || '' })),
      detalles,
      cantidadP1,
      cantidadC1,
      domicilio,
      costoDomicilio: domicilio ? Number(costoDomicilio || 0) : 0
    };

    try {
      await api.post('/api/pedidos', pedidoDTO);
      limpiarPedidoEnCurso();
      if (typeof onSave === 'function') onSave(pedidoDTO);
      navigate('/pedidos-mobile');
    } catch (error) {
      if (error.response?.data?.detalles) {
        const mensajeError = error.response.data.detalles.join('\n');
        alert(`Error de stock:\n${mensajeError}`);
      } else if (error.response?.data?.message) {
        alert(`Error: ${error.response.data.message}`);
      } else {
        alert('Error desconocido al crear el pedido');
      }
    }
  };

  // Función para cancelar el pedido
  const handleCancel = () => {
    limpiarPedidoEnCurso();
    if (typeof onCancel === 'function') onCancel();
    navigate('/pedidos-mobile');
  };

  const disabledConfirmar = (
    productosSeleccionados.length === 0 &&
    combosSeleccionados.length === 0 &&
    adicionesSeleccionadas.length === 0 &&
    cantidadP1 === 0 &&
    cantidadC1 === 0
  );

  // Filtrado de elementos
  const productosFiltrados = useMemo(() => (
    productosDisponibles.filter(p => p.nombre.toLowerCase().includes(busquedaProducto.toLowerCase()))
  ), [productosDisponibles, busquedaProducto]);

  const combosFiltrados = useMemo(() => (
    combosDisponibles.filter(c => c.nombre.toLowerCase().includes(busquedaCombo.toLowerCase()))
  ), [combosDisponibles, busquedaCombo]);

  const adicionablesFiltrados = useMemo(() => (
    ingredientesAdicionables.filter(a => a.nombre.toLowerCase().includes(busquedaAdicion.toLowerCase()))
  ), [ingredientesAdicionables, busquedaAdicion]);


  return (
    <div className="pedido-form-container">
      <div className="pedido-header">
        <h5>Nuevo Pedido</h5>
        <small className="text-muted">Modo empleado (móvil)</small>
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
                if (!producto) return null; // No renderizar si no existe
                return (
                  <div key={item.productoId} className="detail-item">
                    <div className="detail-info">
                      <span className="detail-name">{producto.nombre}</span>
                      <span className="detail-type">{producto.tipo}</span>
                    </div>
                    <div className="detail-quantity">x{item.cantidad}</div>
                    <div className="detail-price">
                      <NumericFormat value={producto.precio * item.cantidad} displayType="text" thousandSeparator="," prefix="$" />
                      <div className="detail-unit-price">({producto.precio} c/u)</div>
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
                if (!combo) return null; // No renderizar si no existe
                return (
                  <div key={item.comboId} className="detail-item">
                    <div className="detail-info">
                      <span className="detail-name">{combo.nombre}</span>
                    </div>
                    <div className="detail-quantity">x{item.cantidad}</div>
                    <div className="detail-price">
                      <NumericFormat value={combo.precio * item.cantidad} displayType="text" thousandSeparator="," prefix="$" />
                      <div className="detail-unit-price">({combo.precio} c/u)</div>
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
                if (!ingrediente) return null; // No renderizar si no existe
                return (
                  <div key={item.ingredienteId} className="detail-item">
                    <div className="detail-info">
                      <span className="detail-name">{ingrediente.nombre}</span>
                      {item.aplicadoA && <span className="detail-applied-to">Aplicado a: {item.aplicadoA}</span>}
                    </div>
                    <div className="detail-quantity">x{item.cantidad}</div>
                    <div className="detail-price">
                      <NumericFormat value={ingrediente.precioAdicion * item.cantidad} displayType="text" thousandSeparator="," prefix="$" />
                      <div className="detail-unit-price">({ingrediente.precioAdicion} c/u)</div>
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
        <Button danger icon={<DeleteOutlined />} onClick={handleCancel} className="action-button">Cancelar</Button>
        <Button type="primary" icon={<PlusOutlined />} onClick={confirmarPedido} disabled={disabledConfirmar} className="action-button">Confirmar</Button>
      </div>
    </div>
  );
};

export default PedidoForm;