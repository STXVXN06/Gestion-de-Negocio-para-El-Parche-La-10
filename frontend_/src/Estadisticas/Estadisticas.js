import React, { useState, useEffect } from 'react';
import {
    Card, Table, Tag, Row, Col, Button, Spin, Alert, Typography, Statistic, Input,
    Collapse, Tooltip
} from 'antd';
import {
    BarChartOutlined, DownloadOutlined, ShoppingOutlined, PlusOutlined, MinusOutlined,
    InfoCircleOutlined
} from '@ant-design/icons';
import moment from 'moment';
import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';
import DatePicker from 'react-datepicker';
import 'react-datepicker/dist/react-datepicker.css';
import { format, startOfDay, endOfDay } from 'date-fns';
import './Reporte.css';
import api from '../api';

const { Title } = Typography;
const { Panel } = Collapse;
const API_BASE_URL = 'http://localhost:9090/api';

const Estadisticas = () => {
    const [productosVendidos, setProductosVendidos] = useState([]);
    const [ingredientesUtilizados, setIngredientesUtilizados] = useState([]);
    const [adiciones, setAdiciones] = useState([]);
    const [desperdicios, setDesperdicios] = useState([]);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState(null);
    const [totalProductosVendidos, setTotalProductosVendidos] = useState(0);
    const [searchProductos, setSearchProductos] = useState('');
    const [searchIngredientes, setSearchIngredientes] = useState('');
    const [searchAdiciones, setSearchAdiciones] = useState('');
    const [searchDesperdicios, setSearchDesperdicios] = useState('');
    const [activePanels, setActivePanels] = useState(['productos', 'ingredientes', 'adiciones', 'desperdicios']);

    // Función para obtener inicio y fin del día actual (00:00:00 a 23:59:59)
    const getTodayRange = () => {
        const hoy = new Date();
        const start = startOfDay(hoy); // 00:00:00
        const end = endOfDay(hoy);     // 23:59:59
        return { start, end };
    };

    const [fechaInicio, setFechaInicio] = useState(getTodayRange().start);
    const [fechaFin, setFechaFin] = useState(getTodayRange().end);

    const restablecerFechas = () => {
        const { start, end } = getTodayRange();
        setFechaInicio(start);
        setFechaFin(end);
    };

    const obtenerDatos = async () => {
        if (!fechaInicio || !fechaFin) return;

        setLoading(true);
        setError(null);

        try {
            const params = {
                fechaInicio: moment(fechaInicio).format("YYYY-MM-DDTHH:mm:ss"),
                fechaFin: moment(fechaFin).format("YYYY-MM-DDTHH:mm:ss")
            };

            const [
                productosRes,
                ingredientesRes,
                adicionesRes,
                desperdiciosRes
            ] = await Promise.all([
                api.get(`${API_BASE_URL}/reportes/productos-mas-vendidos`, { params }),
                api.get(`${API_BASE_URL}/reportes/ingredientes-utilizados`, { params }),
                api.get(`${API_BASE_URL}/reportes/adiciones-ingredientes`, { params }),
                api.get(`${API_BASE_URL}/reportes/desperdicios`, { params })
            ]);

            setProductosVendidos(productosRes.data);
            setIngredientesUtilizados(ingredientesRes.data);
            setAdiciones(adicionesRes.data);
            setDesperdicios(desperdiciosRes.data);

            const totalVendido = productosRes.data.reduce((sum, producto) => sum + producto.cantidadVendida, 0);
            setTotalProductosVendidos(totalVendido);
        } catch (err) {
            setError('Error al obtener los datos. Verifica la conexión con el servidor.');
            console.error('Error fetching data:', err);
        } finally {
            setLoading(false);
        }
    };

    const generarPDFReporte = () => {
        const pdf = new jsPDF();
        const margin = 20;
        let yPos = margin;

        // Título del reporte
        pdf.setFontSize(18);
        pdf.text('Reporte de Estadísticas de Ventas', 105, yPos, null, null, 'center');
        yPos += 15;

        pdf.setFontSize(12);
        pdf.text(
            `Período: ${format(fechaInicio, 'dd/MM/yyyy')} - ${format(fechaFin, 'dd/MM/yyyy')}`,
            105, yPos, null, null, 'center'
        );
        yPos += 15;

        // Estadísticas resumidas
        pdf.setFontSize(14);
        pdf.text(`Total de productos vendidos: ${totalProductosVendidos}`, margin, yPos);
        yPos += 10;

        // Tabla de productos vendidos
        pdf.setFontSize(16);
        pdf.text('Productos Vendidos', margin, yPos);
        yPos += 10;

        const productosData = productosVendidos.map((producto, index) => [
            index + 1,
            producto.nombreProducto,
            producto.cantidadVendida
        ]);

        autoTable(pdf, {
            startY: yPos,
            head: [['#', 'Producto', 'Cantidad Vendida']],
            body: productosData,
            theme: 'grid',
            headStyles: { fillColor: [41, 128, 185] },
            styles: { fontSize: 10 }
        });
        yPos = pdf.lastAutoTable.finalY + 10;

        // Tabla de ingredientes utilizados
        pdf.setFontSize(16);
        pdf.text('Ingredientes Utilizados', margin, yPos);
        yPos += 5;

        const ingredientesData = ingredientesUtilizados.map(ingrediente => [
            ingrediente.nombreIngrediente,
            `${ingrediente.cantidadUsada.toFixed(2)} ${ingrediente.unidadMedida}`
        ]);

        autoTable(pdf, {
            startY: yPos,
            head: [['Ingrediente', 'Cantidad Utilizada']],
            body: ingredientesData,
            theme: 'grid',
            headStyles: { fillColor: [39, 174, 96] },
            styles: { fontSize: 10 }
        });
        yPos = pdf.lastAutoTable.finalY + 15;

        // Tabla de adiciones de ingredientes
        pdf.setFontSize(16);
        pdf.text('Adiciones de Ingredientes', margin, yPos);
        yPos += 5;

        const adicionesData = adiciones.map(adicion => [
            adicion.pedidoId,
            adicion.ingredienteNombre,
            `${adicion.cantidad} ${adicion.unidadMedida}`,
            adicion.aplicadoA,
            moment(adicion.fecha).format('DD/MM/YY HH:mm')
        ]);

        autoTable(pdf, {
            startY: yPos,
            head: [['Pedido', 'Ingrediente', 'Cantidad', 'Aplicado a', 'Fecha']],
            body: adicionesData,
            theme: 'grid',
            headStyles: { fillColor: [155, 89, 182] },
            styles: { fontSize: 10 }
        });
        yPos = pdf.lastAutoTable.finalY + 15;

        // Tabla de desperdicios
        pdf.setFontSize(16);
        pdf.text('Registros de Desperdicios', margin, yPos);
        yPos += 5;

        const desperdiciosData = desperdicios.map(desperdicio => [
            moment(desperdicio.fecha).format('DD/MM/YY HH:mm'),
            desperdicio.tipoItem,
            desperdicio.nombreItem,
            `${desperdicio.cantidad} ${desperdicio.unidadMedida}`,
            desperdicio.motivo
        ]);

        autoTable(pdf, {
            startY: yPos,
            head: [['Fecha', 'Tipo', 'Item', 'Cantidad', 'Motivo']],
            body: desperdiciosData,
            theme: 'grid',
            headStyles: { fillColor: [231, 76, 60] },
            styles: { fontSize: 10 }
        });

        pdf.save(`reporte-estadisticas-${moment().format('YYYYMMDD')}.pdf`);
    };

    // Filtrar datos por términos de búsqueda
    const filteredProductos = productosVendidos.filter(producto =>
        producto.nombreProducto.toLowerCase().includes(searchProductos.toLowerCase())
    );

    const filteredIngredientes = ingredientesUtilizados.filter(ingrediente =>
        ingrediente.nombreIngrediente.toLowerCase().includes(searchIngredientes.toLowerCase())
    );

    const filteredAdiciones = adiciones.filter(adicion =>
        Object.values(adicion).some(val =>
            val && val.toString().toLowerCase().includes(searchAdiciones.toLowerCase())
        )
    );

    const filteredDesperdicios = desperdicios.filter(desperdicio =>
        Object.values(desperdicio).some(val =>
            val && val.toString().toLowerCase().includes(searchDesperdicios.toLowerCase())
        )
    );

    // Columnas para las tablas
    const columnasProductos = [
        {
            title: '#',
            dataIndex: 'index',
            key: 'index',
            width: 50,
            render: (_, __, index) => index + 1
        },
        {
            title: 'Producto',
            dataIndex: 'nombreProducto',
            key: 'nombreProducto',
            render: (text) => <strong>{text}</strong>
        },
        {
            title: 'Cantidad Vendida',
            dataIndex: 'cantidadVendida',
            key: 'cantidadVendida',
            align: 'right',
            render: (cantidad) => (
                <div className="cantidad-container">
                    <div className="cantidad-vendida">
                        {cantidad} <Tag color="blue">unidades</Tag>
                    </div>
                </div>
            )
        }
    ];

    const columnasIngredientes = [
        {
            title: 'Ingrediente',
            dataIndex: 'nombreIngrediente',
            key: 'nombreIngrediente',
            render: (text) => <strong>{text}</strong>
        },
        {
            title: 'Cantidad Utilizada',
            dataIndex: 'cantidadUsada',
            key: 'cantidadUsada',
            align: 'right',
            render: (_, record) => (
                <span>
                    {record.cantidadUsada.toFixed(2)} {record.unidadMedida}
                </span>
            )
        }
    ];

    const columnasAdiciones = [
        {
            title: 'Pedido',
            dataIndex: 'pedidoId',
            key: 'pedidoId',
            render: (id) => <Tag color="purple">#{id}</Tag>,
            width: 100,
            align: 'center'
        },
        {
            title: 'Ingrediente',
            dataIndex: 'ingredienteNombre',
            key: 'ingrediente',
            render: (text) => <strong>{text}</strong>,
            ellipsis: true
        },
        {
            title: 'Cantidad',
            dataIndex: 'cantidad',
            key: 'cantidad',
            align: 'right',
            render: (_, record) => (
                <div className="cantidad-adicion">
                    <span className="cantidad-valor">{record.cantidad}</span>
                    <span className="unidad-medida">{record.unidadMedida}</span>
                </div>
            )
        }
    ];

    const columnasDesperdicios = [
        {
            title: 'Fecha',
            dataIndex: 'fecha',
            key: 'fecha',
            render: (fecha) => moment(fecha).format('DD/MM/YY HH:mm'),
            sorter: (a, b) => new Date(a.fecha) - new Date(b.fecha),
            width: 120,
            align: 'center'
        },
        {
            title: 'Tipo',
            dataIndex: 'tipoItem',
            key: 'tipo',
            filters: [
                { text: 'Ingrediente', value: 'INGREDIENTE' },
                { text: 'Producto', value: 'PRODUCTO' }
            ],
            onFilter: (value, record) => record.tipoItem === value,
            render: (tipo) => (
                <Tag color={tipo === 'INGREDIENTE' ? 'geekblue' : 'orange'}>
                    {tipo}
                </Tag>
            ),
            width: 100,
            align: 'center'
        },
        {
            title: 'Item',
            dataIndex: 'nombreItem',
            key: 'item',
            render: (text) => <strong>{text}</strong>,
            ellipsis: true
        },
        {
            title: 'Cantidad',
            dataIndex: 'cantidad',
            key: 'cantidad',
            align: 'right',
            render: (_, record) => (
                <div className="cantidad-desperdicio">
                    <span className="cantidad-valor">{record.cantidad}</span>
                    <span className="unidad-medida">{record.unidadMedida}</span>
                </div>
            ),
            width: 120
        },
        {
            title: 'Motivo',
            dataIndex: 'motivo',
            key: 'motivo',
            ellipsis: true,
            render: (text) => (
                <Tooltip title={text}>
                    <span>{text}</span>
                </Tooltip>
            )
        }
    ];

    const togglePanel = (panel) => {
        if (activePanels.includes(panel)) {
            setActivePanels(activePanels.filter(p => p !== panel));
        } else {
            setActivePanels([...activePanels, panel]);
        }
    };

    useEffect(() => {
        restablecerFechas();
    }, []);

    useEffect(() => {
        if (fechaInicio && fechaFin) {
            obtenerDatos();
        }
    }, [fechaInicio, fechaFin]);

    return (
        <Card className="card-reporte" id="reporte-estadisticas">
            {error && <Alert message={error} type="error" showIcon className="error-alert" />}

            <div className="filtros-container">
                <div className="date-pickers-container">
                    <div className="date-picker-group">
                        <label>Fecha Inicio:</label>
                        <DatePicker
                            selected={fechaInicio}
                            onChange={date => setFechaInicio(date)}
                            showTimeSelect
                            timeFormat="HH:mm"
                            timeIntervals={15}
                            timeCaption="Hora"
                            dateFormat="dd/MM/yyyy HH:mm"
                            className="custom-datepicker"
                            popperPlacement="bottom-start"
                        />
                    </div>

                    <div className="date-picker-group">
                        <label>Fecha Fin:</label>
                        <DatePicker
                            selected={fechaFin}
                            onChange={date => setFechaFin(date)}
                            showTimeSelect
                            timeFormat="HH:mm"
                            timeIntervals={15}
                            timeCaption="Hora"
                            dateFormat="dd/MM/yyyy HH:mm"
                            className="custom-datepicker"
                            popperPlacement="bottom-start"
                            minDate={fechaInicio}
                        />
                    </div>
                </div>

                <Button
                    type="default"
                    onClick={restablecerFechas}
                    className="reset-button"
                >
                    Hoy
                </Button>

                <Tag color="blue" className="date-range-tag">
                    {format(fechaInicio, 'dd/MM/yyyy HH:mm')} -{' '}
                    {format(fechaFin, 'dd/MM/yyyy HH:mm')}
                </Tag>

                <Button
                    type="primary"
                    icon={<DownloadOutlined />}
                    onClick={generarPDFReporte}
                    className="download-pdf-btn"
                >
                    Descargar PDF
                </Button>
            </div>

            {loading ? (
                <div className="loading-container">
                    <Spin size="large" />
                    <p>Cargando estadísticas...</p>
                </div>
            ) : (
                <>
                    <Row gutter={16} className="stats-row">
                        <Col xs={24} sm={24} md={8} lg={8} xl={8}>
                            <Card className="stat-card">
                                <Statistic
                                    title="Productos Vendidos"
                                    value={totalProductosVendidos}
                                    precision={0}
                                    valueStyle={{ color: '#3f8600' }}
                                    prefix={<ShoppingOutlined />}
                                />
                                <div className="stat-comparison">En el período seleccionado</div>
                            </Card>
                        </Col>
                    </Row>

                    <Collapse
                        activeKey={activePanels}
                        onChange={setActivePanels}
                        bordered={false}
                        className="stats-collapse"
                    >
                        {/* Panel de Productos Vendidos */}
                        <Panel
                            header={
                                <div className="section-header">
                                    <Title level={4} className="section-title">
                                        <ShoppingOutlined /> Productos Vendidos
                                    </Title>
                                </div>
                            }
                            key="productos"
                            extra={
                                <Input
                                    placeholder="Buscar producto"
                                    value={searchProductos}
                                    onChange={(e) => setSearchProductos(e.target.value)}
                                    style={{ width: 200 }}
                                    prefix={<InfoCircleOutlined />}
                                />
                            }
                        >
                            <Table
                                dataSource={filteredProductos.map((item, index) => ({ ...item, key: item.productoId, index }))}
                                columns={columnasProductos}
                                pagination={{ pageSize: 10 }}
                                size="middle"
                                scroll={{ x: 'max-content' }}
                                className="stats-table"
                            />
                        </Panel>

                        {/* Panel de Ingredientes Utilizados */}
                        <Panel
                            header={
                                <Title level={4} className="section-title">
                                    <BarChartOutlined /> Ingredientes Utilizados
                                </Title>
                            }
                            key="ingredientes"
                            extra={
                                <Input
                                    placeholder="Buscar ingrediente"
                                    value={searchIngredientes}
                                    onChange={(e) => setSearchIngredientes(e.target.value)}
                                    style={{ width: 200 }}
                                    prefix={<InfoCircleOutlined />}
                                />
                            }
                        >
                            <Table
                                dataSource={filteredIngredientes.map(ingrediente => ({ ...ingrediente, key: ingrediente.ingredienteId }))}
                                columns={columnasIngredientes}
                                pagination={{ pageSize: 10 }}
                                size="middle"
                                scroll={{ x: 'max-content' }}
                                className="stats-table"
                            />
                        </Panel>

                        {/* Panel de Adiciones */}
                        <Panel
                            header={
                                <div className="section-header">
                                    <Title level={4} className="section-title">
                                        <PlusOutlined /> Adiciones de Ingredientes
                                    </Title>
                                </div>
                            }
                            key="adiciones"
                            extra={
                                <Input
                                    placeholder="Buscar en adiciones"
                                    value={searchAdiciones}
                                    onChange={(e) => setSearchAdiciones(e.target.value)}
                                    className="search-input"
                                    prefix={<InfoCircleOutlined />}
                                />
                            }
                        >
                            <Table
                                dataSource={filteredAdiciones}
                                columns={columnasAdiciones}
                                pagination={{ pageSize: 5 }}
                                size="middle"
                                scroll={{ x: 'max-content' }}
                                rowClassName="fila-adicion"
                                className="stats-table"
                            />
                        </Panel>

                        {/* Panel de Desperdicios */}
                        <Panel
                            header={
                                <div className="section-header">
                                    <Title level={4} className="section-title">
                                        <MinusOutlined /> Registros de Desperdicios
                                    </Title>
                                </div>
                            }
                            key="desperdicios"
                            extra={
                                <Input
                                    placeholder="Buscar en desperdicios"
                                    value={searchDesperdicios}
                                    onChange={(e) => setSearchDesperdicios(e.target.value)}
                                    className="search-input"
                                    prefix={<InfoCircleOutlined />}
                                />
                            }
                        >
                            <Table
                                dataSource={filteredDesperdicios}
                                columns={columnasDesperdicios}
                                pagination={{ pageSize: 5 }}
                                size="middle"
                                scroll={{ x: 'max-content' }}
                                rowClassName="fila-desperdicio"
                                className="stats-table"
                            />
                        </Panel>
                    </Collapse>
                </>
            )}
        </Card>
    );
};

export default Estadisticas;