import React, { useState, useEffect } from 'react';
import axios from 'axios';
import {
    Card, Table, Tag, Row, Col, Button, Spin, Alert, Typography, Statistic, Input
} from 'antd';
import {
    BarChartOutlined, DownloadOutlined, ShoppingOutlined
} from '@ant-design/icons';
import moment from 'moment';
import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';
import DatePicker from 'react-datepicker';
import 'react-datepicker/dist/react-datepicker.css';
import { format, startOfDay, endOfDay, subYears, addYears } from 'date-fns';
import './Reporte.css';

const { Title } = Typography;
const API_BASE_URL = 'http://localhost:9090/api';

const Estadisticas = () => {
    const [fechasTemporales, setFechasTemporales] = useState([null, null]);
    const [fechasActivas, setFechasActivas] = useState({ startDate: null, endDate: null });
    const [productosVendidos, setProductosVendidos] = useState([]);
    const [ingredientesUtilizados, setIngredientesUtilizados] = useState([]);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState(null);
    const [totalProductosVendidos, setTotalProductosVendidos] = useState(0);
    const [searchProductos, setSearchProductos] = useState('');
    const [searchIngredientes, setSearchIngredientes] = useState('');

    const setFixedTimes = (date, isStart) => {
        if (!date) return null;
        const newDate = new Date(date);
        if (isStart) {
            newDate.setHours(0, 0, 0, 0);
        } else {
            newDate.setHours(23, 59, 59, 999);
        }
        return newDate;
    };

    const restablecerFechas = () => {
        const hoy = new Date();
        const hoyInicio = setFixedTimes(hoy, true);
        const hoyFin = setFixedTimes(hoy, false);
        setFechasTemporales([hoyInicio, hoyFin]);
        setFechasActivas({ startDate: hoyInicio, endDate: hoyFin });
    };

    const obtenerDatos = async () => {
        if (!fechasActivas.startDate || !fechasActivas.endDate) return;

        setLoading(true);
        setError(null);

        try {
            const params = {
                fechaInicio: format(fechasActivas.startDate, "yyyy-MM-dd'T'HH:mm:ss"),
                fechaFin: format(fechasActivas.endDate, "yyyy-MM-dd'T'HH:mm:ss")
            };

            const [productosRes, ingredientesRes] = await Promise.all([
                axios.get(`${API_BASE_URL}/reportes/productos-mas-vendidos`, { params }),
                axios.get(`${API_BASE_URL}/reportes/ingredientes-utilizados`, { params })
            ]);

            setProductosVendidos(productosRes.data);
            setIngredientesUtilizados(ingredientesRes.data);

            // Calcular totales
            const totalVendido = productosRes.data.reduce((sum, producto) => sum + producto.cantidadVendida, 0);
            setTotalProductosVendidos(totalVendido);
        } catch (err) {
            setError('Error al obtener los datos. Verifica la conexión con el servidor.');
            console.error('Error fetching data:', err);
        } finally {
            setLoading(false);
        }
    };

    const handleDateChange = (dates) => {
        const [start, end] = dates;
        setFechasTemporales(dates);
        if (start && end) {
            setFechasActivas({
                startDate: setFixedTimes(start, true),
                endDate: setFixedTimes(end, false)
            });
        }
    };

    const generarPDFReporte = () => {
        const pdf = new jsPDF();

        // Título del reporte
        pdf.setFontSize(18);
        pdf.text('Reporte de Estadísticas de Ventas', 105, 15, null, null, 'center');
        pdf.setFontSize(12);
        pdf.text(
            `Período: ${format(fechasActivas.startDate, 'dd/MM/yyyy')} - ${format(fechasActivas.endDate, 'dd/MM/yyyy')}`,
            105, 25, null, null, 'center'
        );

        // Estadísticas resumidas
        pdf.setFontSize(14);
        pdf.text(`Total de productos vendidos: ${totalProductosVendidos}`, 20, 35);

        // Tabla de productos vendidos
        pdf.setFontSize(16);
        pdf.text('Productos Vendidos', 20, 50);

        const productosData = productosVendidos.map((producto, index) => [
            index + 1,
            producto.nombreProducto,
            producto.cantidadVendida
        ]);

        autoTable(pdf, {
            startY: 55,
            head: [['#', 'Producto', 'Cantidad Vendida']],
            body: productosData,
            theme: 'grid',
            headStyles: { fillColor: [41, 128, 185] },
            styles: { fontSize: 10 }
        });

        // Tabla de ingredientes utilizados
        const tableY = pdf.lastAutoTable.finalY + 10;
        pdf.setFontSize(16);
        pdf.text('Ingredientes Utilizados', 20, tableY);

        const ingredientesData = ingredientesUtilizados.map(ingrediente => [
            ingrediente.nombreIngrediente,
            `${ingrediente.cantidadUsada.toFixed(2)} ${ingrediente.unidadMedida}`
        ]);

        autoTable(pdf, {
            startY: tableY + 5,
            head: [['Ingrediente', 'Cantidad Utilizada']],
            body: ingredientesData,
            theme: 'grid',
            headStyles: { fillColor: [39, 174, 96] },
            styles: { fontSize: 10 }
        });

        pdf.save(`reporte-estadisticas-${moment().format('YYYYMMDD')}.pdf`);
    };

    // Filtrar productos por término de búsqueda
    const filteredProductos = productosVendidos.filter(producto =>
        producto.nombreProducto.toLowerCase().includes(searchProductos.toLowerCase())
    );

    // Filtrar ingredientes por término de búsqueda
    const filteredIngredientes = ingredientesUtilizados.filter(ingrediente =>
        ingrediente.nombreIngrediente.toLowerCase().includes(searchIngredientes.toLowerCase())
    );

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

    useEffect(() => {
        restablecerFechas();
    }, []);

    useEffect(() => {
        if (fechasActivas.startDate && fechasActivas.endDate) {
            obtenerDatos();
        }
    }, [fechasActivas]);

    return (
        <Card className="card-reporte" id="reporte-estadisticas">
            {error && <Alert message={error} type="error" showIcon className="error-alert" />}

            <div className="filtros-container">
                <DatePicker
                    selectsRange
                    startDate={fechasTemporales[0]}
                    endDate={fechasTemporales[1]}
                    onChange={handleDateChange}
                    minDate={subYears(new Date(), 1)}
                    maxDate={addYears(new Date(), 1)}
                    dateFormat="dd/MM/yyyy"
                    className="custom-datepicker"
                    popperPlacement="bottom-start"
                    placeholderText="Seleccione un rango de fechas"
                    isClearable
                />
                <Button
                    type="default"
                    onClick={restablecerFechas}
                    className="reset-button"
                >
                    Hoy
                </Button>
                {fechasActivas.startDate && fechasActivas.endDate && (
                    <Tag color="blue" className="date-range-tag">
                        {format(fechasActivas.startDate, 'dd/MM/yyyy')} -{' '}
                        {format(fechasActivas.endDate, 'dd/MM/yyyy')}
                    </Tag>
                )}
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

                    <Row gutter={[24, 24]} className="tablas-container">
                        {/* Tabla de Productos Vendidos */}
                        <Col xs={24} md={12} className="tabla-col">
                            <Card
                                title={
                                    <div className="section-header">
                                        <Title level={4} className="section-title">
                                            <ShoppingOutlined /> Productos Vendidos
                                        </Title>
                                    </div>
                                }
                                className="stats-card"
                                extra={
                                    <Input
                                        placeholder="Buscar producto"
                                        value={searchProductos}
                                        onChange={(e) => setSearchProductos(e.target.value)}
                                        style={{ width: 200 }}
                                    />
                                }
                            >
                                <Table
                                    dataSource={filteredProductos.map((item, index) => ({ ...item, key: item.productoId, index }))}
                                    columns={columnasProductos}
                                    pagination={{ pageSize: 10 }}
                                    size="middle"
                                    scroll={{ y: 400 }}
                                />
                            </Card>
                        </Col>

                        {/* Tabla de Ingredientes Utilizados */}
                        <Col xs={24} md={12} className="tabla-col">
                            <Card
                                title={
                                    <Title level={4} className="section-title">
                                        <BarChartOutlined /> Ingredientes Utilizados
                                    </Title>
                                }
                                className="stats-card"
                                extra={
                                    <Input
                                        placeholder="Buscar ingrediente"
                                        value={searchIngredientes}
                                        onChange={(e) => setSearchIngredientes(e.target.value)}
                                        style={{ width: 200 }}
                                    />
                                }
                            >
                                <Table
                                    dataSource={filteredIngredientes.map(ingrediente => ({ ...ingrediente, key: ingrediente.ingredienteId }))}
                                    columns={columnasIngredientes}
                                    pagination={{ pageSize: 10 }}
                                    size="middle"
                                    scroll={{ y: 400 }}
                                />
                            </Card>
                        </Col>
                    </Row>
                </>
            )}
        </Card>
    );
};

export default Estadisticas;