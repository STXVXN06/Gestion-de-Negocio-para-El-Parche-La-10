import React, { useState, useEffect, useMemo } from 'react'; // Agregar useMemo
import { useParams, useNavigate } from 'react-router-dom';
import {
    Form,
    Input,
    InputNumber,
    Button,
    Select,
    Table,
    Tag,
    Card,
    Divider,
    Typography,
    notification,
    Spin,
    Popconfirm
} from 'antd';
import {
    PlusOutlined,
    DeleteOutlined,
    ArrowLeftOutlined,
    SaveOutlined
} from '@ant-design/icons';
import 'bootstrap/dist/css/bootstrap.min.css';
import './EditarCombo.css';
import api from '../api';

const { Title } = Typography;
const { Option } = Select;

export default function EditarCombo() {
    const { id } = useParams();
    const navigate = useNavigate();
    const [form] = Form.useForm();

    // Estados
    const [combo, setCombo] = useState(null);
    const [productos, setProductos] = useState([]);
    const [productosSeleccionados, setProductosSeleccionados] = useState([]);
    const [productoActual, setProductoActual] = useState(null);
    const [cantidad, setCantidad] = useState(1);
    const [loading, setLoading] = useState(true);
    const [guardando, setGuardando] = useState(false);
    const [error, setError] = useState(null);

    // Calcular subtotal de productos
    const subtotalProductos = useMemo(() => {
        return productosSeleccionados.reduce((total, producto) => {
            return total + (producto.precio * producto.cantidad);
        }, 0);
    }, [productosSeleccionados]);

    // Cargar datos del combo y productos
    useEffect(() => {
        const cargarDatos = async () => {
            try {
                setLoading(true);

                // Obtener combo
                const comboResponse = await api.get(`http://localhost:9090/api/combos/${id}`);
                const comboData = comboResponse.data;
                setCombo(comboData);

                // Obtener productos disponibles
                const productosResponse = await api.get('http://localhost:9090/api/productos');
                setProductos(productosResponse.data);

                // Transformar productos del combo al formato necesario
                const productosCombo = comboData.productos.map(p => ({
                    id: p.id,
                    nombre: p.nombre,
                    precio: p.precio,
                    cantidad: p.cantidad
                }));
                setProductosSeleccionados(productosCombo);
                form.setFieldsValue({
                    nombre: comboData.nombre,
                    descripcion: comboData.descripcion,
                    precio: comboData.precio,
                    activo: comboData.activo
                });

                setLoading(false);
            } catch (err) {
                console.error('Error al cargar datos:', err);
                setError('No se pudo cargar el combo. Por favor, intente nuevamente.');
                setLoading(false);
            }
        };

        cargarDatos();
    }, [id, form]);

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

    const actualizarCombo = async (values) => {
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
            precio: values.precio,
            activo: values.activo,
            productos: productosSeleccionados.map(p => ({
                productoId: p.id,
                cantidad: p.cantidad
            }))
        };

        try {
            await api.put(`http://localhost:9090/api/combos/${id}`, comboData);
            notification.success({
                message: 'Combo actualizado',
                description: `El combo "${values.nombre}" ha sido actualizado exitosamente`,
                placement: 'bottomRight',
                duration: 1.5
            });

            setTimeout(() => navigate('/combos'), 1500);
        } catch (error) {
            console.error('Error al actualizar el combo:', error);
            notification.error({
                message: 'Error',
                description: 'No se pudo actualizar el combo. Por favor, intente nuevamente.',
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
                <p>Cargando datos del combo...</p>
            </div>
        );
    }

    if (error) {
        return (
            <div className="container mt-5 text-center">
                <Card>
                    <Title level={4} className="text-danger">{error}</Title>
                    <Button
                        type="primary"
                        className="mt-3"
                        onClick={() => navigate('/combos')}
                    >
                        Volver a combos
                    </Button>
                </Card>
            </div>
        );
    }

    return (
        <div className="container mt-4">
            <Button
                type="link"
                icon={<ArrowLeftOutlined />}
                className="mb-3"
                onClick={() => navigate('/combos')}
            >
                Volver a combos
            </Button>

            <Card className="shadow-sm">
                <Title level={3} className="text-center mb-4">
                    <span className="text-primary">Editar Combo: {combo.nombre}</span>
                </Title>

                <div className="row">
                    <div className="col-lg-7">
                        <Form
                            form={form}
                            layout="vertical"
                            onFinish={actualizarCombo}
                            initialValues={{ activo: true }}
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
                                label="Precio del Combo"
                                name="precio"
                                rules={[
                                    { required: true, message: 'Por favor ingrese el precio del combo' },
                                    { type: 'number', min: 1, message: 'El precio debe ser mayor a 0' }
                                ]}
                            >
                                <InputNumber
                                    min={1}
                                    style={{ width: '100%' }}
                                    formatter={value => `$${value}`.replace(/\B(?=(\d{3})+(?!\d))/g, ',')}
                                    parser={value => value.replace(/\$\s?|(,*)/g, '')}
                                />
                            </Form.Item>

                            <Form.Item
                                label="Estado"
                                name="activo"
                            >
                                <Select>
                                    <Option value={true}>Activo</Option>
                                    <Option value={false}>Inactivo</Option>
                                </Select>
                            </Form.Item>

                            <Divider orientation="left">Productos del Combo</Divider>

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
                                            filterOption={(input, option) => {
                                                const optionText = Array.isArray(option.children)
                                                    ? option.children.join('')
                                                    : option.children.toString();

                                                return optionText.toLowerCase().includes(input.toLowerCase());
                                            }}
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
                                            max={100}
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
                                    summary={() => (
                                        <Table.Summary.Row>
                                            <Table.Summary.Cell index={0} colSpan={3} align="right">
                                                <strong>Total Productos:</strong>
                                            </Table.Summary.Cell>
                                            <Table.Summary.Cell index={1} align="right">
                                                <strong>${subtotalProductos.toLocaleString()}</strong>
                                            </Table.Summary.Cell>
                                            <Table.Summary.Cell index={2} />
                                        </Table.Summary.Row>
                                    )}
                                />
                            </div>

                            <div className="mt-4 d-flex justify-content-end gap-2">
                                <Popconfirm
                                    title="¿Cancelar cambios?"
                                    description="¿Está seguro que desea descartar los cambios realizados?"
                                    onConfirm={() => navigate('/combos')}
                                    okText="Sí"
                                    cancelText="No"
                                >
                                    <Button size="large">
                                        Cancelar
                                    </Button>
                                </Popconfirm>

                                <Button
                                    type="primary"
                                    htmlType="submit"
                                    size="large"
                                    loading={guardando}
                                    disabled={productosSeleccionados.length === 0}
                                    icon={<SaveOutlined />}
                                >
                                    {guardando ? 'Guardando...' : 'Actualizar Combo'}
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
                                    {form.getFieldValue('nombre') || combo.nombre}
                                </h4>
                                <p className="text-muted">
                                    {form.getFieldValue('descripcion') || combo.descripcion || 'Descripción del combo'}
                                </p>
                                <Tag color={form.getFieldValue('activo') ? 'green' : 'red'}>
                                    {form.getFieldValue('activo') ? 'Activo' : 'Inactivo'}
                                </Tag>
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

                            {/* SECCIÓN NUEVA: Resumen financiero */}
                            <div className="resumen-financiero mt-4">
                                <div className="d-flex justify-content-between mb-2">
                                    <span>Subtotal productos:</span>
                                    <span>
                                        ${subtotalProductos.toLocaleString(undefined, {
                                            minimumFractionDigits: 2,
                                            maximumFractionDigits: 2
                                        })}
                                    </span>
                                </div>

                                <div className="d-flex justify-content-between mb-2">
                                    <span>Precio del combo:</span>
                                    <span className="text-success">
                                        ${form.getFieldValue('precio')?.toLocaleString(undefined, {
                                            minimumFractionDigits: 2,
                                            maximumFractionDigits: 2
                                        }) || combo.precio?.toLocaleString()}
                                    </span>
                                </div>

                                <Divider className="my-2" />

                                <div className="d-flex justify-content-between fw-bold">
                                    <span>Diferencia:</span>
                                    <span className={
                                        (form.getFieldValue('precio') || 0) > subtotalProductos
                                            ? 'text-success'
                                            : 'text-danger'
                                    }>
                                        ${((form.getFieldValue('precio') || 0) - subtotalProductos).toLocaleString(undefined, {
                                            minimumFractionDigits: 2,
                                            maximumFractionDigits: 2
                                        })}
                                    </span>
                                </div>

                                <div className="mt-2 text-center">
                                    {subtotalProductos > 0 && form.getFieldValue('precio') && (
                                        <Tag color={
                                            form.getFieldValue('precio') > subtotalProductos
                                                ? 'green'
                                                : form.getFieldValue('precio') < subtotalProductos
                                                    ? 'orange'
                                                    : 'blue'
                                        }>
                                            {form.getFieldValue('precio') > subtotalProductos
                                                ? 'Ganancia'
                                                : form.getFieldValue('precio') < subtotalProductos
                                                    ? 'Pérdida'
                                                    : 'Sin margen'}
                                        </Tag>
                                    )}
                                </div>
                            </div>
                            {/* FIN SECCIÓN NUEVA */}

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