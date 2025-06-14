import axios from 'axios';
import React, { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { NumericFormat } from 'react-number-format';
import { Tabs, Input, Button, Card, Badge, Alert, List, Row, Col, InputNumber, Switch } from 'antd';
import { SearchOutlined, PlusOutlined, MinusOutlined, DeleteOutlined, HomeOutlined  } from '@ant-design/icons';
import './AgregarPedido.css';

const { TabPane } = Tabs;

export default function EditarPedido() {
    const { id } = useParams();
    const navigate = useNavigate();
    const [pedido, setPedido] = useState({
        detalles: '',
        productos: [],
        combos: [],
        estado: 'PENDIENTE',
        cantidadP1: 0,
        cantidadC1: 0,
        domicilio: false,
        costoDomicilio: 2000
    });

    const [productosDisponibles, setProductosDisponibles] = useState([]);
    const [combosDisponibles, setCombosDisponibles] = useState([]);
    const [busquedaProducto, setBusquedaProducto] = useState('');
    const [busquedaCombo, setBusquedaCombo] = useState('');
    const [activeTab, setActiveTab] = useState('1');
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState({ tipo: '', mensajes: [] });
    const [isSaving, setIsSaving] = useState(false);
    const [stockDesechables, setStockDesechables] = useState({ P1: 0, C1: 0 });

    useEffect(() => {
        cargarDatosIniciales();
        const cargarStockDesechables = async () => {
            try {
                const res = await axios.get('http://localhost:9090/api/ingredientes');
                const ingredientes = res.data;

                setStockDesechables({
                    P1: ingredientes.find(i => i.nombre === 'P1')?.cantidadActual || 0,
                    C1: ingredientes.find(i => i.nombre === 'C1')?.cantidadActual || 0
                });
            } catch (error) {
                console.error("Error cargando desechables", error);
            }
        };

        cargarStockDesechables();

    }, []);

    const cargarDatosIniciales = async () => {
        try {
            setLoading(true);
            const [pedidoRes, productosRes, combosRes, ingredientesRes] = await Promise.all([
                axios.get(`http://localhost:9090/api/pedidos/${id}`),
                axios.get('http://localhost:9090/api/productos'),
                axios.get('http://localhost:9090/api/combos'),
                axios.get('http://localhost:9090/api/ingredientes')
            ]);

            const productosEnPedido = pedidoRes.data.productos?.map(p => ({
                productoId: p.id || p.producto?.id,
                cantidad: p.cantidad
            })) || [];

            const combosEnPedido = pedidoRes.data.combos?.map(c => ({
                comboId: c.id,
                cantidad: c.cantidad
            })) || [];

            // Obtener stock de desechables
            const p1 = ingredientesRes.data.find(i => i.nombre === 'P1');
            const c1 = ingredientesRes.data.find(i => i.nombre === 'C1');

            setStockDesechables({
                P1: p1 ? p1.cantidadActual : 0,
                C1: c1 ? c1.cantidadActual : 0
            });

            setPedido({
                ...pedidoRes.data,
                detalles: pedidoRes.data.detalles || '',
                productos: productosEnPedido,
                combos: combosEnPedido,
                cantidadP1: pedidoRes.data.cantidadP1 || 0,
                cantidadC1: pedidoRes.data.cantidadC1 || 0,
                domicilio: pedidoRes.data.domicilio || false,
                costoDomicilio: pedidoRes.data.costoDomicilio || 2000
            });

            setProductosDisponibles(productosRes.data.filter(p => p.activo));
            setCombosDisponibles(combosRes.data.filter(c => c.activo));
            setLoading(false);
        } catch (error) {
            setError({
                tipo: 'CARGA',
                mensajes: ['Error cargando datos del pedido']
            });
            console.error(error);
            setLoading(false);
        }
    };

    // Manejar cambios en las cantidades de productos
    const actualizarCantidadProducto = (productoId, nuevaCantidad) => {
        const cantidad = Math.max(nuevaCantidad, 0);

        setPedido(prev => {
            const nuevosProductos = [...prev.productos];
            const existe = nuevosProductos.find(p => p.productoId === productoId);

            if (existe) {
                if (cantidad === 0) {
                    // Eliminar si cantidad es 0
                    return {
                        ...prev,
                        productos: nuevosProductos.filter(p => p.productoId !== productoId)
                    };
                }
                // Actualizar cantidad
                return {
                    ...prev,
                    productos: nuevosProductos.map(p =>
                        p.productoId === productoId ? { ...p, cantidad } : p
                    )
                };
            }
            // Agregar nuevo producto
            return {
                ...prev,
                productos: [...nuevosProductos, { productoId, cantidad }]
            };
        });
    };

    // Manejar cambios en las cantidades de combos
    const actualizarCantidadCombo = (comboId, nuevaCantidad) => {
        const cantidad = Math.max(nuevaCantidad, 0);

        setPedido(prev => {
            const nuevosCombos = [...prev.combos];
            const existe = nuevosCombos.find(c => c.comboId === comboId);

            if (existe) {
                if (cantidad === 0) {
                    // Eliminar si cantidad es 0
                    return {
                        ...prev,
                        combos: nuevosCombos.filter(c => c.comboId !== comboId)
                    };
                }
                // Actualizar cantidad
                return {
                    ...prev,
                    combos: nuevosCombos.map(c =>
                        c.comboId === comboId ? { ...c, cantidad } : c
                    )
                };
            }
            // Agregar nuevo combo
            return {
                ...prev,
                combos: [...nuevosCombos, { comboId, cantidad }]
            };
        });
    };

    // Quitar un producto del pedido
    const quitarProducto = (productoId) => {
        setPedido(prev => ({
            ...prev,
            productos: prev.productos.filter(p => p.productoId !== productoId)
        }));
    };

    // Quitar un combo del pedido
    const quitarCombo = (comboId) => {
        setPedido(prev => ({
            ...prev,
            combos: prev.combos.filter(c => c.comboId !== comboId)
        }));
    };

    // Manejar cambios en los desechables
    const actualizarCantidadP1 = (nuevaCantidad) => {
        setPedido(prev => ({
            ...prev,
            cantidadP1: Math.max(nuevaCantidad, 0)
        }));
    };

    const actualizarCantidadC1 = (nuevaCantidad) => {
        setPedido(prev => ({
            ...prev,
            cantidadC1: Math.max(nuevaCantidad, 0)
        }));
    };

    // Enviar pedido actualizado al backend
    const handleGuardarCambios = async () => {
        setIsSaving(true);
        setError({ tipo: '', mensajes: [] });

        try {
            // Validaciones básicas
            if (pedido.productos.length === 0 && pedido.combos.length === 0 && pedido.cantidadP1 === 0 && pedido.cantidadC1 === 0) {
                setError({
                    tipo: 'VALIDACION',
                    mensajes: ['Debe agregar al menos un producto, combo o desechable al pedido']
                });
                return;
            }

            // Validar stock de desechables
            if (pedido.cantidadP1 > stockDesechables.P1) {
                setError({
                    tipo: 'STOCK_DESECHABLES',
                    mensajes: [`No hay suficiente stock de P1. Disponible: ${stockDesechables.P1}`]
                });
                return;
            }

            if (pedido.cantidadC1 > stockDesechables.C1) {
                setError({
                    tipo: 'STOCK_DESECHABLES',
                    mensajes: [`No hay suficiente stock de C1. Disponible: ${stockDesechables.C1}`]
                });
                return;
            }

            // Preparar payload
            const payload = {
                detalles: pedido.detalles,
                productos: pedido.productos.map(p => ({
                    productoId: p.productoId,
                    cantidad: p.cantidad
                })),
                combos: pedido.combos.map(c => ({
                    comboId: c.comboId,
                    cantidad: c.cantidad
                })),
                cantidadP1: pedido.cantidadP1,
                cantidadC1: pedido.cantidadC1,
                domicilio: pedido.domicilio,
                costoDomicilio: pedido.costoDomicilio
            };

            // Enviar actualización
            const { data } = await axios.put(
                `http://localhost:9090/api/pedidos/${id}/productos`,
                payload,
                { headers: { 'Content-Type': 'application/json' } }
            );

            if (data.tipo === "STOCK_INSUFICIENTE") {
                throw new Error(JSON.stringify(data));
            }

            navigate('/pedidos', { state: { success: 'Pedido actualizado correctamente' } });
        } catch (error) {
            if (error.response) {
                const { data, status } = error.response;

                if (status === 409 && data.tipo === "STOCK_INSUFICIENTE") {
                    setError({
                        tipo: 'STOCK',
                        mensajes: data.detalles
                    });
                } else {
                    setError({
                        tipo: 'GENERAL',
                        mensajes: [data.message || 'Error al guardar cambios']
                    });
                }
            } else if (error.message) {
                try {
                    const errorData = JSON.parse(error.message);
                    setError({
                        tipo: errorData.tipo,
                        mensajes: errorData.detalles
                    });
                } catch {
                    setError({
                        tipo: 'GENERAL',
                        mensajes: [error.message]
                    });
                }
            }
        } finally {
            setIsSaving(false);
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

    // Calcular total del pedido
    const calcularTotal = () => {
        const totalProductos = pedido.productos.reduce((total, item) => {
            const producto = obtenerInfoProducto(item.productoId);
            return total + (producto?.precio || 0) * item.cantidad;
        }, 0);

        const totalCombos = pedido.combos.reduce((total, item) => {
            const combo = obtenerInfoCombo(item.comboId);
            return total + (combo?.precio || 0) * item.cantidad;
        }, 0);

        // Agregar costo de desechables: P1 y C1 cuestan $500 cada uno
        const totalDesechables = (pedido.cantidadP1 + pedido.cantidadC1) * 500;
        const totalDomicilio = pedido.domicilio ? pedido.costoDomicilio : 0;
        return totalProductos + totalCombos + totalDesechables + totalDomicilio;
    };

    if (loading) return <div className="container mt-4">Cargando...</div>;

    return (
        <div className='container'>
            <div className='container text-center' style={{ margin: '30px' }}>
                <h1>Editar Pedido #{id}</h1>
                <p className="text-muted">Actualice productos, combos o detalles del pedido</p>
            </div>

            {error.mensajes.length > 0 && (
                <Alert
                    type={error.tipo === 'STOCK' ? 'warning' : 'error'}
                    className="mb-4"
                    message={
                        <List
                            size="small"
                            dataSource={error.mensajes}
                            renderItem={item => <List.Item>{item}</List.Item>}
                        />
                    }
                    closable
                    onClose={() => setError({ tipo: '', mensajes: [] })}
                />
            )}

            <Row gutter={[16, 16]}>
                <Col xs={24} md={16}>
                    <Tabs
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
                                {productosDisponibles
                                    .filter(p =>
                                        p.nombre.toLowerCase().includes(busquedaProducto.toLowerCase())
                                    )
                                    .map((producto) => {
                                        const seleccionado = pedido.productos.find(p => p.productoId === producto.id);
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
                                {combosDisponibles
                                    .filter(c =>
                                        c.nombre.toLowerCase().includes(busquedaCombo.toLowerCase())
                                    )
                                    .map((combo) => {
                                        const seleccionado = pedido.combos.find(c => c.comboId === combo.id);
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
                        <div className="d-flex justify-content-between align-items-center mb-3">
                            <Badge count={pedido.estado} style={{
                                backgroundColor:
                                    pedido.estado === 'PENDIENTE' ? '#faad14' :
                                        pedido.estado === 'ENTREGADO' ? '#52c41a' : '#f5222d'
                            }} />
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

                        {pedido.productos.length === 0 && pedido.combos.length === 0 && pedido.cantidadP1 === 0 && pedido.cantidadC1 === 0 ? (
                            <div className="empty-cart">
                                <i className="fas fa-shopping-cart fa-3x"></i>
                                <p>No hay productos o combos en este pedido</p>
                            </div>
                        ) : (
                            <div className="resumen-content">
                                {/* Productos seleccionados */}
                                {pedido.productos.length > 0 && (
                                    <div className="seccion-resumen">
                                        <h5>Productos</h5>
                                        <ul className="lista-resumen">
                                            {pedido.productos.map(item => {
                                                const producto = obtenerInfoProducto(item.productoId);
                                                return (
                                                    <li key={item.productoId} className="item-resumen">
                                                        <div className="item-info">
                                                            <span className="item-nombre">
                                                                {producto?.nombre || 'Producto eliminado'}
                                                            </span>
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
                                {pedido.combos.length > 0 && (
                                    <div className="seccion-resumen">
                                        <h5>Combos</h5>
                                        <ul className="lista-resumen">
                                            {pedido.combos.map(item => {
                                                const combo = obtenerInfoCombo(item.comboId);
                                                return (
                                                    <li key={item.comboId} className="item-resumen">
                                                        <div className="item-info">
                                                            <span className="item-nombre">
                                                                {combo?.nombre || 'Combo eliminado'}
                                                            </span>
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

                                {/* Desechables */}
                                <div className="seccion-resumen mt-3">
                                    <h5>Desechables</h5>
                                    <div className="d-flex justify-content-between align-items-center mb-2">
                                        <div>
                                            <span>P1</span>
                                            <small className="text-muted ms-2">(Stock: {stockDesechables.P1})</small>
                                        </div>
                                        <InputNumber
                                            min={0}
                                            max={stockDesechables.P1}
                                            value={pedido.cantidadP1}
                                            onChange={actualizarCantidadP1}
                                            style={{ width: '80px' }}
                                        />
                                    </div>

                                    <div className="d-flex justify-content-between align-items-center mb-2">
                                        <div>
                                            <span>C1</span>
                                            <small className="text-muted ms-2">(Stock: {stockDesechables.C1})</small>
                                        </div>
                                        <InputNumber
                                            min={0}
                                            max={stockDesechables.C1}
                                            value={pedido.cantidadC1}
                                            onChange={actualizarCantidadC1}
                                            style={{ width: '80px' }}
                                        />
                                    </div>
                                </div>

                                <div className="seccion-resumen mt-3">
                                    <div className="d-flex justify-content-between align-items-center mb-2">
                                        <div className="d-flex align-items-center">
                                            <HomeOutlined style={{ marginRight: '8px', color: '#1890ff' }} />
                                            <span>Domicilio</span>
                                        </div>
                                        <Switch
                                            checked={pedido.domicilio}
                                            onChange={checked => setPedido(prev => ({
                                                ...prev,
                                                domicilio: checked
                                            }))}
                                            checkedChildren="Sí"
                                            unCheckedChildren="No"
                                        />
                                    </div>

                                    {pedido.domicilio && (
                                        <div className="d-flex justify-content-between align-items-center mt-2">
                                            <span>Costo de domicilio:</span>
                                            <InputNumber
                                                min={0}
                                                value={pedido.costoDomicilio}
                                                onChange={value => setPedido(prev => ({
                                                    ...prev,
                                                    costoDomicilio: value
                                                }))}
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
                                        value={pedido.detalles}
                                        onChange={(e) => setPedido(prev => ({ ...prev, detalles: e.target.value }))}
                                        placeholder="Especificaciones especiales, instrucciones de entrega, etc."
                                        rows="3"
                                    />
                                </div>

                                {/* Botones */}
                                <div className="botones-resumen mt-3">
                                    <Button
                                        type="primary"
                                        size="large"
                                        onClick={handleGuardarCambios}
                                        loading={isSaving}
                                        disabled={pedido.productos.length === 0 && pedido.combos.length === 0 && pedido.cantidadP1 === 0 && pedido.cantidadC1 === 0}
                                        block
                                    >
                                        {isSaving ? 'Guardando...' : 'Guardar Cambios'}
                                    </Button>
                                    <Button
                                        type="default"
                                        size="large"
                                        block
                                        onClick={() => navigate('/pedidos')}
                                        className="mt-2"
                                    >
                                        Cancelar
                                    </Button>
                                </div>
                            </div>
                        )}
                    </Card>
                </Col>
            </Row>
        </div>
    );
}