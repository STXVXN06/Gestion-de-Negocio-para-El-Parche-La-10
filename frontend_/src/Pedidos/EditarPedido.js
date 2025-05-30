import axios from 'axios';
import React, { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { NumericFormat } from 'react-number-format';
import Button from 'react-bootstrap/Button';
import Form from 'react-bootstrap/Form';
import Modal from 'react-bootstrap/Modal';
import Badge from 'react-bootstrap/Badge';
import Alert from 'react-bootstrap/Alert';
import ListGroup from 'react-bootstrap/ListGroup';

export default function EditarPedido() {
    const { id } = useParams();
    const navigate = useNavigate();
    const urlBase = `http://localhost:9090/api/pedidos/${id}`;
    const urlProductos = 'http://localhost:9090/api/productos';

    const [pedido, setPedido] = useState({
        detalles: '',
        productos: [],
        estado: 'PENDIENTE'
    });
    
    const [productosDisponibles, setProductosDisponibles] = useState([]);
    const [showProductos, setShowProductos] = useState(false);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState({ tipo: '', mensajes: [] });
    const [isSaving, setIsSaving] = useState(false);

    useEffect(() => {
        cargarDatosIniciales();
    }, []);

    const cargarDatosIniciales = async () => {
        try {
            setLoading(true);
            const [pedidoRes, productosRes] = await Promise.all([
                axios.get(urlBase),
                axios.get(urlProductos)
            ]);
            
            const productosEnPedido = pedidoRes.data.productos?.map(p => ({
                productoId: p.id || p.producto?.id,
                cantidad: p.cantidad
            })) || [];

            setPedido({
                ...pedidoRes.data,
                detalles: pedidoRes.data.detalles || '',
                productos: productosEnPedido
            });

            setProductosDisponibles(productosRes.data.filter(p => p.activo));
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

    const handleCambiarCantidad = (productoId, nuevaCantidad) => {
        const nuevosProductos = pedido.productos.map(p => 
            p.productoId === productoId ? { ...p, cantidad: Math.max(1, nuevaCantidad) } : p
        );
        setPedido(prev => ({ ...prev, productos: nuevosProductos }));
    };

    const handleEliminarProducto = (productoId) => {
        const nuevosProductos = pedido.productos.filter(p => p.productoId !== productoId);
        setPedido(prev => ({ ...prev, productos: nuevosProductos }));
    };

    const handleAgregarProducto = (producto) => {
        const existe = pedido.productos.some(p => p.productoId === producto.id);
        if (!existe) {
            setPedido(prev => ({
                ...prev,
                productos: [...prev.productos, { productoId: producto.id, cantidad: 1 }]
            }));
        }
        setShowProductos(false);
    };

    const handleGuardarCambios = async () => {
        setIsSaving(true);
        setError({ tipo: '', mensajes: [] });
        
        try {
            // Validaciones básicas
            if (pedido.productos.length === 0) {
                setError({
                    tipo: 'VALIDACION',
                    mensajes: ['Debe agregar al menos un producto al pedido']
                });
                return;
            }

            if (pedido.productos.some(p => p.cantidad < 1)) {
                setError({
                    tipo: 'VALIDACION',
                    mensajes: ['Las cantidades deben ser mayores a cero']
                });
                return;
            }

            // Preparar payload
            const payload = {
                detalles: pedido.detalles,
                productos: pedido.productos.map(p => ({
                    productoId: p.productoId,
                    cantidad: p.cantidad
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
            
            await cargarDatosIniciales(); // Recargar datos actualizados
        } finally {
            setIsSaving(false);
        }
    };

    const calcularTotal = () => {
        return pedido.productos.reduce((total, item) => {
            const producto = productosDisponibles.find(p => p.id === item.productoId);
            return total + (producto?.precio || 0) * item.cantidad;
        }, 0);
    };

    const obtenerNombreProducto = (productoId) => {
        return productosDisponibles.find(p => p.id === productoId)?.nombre || 'Producto no encontrado';
    };

    if (loading) return <div className="container mt-4">Cargando...</div>;

    return (
        <div className="container mt-4">
            <h2 className="mb-4">Editar Pedido #{id}</h2>
            
            {error.mensajes.length > 0 && (
                <Alert 
                    variant={error.tipo === 'STOCK' ? 'warning' : 'danger'} 
                    className="mb-4" 
                    onClose={() => setError({ tipo: '', mensajes: [] })} 
                    dismissible
                >
                    <Alert.Heading>
                        {error.tipo === 'STOCK' ? 'Problemas de stock' : 'Error'}
                    </Alert.Heading>
                    <ListGroup variant="flush">
                        {error.mensajes.map((mensaje, index) => (
                            <ListGroup.Item key={index} className="bg-transparent p-1">
                                {mensaje}
                            </ListGroup.Item>
                        ))}
                    </ListGroup>
                </Alert>
            )}

            <div className="card mb-4">
                <div className="card-body">
                    <div className="d-flex justify-content-between align-items-center mb-3">
                        <Badge bg="secondary" className="text-capitalize">
                            {pedido.estado.toLowerCase()}
                        </Badge>
                        <h4 className="text-success">
                            <NumericFormat 
                                value={calcularTotal()} 
                                displayType="text" 
                                thousandSeparator="," 
                                prefix="$" 
                                decimalScale={0}
                            />
                        </h4>
                    </div>

                    <Form.Group className="mb-3">
                        <Form.Label>Detalles adicionales</Form.Label>
                        <Form.Control
                            as="textarea"
                            rows={3}
                            value={pedido.detalles}
                            onChange={(e) => setPedido(prev => ({ ...prev, detalles: e.target.value }))}
                            placeholder="Ej: Pedido para llevar, especificaciones especiales..."
                        />
                    </Form.Group>

                    <div className="mb-4">
                        <h5>Productos en el pedido</h5>
                        {pedido.productos.map((item, index) => (
                            <div key={index} className="d-flex align-items-center mb-2 p-2 border rounded">
                                <div className="flex-grow-1">
                                    <h6 className="mb-0">{obtenerNombreProducto(item.productoId)}</h6>
                                    <small className="text-muted">
                                        <NumericFormat 
                                            value={productosDisponibles.find(p => p.id === item.productoId)?.precio || 0} 
                                            displayType="text" 
                                            thousandSeparator="," 
                                            prefix="$" 
                                            decimalScale={0}
                                        />
                                    </small>
                                </div>
                                
                                <Form.Control
                                    type="number"
                                    min="1"
                                    className="mx-3"
                                    style={{ width: '100px' }}
                                    value={item.cantidad}
                                    onChange={(e) => handleCambiarCantidad(item.productoId, parseInt(e.target.value) || 1)}
                                    disabled={isSaving}
                                />
                                
                                <Button 
                                    variant="outline-danger"
                                    size="sm"
                                    onClick={() => handleEliminarProducto(item.productoId)}
                                    disabled={isSaving}
                                >
                                    Eliminar
                                </Button>
                            </div>
                        ))}

                        {pedido.productos.length === 0 && (
                            <div className="text-center py-4 text-muted">
                                No hay productos en este pedido
                            </div>
                        )}
                    </div>

                    <div className="d-flex justify-content-between">
                        <Button 
                            variant="primary" 
                            onClick={() => setShowProductos(true)}
                            disabled={isSaving}
                        >
                            Agregar Productos
                        </Button>
                        
                        <div>
                            <Button 
                                variant="secondary" 
                                className="me-2"
                                onClick={() => navigate('/pedidos')}
                                disabled={isSaving}
                            >
                                Cancelar
                            </Button>
                            <Button 
                                variant="success" 
                                onClick={handleGuardarCambios}
                                disabled={isSaving || pedido.productos.length === 0}
                            >
                                {isSaving ? 'Guardando...' : 'Guardar Cambios'}
                            </Button>
                        </div>
                    </div>
                </div>
            </div>

            <Modal show={showProductos} onHide={() => setShowProductos(false)} size="lg">
                <Modal.Header closeButton>
                    <Modal.Title>Seleccionar Productos</Modal.Title>
                </Modal.Header>
                <Modal.Body>
                    <div className="row row-cols-1 row-cols-md-3 g-3">
                        {productosDisponibles.map(producto => (
                            <div key={producto.id} className="col">
                                <div 
                                    className="card h-100 cursor-pointer hover-shadow"
                                    onClick={() => handleAgregarProducto(producto)}
                                    style={{ cursor: 'pointer' }}
                                >
                                    <div className="card-body">
                                        <h6 className="card-title">{producto.nombre}</h6>
                                        <div className="d-flex justify-content-between align-items-center">
                                            <Badge bg="secondary" className="text-capitalize">
                                                {producto.tipo.toLowerCase()}
                                            </Badge>
                                            <NumericFormat 
                                                value={producto.precio} 
                                                displayType="text" 
                                                thousandSeparator="," 
                                                prefix="$" 
                                                decimalScale={0}
                                                className="text-success fw-bold"
                                            />      
                                        </div>
                                    </div>
                                </div>
                            </div>
                        ))}
                    </div>
                </Modal.Body>
            </Modal>
        </div>
    );
}