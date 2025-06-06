import axios from 'axios';
import React, { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { NumericFormat } from 'react-number-format';
import { Tabs, Input, Button, Card, Badge, Alert, List } from 'antd';
import { SearchOutlined, PlusOutlined, MinusOutlined, DeleteOutlined } from '@ant-design/icons';
import './AgregarPedido.css'; // Mismo CSS que AgregarPedido

const { TabPane } = Tabs;

export default function EditarPedido() {
    const { id } = useParams();
    const navigate = useNavigate();
    const [pedido, setPedido] = useState({
        detalles: '',
        productos: [],
        combos: [],
        estado: 'PENDIENTE'
    });

    const [productosDisponibles, setProductosDisponibles] = useState([]);
    const [combosDisponibles, setCombosDisponibles] = useState([]);
    const [busquedaProducto, setBusquedaProducto] = useState('');
    const [busquedaCombo, setBusquedaCombo] = useState('');
    const [activeTab, setActiveTab] = useState('1');
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState({ tipo: '', mensajes: [] });
    const [isSaving, setIsSaving] = useState(false);

    useEffect(() => {
        cargarDatosIniciales();
    }, []);

    const cargarDatosIniciales = async () => {
        try {
            setLoading(true);
            const [pedidoRes, productosRes, combosRes] = await Promise.all([
                axios.get(`http://localhost:9090/api/pedidos/${id}`),
                axios.get('http://localhost:9090/api/productos'),
                axios.get('http://localhost:9090/api/combos')
            ]);

            const productosEnPedido = pedidoRes.data.productos?.map(p => ({
                productoId: p.id || p.producto?.id,
                cantidad: p.cantidad
            })) || [];

            const combosEnPedido = pedidoRes.data.combos?.map(c => ({
                comboId: c.id,
                cantidad: c.cantidad
            })) || [];

            setPedido({
                ...pedidoRes.data,
                detalles: pedidoRes.data.detalles || '',
                productos: productosEnPedido,
                combos: combosEnPedido
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

    // Enviar pedido actualizado al backend
    const handleGuardarCambios = async () => {
        setIsSaving(true);
        setError({ tipo: '', mensajes: [] });

        try {
            // Validaciones básicas
            if (pedido.productos.length === 0 && pedido.combos.length === 0) {
                setError({
                    tipo: 'VALIDACION',
                    mensajes: ['Debe agregar al menos un producto o combo al pedido']
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
                }))
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

        return totalProductos + totalCombos;
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

            <div className="pedido-container">
                <div className="seleccion-container">
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
                </div>

                <div className="resumen-container">
                    <div className="resumen-pedido">
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

                        {pedido.productos.length === 0 && pedido.combos.length === 0 ? (
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

                                {/* Detalles adicionales */}
                                <div className="detalles-adicionales">
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
                                <div className="botones-resumen">
                                    <Button
                                        type="primary"
                                        size="large"
                                        onClick={handleGuardarCambios}
                                        loading={isSaving}
                                        disabled={pedido.productos.length === 0 && pedido.combos.length === 0}
                                        block
                                    >
                                        {isSaving ? 'Guardando...' : 'Guardar Cambios'}
                                    </Button>
                                    <Button
                                        type="default"
                                        size="large"
                                        block
                                        onClick={() => navigate('/pedidos')}
                                    >
                                        Cancelar
                                    </Button>
                                </div>
                            </div>
                        )}
                    </div>
                </div>
            </div>
        </div>
    );
}