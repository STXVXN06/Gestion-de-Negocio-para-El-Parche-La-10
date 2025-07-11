import React, { useState, useEffect } from 'react';
import axios from 'axios';
import {
  Tabs, Card, Statistic, Table, List, Input, Button, Tag, Row, Col,
  Tooltip, Spin, Alert
} from 'antd';
import {
  DollarOutlined, ShoppingOutlined, ArrowUpOutlined, ArrowDownOutlined,
  DownloadOutlined, PlusOutlined, CheckOutlined, DeleteOutlined
} from '@ant-design/icons';
import moment from 'moment';
import jsPDF from 'jspdf';

// eslint-disable-next-line
import DatePicker from 'react-datepicker';
import 'react-datepicker/dist/react-datepicker.css';
import { format, startOfDay, endOfDay, subYears, addYears } from 'date-fns';
import './Reporte.css';

const { TabPane } = Tabs;

const API_BASE_URL = 'http://localhost:9090/api';

const Reporte = () => {
  const [activeTab, setActiveTab] = useState('ganancias');
  const [fechasTemporales, setFechasTemporales] = useState([null, null]);
  const [fechasActivas, setFechasActivas] = useState({
    startDate: null,
    endDate: null
  });
  const [ganancias, setGanancias] = useState(0);
  const [ingresos, setIngresos] = useState(0);
  const [gastos, setGastos] = useState(0);
  const [transacciones, setTransacciones] = useState([]);
  const [todosIngredientesBajos, setTodosIngredientesBajos] = useState([]);
  const [ingredientesBajosAMostrar, setIngredientesBajosAMostrar] = useState([]);
  const [nuevoItem, setNuevoItem] = useState('');
  const [listaCompras, setListaCompras] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  // Función para establecer horas fijas
  const setFixedTimes = (date, isStart) => {
    const newDate = new Date(date);
    if (isStart) {
      newDate.setHours(0, 0, 0, 0); // 00:00 AM
    } else {
      newDate.setHours(23, 59, 59, 999); // 11:59 PM
    }
    return newDate;
  };

  // Restablecer a fecha actual con horas fijas
  const restablecerFechas = () => {
    const hoy = new Date();
    const hoyInicio = setFixedTimes(hoy, true);
    const hoyFin = setFixedTimes(hoy, false);

    setFechasTemporales([hoyInicio, hoyFin]);
    setFechasActivas({
      startDate: hoyInicio,
      endDate: hoyFin
    });
  };

  // Obtener datos de la API
  const obtenerDatos = async () => {
    if (!fechasActivas.startDate || !fechasActivas.endDate) return;

    setLoading(true);
    setError(null);

    try {
      const params = {
        fechaInicio: format(fechasActivas.startDate, "yyyy-MM-dd'T'HH:mm:ss"),
        fechaFin: format(fechasActivas.endDate, "yyyy-MM-dd'T'HH:mm:ss")
      };

      // Obtener todos los datos necesarios
      const [gananciasRes, ingresosRes, gastosRes, transaccionesRes, ingredientesRes] = await Promise.all([
        axios.get(`${API_BASE_URL}/reportes/ganancias`, { params }),
        axios.get(`${API_BASE_URL}/reportes/ingresos`, { params }),
        axios.get(`${API_BASE_URL}/reportes/egresos`, { params }),
        axios.get(`${API_BASE_URL}/movimientosCaja`),
        axios.get(`${API_BASE_URL}/ingredientes/bajo-stock`)
      ]);

      setGanancias(gananciasRes.data);
      setIngresos(ingresosRes.data);
      setGastos(gastosRes.data);
      setTodosIngredientesBajos(ingredientesRes.data);
      setIngredientesBajosAMostrar(ingredientesRes.data);

      // Filtrar y ordenar transacciones
      const transaccionesFiltradas = transaccionesRes.data
        .filter(t => {
          const fechaTrans = new Date(t.fecha);
          return fechaTrans >= fechasActivas.startDate && fechaTrans <= fechasActivas.endDate;
        })
        .sort((a, b) => new Date(b.fecha) - new Date(a.fecha)); // Orden descendente (más reciente primero)

      setTransacciones(transaccionesFiltradas);

    } catch (err) {
      setError('Error al obtener los datos. Verifica la conexión con el servidor.');
      console.error('Error fetching data:', err);
    } finally {
      setLoading(false);
    }
  };

  // Manejar cambios en el calendario
  const handleDateChange = (dates) => {
    const [start, end] = dates;

    // Crear copias de las fechas para no mutar el estado directamente
    const adjustedDates = [...dates];

    // Ajustar la hora de la fecha fin si existe
    if (end) {
      const newEnd = new Date(end);
      newEnd.setHours(23, 59, 59, 999);
      adjustedDates[1] = newEnd;
    }

    setFechasTemporales(adjustedDates);

    if (start && end) {
      setFechasActivas({
        startDate: setFixedTimes(start, true),
        endDate: setFixedTimes(end, false)
      });
    }
  };

  // Agregar un nuevo ítem a la lista de compras
  const agregarItem = () => {
    if (nuevoItem.trim() !== '') {
      setListaCompras([...listaCompras, {
        id: Date.now(),
        nombre: nuevoItem,
        completado: false,
        esIngrediente: false
      }]);
      setNuevoItem('');
    }
  };

  // Agregar ingrediente a la lista de compras
  const agregarIngredienteALista = (ingrediente) => {
    const nuevoItem = {
      id: ingrediente.id,
      nombre: ingrediente.nombre,
      cantidad: `${(ingrediente.cantidadMinima - ingrediente.cantidadActual).toFixed(2)} ${ingrediente.unidadMedida?.simbolo || ''}`,
      completado: false,
      esIngrediente: true
    };

    setListaCompras([...listaCompras, nuevoItem]);

    // Eliminar de la lista de ingredientes bajos
    setIngredientesBajosAMostrar(
      ingredientesBajosAMostrar.filter(ing => ing.id !== ingrediente.id)
    );
  };

  // Marcar item como completado
  const toggleCompletado = (id) => {
    setListaCompras(
      listaCompras.map(item =>
        item.id === id ? { ...item, completado: !item.completado } : item
      )
    );
  };

  // Eliminar item de la lista
  const eliminarItem = (id) => {
    const item = listaCompras.find(item => item.id === id);

    // Si es un ingrediente, volver a agregarlo a la lista de ingredientes bajos
    if (item && item.esIngrediente) {
      const ingredienteOriginal = todosIngredientesBajos.find(ing => ing.id === id);
      if (ingredienteOriginal) {
        setIngredientesBajosAMostrar([...ingredientesBajosAMostrar, ingredienteOriginal]);
      }
    }

    setListaCompras(listaCompras.filter(item => item.id !== id));
  };

  // Generar PDF del reporte de ganancias
  const generarPDFReporteGanancias = () => {
    const pdf = new jsPDF('p', 'mm', 'a4');

    // Título
    pdf.setFontSize(18);
    pdf.text('Reporte de Ganancias', 105, 15, null, null, 'center');

    // Período
    pdf.setFontSize(12);
    pdf.text(
      `Período: ${format(fechasActivas.startDate, 'dd/MM/yyyy HH:mm')} - ${format(fechasActivas.endDate, 'dd/MM/yyyy HH:mm')}`,
      105, 25, null, null, 'center'
    );

    // Estadísticas
    pdf.setFontSize(14);
    pdf.text(`Ganancias Netas: $${ganancias.toLocaleString()}`, 20, 40);
    pdf.text(`Ingresos Totales: $${ingresos.toLocaleString()}`, 20, 50);
    pdf.text(`Gastos Totales: $${gastos.toLocaleString()}`, 20, 60);

    // Tabla de transacciones
    pdf.setFontSize(16);
    pdf.text('Transacciones', 20, 75);

    // Encabezados de la tabla
    pdf.setFontSize(12);
    const headers = ['Descripción', 'Fecha', 'Tipo', 'Monto', 'Estado'];
    const colWidths = [70, 35, 25, 25, 25];
    const colPositions = [20, 90, 125, 150, 175];

    // Dibujar encabezados
    headers.forEach((header, i) => {
      pdf.text(header, colPositions[i], 85);
    });

    // Dibujar línea bajo encabezados
    pdf.line(20, 87, 190, 87);

    // Filas de datos
    let yPos = 95;
    transacciones.forEach(trans => {
      if (yPos > 280) {
        pdf.addPage();
        yPos = 20;
        // Volver a dibujar encabezados en nueva página
        headers.forEach((header, i) => {
          pdf.text(header, colPositions[i], yPos);
        });
        pdf.line(20, yPos + 2, 190, yPos + 2);
        yPos += 15;
      }

      // Descripción
      const descLines = pdf.splitTextToSize(trans.descripcion, colWidths[0]);
      pdf.text(descLines, colPositions[0], yPos);

      // Fecha
      pdf.text(moment(trans.fecha).format('DD/MM HH:mm'), colPositions[1], yPos);

      // Tipo
      pdf.text(trans.tipo, colPositions[2], yPos);

      // Monto
      const montoText = trans.tipo === 'INGRESO' ? `+$${trans.monto.toLocaleString()}` : `-$${trans.monto.toLocaleString()}`;
      pdf.text(montoText, colPositions[3], yPos);

      // Estado (nueva columna)
      pdf.text(trans.estado || 'ACTIVO', colPositions[4], yPos);

      // Incrementar posición Y (ajustar si la descripción es multilínea)
      yPos += Math.max(10, descLines.length * 7);
    });

    pdf.save(`reporte-ganancias-${moment().format('YYYYMMDD')}.pdf`);
  };

  // Generar PDF de la lista de compras
  const generarPDFListaCompras = () => {
    const pdf = new jsPDF();

    // Encabezado
    pdf.setFontSize(18);
    pdf.text('Lista de Compras', 105, 15, null, null, 'center');
    pdf.setFontSize(12);
    pdf.text(`Fecha: ${moment().format('DD/MM/YYYY')}`, 15, 25);

    // Contenido
    pdf.setFontSize(14);
    pdf.text('Ítems:', 15, 35);

    pdf.setFontSize(12);
    let yPos = 45;
    listaCompras.forEach((item, index) => {
      if (yPos > 280) {
        pdf.addPage();
        yPos = 15;
      }

      const texto = `${index + 1}. ${item.nombre}${item.cantidad ? ` - ${item.cantidad}` : ''}`;
      pdf.text(texto, 20, yPos);
      yPos += 10;
    });

    pdf.save(`lista-compras-${moment().format('YYYYMMDD')}.pdf`);
  };

  // Columnas para las tablas
  const columnasTransacciones = [
    {
      title: 'Descripción',
      dataIndex: 'descripcion',
      key: 'descripcion',
      render: (text, record) => (
        <div>
          <div><strong>{text}</strong></div>
          <div className="fecha-transaccion">
            {moment(record.fecha).format('DD/MM/YYYY HH:mm')}
          </div>
        </div>
      )
    },
    {
      title: 'Tipo',
      dataIndex: 'tipo',
      key: 'tipo',
      render: (tipo) => (
        <Tag color={tipo === 'INGRESO' ? 'green' : 'red'}>
          {tipo}
        </Tag>
      )
    },
    {
      title: 'Monto',
      dataIndex: 'monto',
      key: 'monto',
      render: (monto, record) => (
        <div className="monto-transaccion">
          {record.tipo === 'INGRESO' ? '+' : '-'}${monto.toLocaleString()}
        </div>
      )
    },
    {
      title: 'Estado',
      dataIndex: 'estado',
      key: 'estado',
      render: (estado) => (
        <Tag color={estado === 'ANULADO' ? 'red' : 'blue'}>
          {estado || 'ACTIVO'}
        </Tag>
      )
    },
  ];

  // Inicializar con fecha actual al montar
  useEffect(() => {
    restablecerFechas();
  }, []);

  // Obtener datos automáticamente al cambiar fechas activas
  useEffect(() => {
    if (fechasActivas.startDate && fechasActivas.endDate) {
      obtenerDatos();
    }
  }, [fechasActivas]);

  return (
    <div className="reporte-container">
      <Tabs
        activeKey={activeTab}
        onChange={setActiveTab}
        className="custom-tabs"
        tabBarExtraContent={
          <Button
            type="primary"
            icon={<DownloadOutlined />}
            onClick={activeTab === 'ganancias' ? generarPDFReporteGanancias : generarPDFListaCompras}
            className="download-pdf-btn"
          >
            Descargar PDF
          </Button>
        }
      >
        <TabPane
          tab={
            <span className="tab-title">
              <DollarOutlined />
              Reporte de Ganancias
            </span>
          }
          key="ganancias"
        >
          <Card className="card-reporte" id="reporte-ganancias">
            {error && <Alert message={error} type="error" showIcon className="error-alert" />}

            <div className="filtros-container">
              <DatePicker
                selectsRange
                startDate={fechasTemporales[0]}
                endDate={fechasTemporales[1]}
                onChange={handleDateChange}
                minDate={subYears(new Date(), 1)}
                maxDate={addYears(new Date(), 1)}
                showTimeSelect
                timeFormat="HH:mm"
                timeIntervals={15}
                dateFormat="dd/MM/yyyy HH:mm"
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
                  {format(fechasActivas.startDate, 'dd/MM/yyyy HH:mm')} -{' '}
                  {format(fechasActivas.endDate, 'dd/MM/yyyy HH:mm')}
                </Tag>
              )}
            </div>

            {loading ? (
              <div className="loading-container">
                <Spin size="large" />
                <p>Cargando datos...</p>
              </div>
            ) : (
              <>
                <Row gutter={16} className="stats-row">
                  <Col xs={24} sm={24} md={8} lg={8} xl={8}>
                    <Card className="stat-card">
                      <Statistic
                        title="Ganancias Netas"
                        value={ganancias}
                        precision={0}
                        valueStyle={{ color: ganancias >= 0 ? '#3f8600' : '#cf1322' }}
                        prefix="$"
                        suffix={ganancias >= 0 ? <ArrowUpOutlined /> : <ArrowDownOutlined />}
                      />
                      <div className="stat-comparison">
                        Hoy
                      </div>
                    </Card>
                  </Col>
                  <Col xs={24} sm={24} md={8} lg={8} xl={8}>
                    <Card className="stat-card">
                      <Statistic
                        title="Ingresos Totales"
                        value={ingresos}
                        precision={0}
                        valueStyle={{ color: '#3f8600' }}
                        prefix="$"
                      />
                      <div className="stat-comparison">
                        {transacciones.filter(t => t.tipo === 'INGRESO').length} transacciones
                      </div>
                    </Card>
                  </Col>
                  <Col xs={24} sm={24} md={8} lg={8} xl={8}>
                    <Card className="stat-card">
                      <Statistic
                        title="Gastos Totales"
                        value={gastos}
                        precision={0}
                        valueStyle={{ color: '#cf1322' }}
                        prefix="$"
                      />
                      <div className="stat-comparison">
                        {transacciones.filter(t => t.tipo === 'EGRESO').length} transacciones
                      </div>
                    </Card>
                  </Col>
                </Row>

                <Card title="Transacciones Recientes" className="transactions-card">
                  <Table
                    dataSource={transacciones}
                    columns={columnasTransacciones}
                    pagination={{ pageSize: 10 }}
                    rowKey="id"
                    size="middle"
                    rowClassName={(record) => record.estado === 'ANULADO' ? 'transaccion-anulada' : ''}
                  />
                </Card>
              </>
            )}
          </Card>
        </TabPane>

        <TabPane
          tab={
            <span className="tab-title">
              <ShoppingOutlined />
              Lista de Compras
            </span>
          }
          key="compras"
        >
          <Card className="card-compras">
            {loading ? (
              <div className="loading-container">
                <Spin size="large" />
                <p>Cargando ingredientes...</p>
              </div>
            ) : (
              <div className="compras-grid">
                <div className="ingredientes-container">
                  <h3 className="section-title">Ingredientes con Stock Bajo</h3>
                  {ingredientesBajosAMostrar.length > 0 ? (
                    <List
                      dataSource={ingredientesBajosAMostrar}
                      renderItem={item => (
                        <List.Item className="ingrediente-item">
                          <div className="ingrediente-info">
                            <div className="ingrediente-header">
                              <div>
                                <div className="ingrediente-nombre">{item.nombre}</div>
                                <div className="stock-info">
                                  <span className="stock-label">Stock Actual:</span>
                                  <span className="stock-value">{item.cantidadActual} {item.unidadMedida?.simbolo || ''}</span>
                                  <span className="stock-label">Mínimo:</span>
                                  <span className="stock-value">{item.cantidadMinima} {item.unidadMedida?.simbolo || ''}</span>
                                </div>
                              </div>
                              <Tooltip title="Agregar a lista de compras">
                                <Button
                                  type="primary"
                                  shape="circle"
                                  icon={<PlusOutlined />}
                                  onClick={() => agregarIngredienteALista(item)}
                                  className="add-ingredient-btn"
                                />
                              </Tooltip>
                            </div>
                          </div>
                        </List.Item>
                      )}
                      className="ingredientes-list"
                    />
                  ) : (
                    <Alert
                      message="No hay ingredientes con stock bajo"
                      type="success"
                      showIcon
                      className="empty-alert"
                    />
                  )}
                </div>

                <div className="lista-compras-container">
                  <div className="lista-header">
                    <h3 className="section-title">Mi Lista de Compras</h3>
                    <Tag color="blue" className="total-tag">
                      Total: {listaCompras.length} ítem{listaCompras.length !== 1 ? 's' : ''}
                    </Tag>
                  </div>

                  {listaCompras.length > 0 ? (
                    <List
                      dataSource={listaCompras}
                      renderItem={item => (
                        <List.Item
                          className={`compra-item ${item.completado ? 'completed' : ''}`}
                          actions={[
                            <Tooltip title={item.completado ? "Marcar como pendiente" : "Marcar como completado"}>
                              <Button
                                type="text"
                                icon={<CheckOutlined />}
                                onClick={() => toggleCompletado(item.id)}
                                className={`complete-btn ${item.completado ? 'completed' : ''}`}
                              />
                            </Tooltip>,
                            <Tooltip title="Eliminar">
                              <Button
                                type="text"
                                icon={<DeleteOutlined />}
                                onClick={() => eliminarItem(item.id)}
                                className="delete-btn"
                              />
                            </Tooltip>
                          ]}
                        >
                          <List.Item.Meta
                            title={
                              <div className="item-title-container">
                                <span className={item.completado ? 'completed-text' : ''}>{item.nombre}</span>
                                {item.cantidad && (
                                  <Tag color="geekblue" className="quantity-tag">
                                    {item.cantidad}
                                  </Tag>
                                )}
                              </div>
                            }
                          />
                        </List.Item>
                      )}
                      className="compras-list"
                    />
                  ) : (
                    <Alert
                      message="Tu lista de compras está vacía"
                      description="Agrega ingredientes desde el panel izquierdo o añade nuevos ítem manualmente"
                      type="info"
                      showIcon
                      className="empty-alert"
                    />
                  )}

                  <div className="add-item-container">
                    <Input
                      placeholder="Agregar ítem a la lista (ej: Servilletas, Bolsas, etc.)"
                      value={nuevoItem}
                      onChange={(e) => setNuevoItem(e.target.value)}
                      onPressEnter={agregarItem}
                      className="add-item-input"
                    />
                    <Button
                      type="primary"
                      icon={<PlusOutlined />}
                      onClick={agregarItem}
                      className="add-item-button"
                      disabled={!nuevoItem.trim()}
                    />
                  </div>
                </div>
              </div>
            )}
          </Card>
        </TabPane>
      </Tabs>
    </div>
  );
};

export default Reporte;