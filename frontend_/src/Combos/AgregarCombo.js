import React, { useState, useEffect, useMemo } from 'react';
import axios from 'axios';
import { Form, Input, InputNumber, Button, Select, Table, Tag, Card, Divider, Typography, notification, Spin } from 'antd';
import { PlusOutlined, DeleteOutlined, ArrowLeftOutlined } from '@ant-design/icons';
import 'bootstrap/dist/css/bootstrap.min.css';
import './AgregarCombo.css';
import { useNavigate } from 'react-router-dom';

const { Title } = Typography;
const { Option } = Select;

export default function AgregarCombo() {
    const [form] = Form.useForm();
    const [productos, setProductos] = useState([]);
    const [productosSeleccionados, setProductosSeleccionados] = useState([]);
    const [productoActual, setProductoActual] = useState(null);
    const [cantidad, setCantidad] = useState(1);
    const [loading, setLoading] = useState(true);
    const [guardando, setGuardando] = useState(false);
    const navigate = useNavigate();

    // Observar cambios en el campo de descuento
    const descuento = Form.useWatch('descuento', form) || 0;

    // Calcular valores en tiempo real usando useMemo
    const { subtotal, descuentoValor, total } = useMemo(() => {
        const subtotalCalculado = productosSeleccionados.reduce(
            (sum, item) => sum + item.precio * item.cantidad,
            0
        );

        const descuentoValorCalculado = subtotalCalculado * descuento;
        const totalCalculado = subtotalCalculado - descuentoValorCalculado;

        return {
            subtotal: subtotalCalculado,
            descuentoValor: descuentoValorCalculado,
            total: totalCalculado
        };
    }, [productosSeleccionados, descuento]);

    useEffect(() => {
        const fetchProductos = async () => {
            try {
                const response = await axios.get('http://localhost:9090/api/productos');
                setProductos(response.data);
                setLoading(false);
            } catch (error) {
                console.error('Error al obtener productos:', error);
                notification.error({
                    message: 'Error',
                    description: 'No se pudieron cargar los productos disponibles',
                    placement: 'bottomRight'
                });
                setLoading(false);
            }
        };

        fetchProductos();
    }, []);

    const agregarProducto = () => {
        if (!productoActual || cantidad < 1) {
            notification.warning({
                message: 'Datos incompletos',
                description: 'Seleccione un producto y especifique la cantidad',
                placement: 'bottomRight'
            });
            return;
        }

        const existe = productosSeleccionados.some(p => p.id === productoActual.id);
        if (existe) {
            notification.warning({
                message: 'Producto duplicado',
                description: 'Este producto ya está en el combo. Elimínelo para cambiar la cantidad.',
                placement: 'bottomRight'
            });
            return;
        }

        setProductosSeleccionados([
            ...productosSeleccionados,
            {
                id: productoActual.id,
                nombre: productoActual.nombre,
                precio: productoActual.precio,
                cantidad: cantidad
            }
        ]);

        setProductoActual(null);
        setCantidad(1);
    };

    const eliminarProducto = (id) => {
        setProductosSeleccionados(
            productosSeleccionados.filter(producto => producto.id !== id)
        );
    };

    const guardarCombo = async (values) => {
        if (productosSeleccionados.length === 0) {
            notification.error({
                message: 'Combo incompleto',
                description: 'Debe agregar al menos un producto al combo',
                placement: 'bottomRight'
            });
            return;
        }

        setGuardando(true);

        const comboData = {
            nombre: values.nombre,
            descripcion: values.descripcion || '',
            descuento: values.descuento,
            activo: true,
            productos: productosSeleccionados.map(p => ({
                productoId: p.id,
                cantidad: p.cantidad
            }))
        };

        try {
            await axios.post('http://localhost:9090/api/combos', comboData);
            notification.success({
                message: 'Combo creado',
                description: `El combo "${values.nombre}" ha sido creado exitosamente`,
                placement: 'bottomRight',
                duration: 1.5
            });

            form.resetFields();
            setProductosSeleccionados([]);

            setTimeout(() => navigate('/combos'), 1500);
        } catch (error) {
            console.error('Error al guardar el combo:', error);
            notification.error({
                message: 'Error',
                description: 'No se pudo crear el combo. Por favor, intente nuevamente.',
                placement: 'bottomRight'
            });
        } finally {
            setGuardando(false);
        }
    };

    const columnas = [
        { title: 'Producto', dataIndex: 'nombre', key: 'nombre' },
        {
            title: 'Precio',
            dataIndex: 'precio',
            key: 'precio',
            render: precio => `$${precio.toLocaleString()}`,
            align: 'right'
        },
        {
            title: 'Cantidad',
            dataIndex: 'cantidad',
            key: 'cantidad',
            align: 'center'
        },
        {
            title: 'Subtotal',
            key: 'subtotal',
            render: (_, record) => `$${(record.precio * record.cantidad).toLocaleString()}`,
            align: 'right'
        },
        {
            title: 'Acciones',
            key: 'acciones',
            render: (_, record) => (
                <Button
                    type="link"
                    danger
                    icon={<DeleteOutlined />}
                    onClick={() => eliminarProducto(record.id)}
                />
            ),
            align: 'center'
        }
    ];

    if (loading) {
        return (
            <div className="text-center mt-5">
                <Spin size="large" />
                <p>Cargando productos disponibles...</p>
            </div>
        );
    }

    return (
        <div className="container mt-4">
            <Button
                type="link"
                icon={<ArrowLeftOutlined />}
                className="mb-3"
                onClick={() => window.history.back()}
            >
                Volver a combos
            </Button>

            <Card className="shadow-sm">
                <Title level={3} className="text-center mb-4">
                    <span className="text-primary">Crear Nuevo Combo</span>
                </Title>

                <div className="row">
                    <div className="col-lg-7">
                        <Form
                            form={form}
                            layout="vertical"
                            onFinish={guardarCombo}
                            initialValues={{ descuento: 0.1 }}
                        >
                            <Form.Item
                                label="Nombre del Combo"
                                name="nombre"
                                rules={[
                                    { required: true, message: 'Por favor ingrese el nombre del combo' },
                                    { min: 3, message: 'El nombre debe tener al menos 3 caracteres' }
                                ]}
                            >
                                <Input placeholder="Ej: Combo Familiar" />
                            </Form.Item>

                            <Form.Item
                                label="Descripción"
                                name="descripcion"
                            >
                                <Input.TextArea
                                    placeholder="Descripción del combo (opcional)"
                                    rows={3}
                                />
                            </Form.Item>

                            <Form.Item
                                label="Descuento (%)"
                                name="descuento"
                                rules={[
                                    { required: true, message: 'Por favor ingrese el descuento' },
                                    { type: 'number', min: 0, max: 1, message: 'El descuento debe estar entre 0 y 1 (ej: 0.15 para 15%)' }
                                ]}
                            >
                                <InputNumber
                                    min={0}
                                    max={1}
                                    step={0.05}
                                    style={{ width: '100%' }}
                                    formatter={value => `${(value * 100).toFixed(0)}%`}
                                    parser={value => parseFloat(value.replace('%', '')) / 100}
                                />
                            </Form.Item>

                            <Divider orientation="left">Productos del Combo</Divider>

                            {/* Mostrar producto seleccionado */}
                            {productoActual && (
                                <div className="alert alert-info mb-3">
                                    <strong>Producto seleccionado:</strong> {productoActual.nombre}
                                    <span className="ms-2 badge bg-primary">
                                        ${productoActual.precio.toLocaleString()}
                                    </span>
                                </div>
                            )}

                            <div className="row g-3 align-items-end">
                                <div className="col-md-6">
                                    <div className="mb-3">
                                        <label className="form-label">Seleccionar Producto</label>
                                        <Select
                                            showSearch
                                            placeholder="Buscar producto..."
                                            optionFilterProp="children"
                                            value={productoActual?.id}
                                            onChange={value => setProductoActual(productos.find(p => p.id === value))}
                                            filterOption={(input, option) =>
                                                option.children.toLowerCase().includes(input.toLowerCase())
                                            }
                                            className="w-100"
                                        >
                                            {productos.map(producto => (
                                                <Option key={producto.id} value={producto.id}>
                                                    {producto.nombre} (${producto.precio.toLocaleString()})
                                                </Option>
                                            ))}
                                        </Select>
                                    </div>
                                </div>

                                <div className="col-md-4">
                                    <div className="mb-3">
                                        <label className="form-label">Cantidad</label>
                                        <InputNumber
                                            min={1}
                                            max={10}
                                            value={cantidad}
                                            onChange={setCantidad}
                                            className="w-100"
                                        />
                                    </div>
                                </div>

                                <div className="col-md-2">
                                    <Button
                                        type="primary"
                                        icon={<PlusOutlined />}
                                        onClick={agregarProducto}
                                        className="w-100"
                                    >
                                        Agregar
                                    </Button>
                                </div>
                            </div>

                            <div className="mt-4">
                                <Table
                                    columns={columnas}
                                    dataSource={productosSeleccionados}
                                    rowKey="id"
                                    pagination={false}
                                    size="small"
                                    scroll={{ y: 240 }}
                                    locale={{
                                        emptyText: 'No hay productos en el combo'
                                    }}
                                />
                            </div>

                            <div className="mt-4 d-flex justify-content-end">
                                <Button
                                    type="primary"
                                    htmlType="submit"
                                    size="large"
                                    loading={guardando}
                                    disabled={productosSeleccionados.length === 0}
                                >
                                    {guardando ? 'Guardando...' : 'Crear Combo'}
                                </Button>
                            </div>
                        </Form>
                    </div>

                    <div className="col-lg-5">
                        <Card
                            title="Vista Previa del Combo"
                            className="sticky-top"
                            style={{ top: '20px' }}
                        >
                            <div className="text-center mb-4">
                                <h4 className="text-primary">
                                    {form.getFieldValue('nombre') || 'Nombre del Combo'}
                                </h4>
                                <p className="text-muted">
                                    {form.getFieldValue('descripcion') || 'Descripción del combo'}
                                </p>
                            </div>

                            <div className="mb-3">
                                <h6>Productos incluidos:</h6>
                                <ul className="list-group">
                                    {productosSeleccionados.map((producto, index) => (
                                        <li
                                            key={index}
                                            className="list-group-item d-flex justify-content-between align-items-center"
                                        >
                                            <span>
                                                {producto.cantidad}x {producto.nombre}
                                            </span>
                                            <span className="badge bg-primary rounded-pill">
                                                ${(producto.precio * producto.cantidad).toLocaleString()}
                                            </span>
                                        </li>
                                    ))}
                                </ul>
                            </div>

                            <div className="d-flex justify-content-between mb-2">
                                <span>Subtotal:</span>
                                <span>${subtotal.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</span>
                            </div>

                            <div className="d-flex justify-content-between mb-2">
                                <span>
                                    Descuento ({(descuento * 100).toFixed(0)}%):
                                </span>
                                <span className="text-danger">
                                    -${descuentoValor.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                                </span>
                            </div>

                            <Divider />

                            <div className="d-flex justify-content-between fw-bold fs-5">
                                <span>Total:</span>
                                <span className="text-success">
                                    ${total.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                                </span>
                            </div>

                            <div className="mt-4 text-center">
                                <Tag color={productosSeleccionados.length > 0 ? 'green' : 'orange'} className="fs-6">
                                    {productosSeleccionados.length > 0
                                        ? 'Combo válido para guardar'
                                        : 'Agregue productos al combo'}
                                </Tag>
                            </div>
                        </Card>
                    </div>
                </div>
            </Card>
        </div>
    );
}