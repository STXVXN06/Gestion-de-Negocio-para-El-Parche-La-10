import React, { useState, useEffect } from 'react';
import axios from 'axios';
import {
  Tabs, DatePicker, Card, Statistic, Table, List, Input, Button, Tag, Row, Col,
  Progress, Tooltip, Spin, Alert
} from 'antd';
import {
  DollarOutlined, ShoppingOutlined, ArrowUpOutlined, ArrowDownOutlined,
  DownloadOutlined, PlusOutlined, CheckOutlined, DeleteOutlined
} from '@ant-design/icons';
import moment from 'moment';
import jsPDF from 'jspdf';
import html2canvas from 'html2canvas';

const { TabPane } = Tabs;
const { RangePicker } = DatePicker;

const API_BASE_URL = 'http://localhost:9090/api';

const Reporte = () => {
  const [activeTab, setActiveTab] = useState('ganancias');
  const [fechas, setFechas] = useState([
    moment().startOf('day'),
    moment().endOf('day')
  ]);
  const [ganancias, setGanancias] = useState(0);
  const [ingresos, setIngresos] = useState(0);
  const [gastos, setGastos] = useState(0);
  const [transacciones, setTransacciones] = useState([]);
  const [ingredientesBajos, setIngredientesBajos] = useState([]);
  const [nuevoItem, setNuevoItem] = useState('');
  const [listaCompras, setListaCompras] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  // Función para limitar fechas seleccionables
  const disabledDate = (current) => {
    // Permitir solo fechas dentro de 1 año hacia atrás y 1 año hacia adelante
    return current < moment().subtract(1, 'year').endOf('day') ||
      current > moment().add(1, 'year').endOf('day');
  };

  // Obtener datos de la API
  const obtenerDatos = async () => {
    setLoading(true);
    setError(null);

    try {
      // Formato corregido: fechas ISO con hora
      const params = {
        fechaInicio: fechas[0].toISOString(),
        fechaFin: fechas[1].toISOString()
      };

      const [gananciasRes, ingresosRes, gastosRes, transaccionesRes, ingredientesRes] = await Promise.all([
        axios.get(`${API_BASE_URL}/reportes/ganancias`, { params }),
        axios.get(`${API_BASE_URL}/reportes/ingresos`, { params }),
        axios.get(`${API_BASE_URL}/reportes/egresos`, { params }),
        axios.get(`${API_BASE_URL}/movimientosCaja`, { params }),
        axios.get(`${API_BASE_URL}/ingredientes/bajo-stock`)
      ]);

      setGanancias(gananciasRes.data);
      setIngresos(ingresosRes.data);
      setGastos(gastosRes.data);
      setTransacciones(transaccionesRes.data);
      setIngredientesBajos(ingredientesRes.data);

    } catch (err) {
      setError('Error al obtener los datos. Verifica la conexión con el servidor.');
      console.error('Error fetching data:', err);
    } finally {
      setLoading(false);
    }
  };

  // Manejar cambio de fechas (CORREGIDO)
  const cambiarFechas = (dates) => {
    if (!dates || dates.length !== 2) {
      // Resetear a HOY si se cancela
      setFechas([moment().startOf('day'), moment().endOf('day')]);
      return;
    }

    // Ajustar a horas fijas (00:00:00 y 23:59:59)
    const fechaInicio = dates[0].startOf('day');
    const fechaFin = dates[1].endOf('day');

    setFechas([fechaInicio, fechaFin]);
  };

  // Agregar un nuevo ítem a la lista de compras
  const agregarItem = () => {
    if (nuevoItem.trim() !== '') {
      setListaCompras([...listaCompras, {
        id: Date.now(),
        nombre: nuevoItem,
        completado: false
      }]);
      setNuevoItem('');
    }
  };

  // Agregar ingrediente a la lista de compras
  const agregarIngredienteALista = (ingrediente) => {
    setListaCompras([...listaCompras, {
      id: ingrediente.id,
      nombre: ingrediente.nombre,
      cantidad: `${(ingrediente.cantidadMinima - ingrediente.cantidadActual).toFixed(2)} ${ingrediente.unidadMedida?.simbolo || ''}`,
      completado: false
    }]);
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
    setListaCompras(listaCompras.filter(item => item.id !== id));
  };

  // Generar PDF del reporte de ganancias
  const generarPDFReporteGanancias = () => {
    const input = document.getElementById('reporte-ganancias');

    html2canvas(input, { scale: 2 }).then(canvas => {
      const imgData = canvas.toDataURL('image/png');
      const pdf = new jsPDF('p', 'mm', 'a4');
      const imgWidth = 210;
      const pageHeight = 297;
      const imgHeight = canvas.height * imgWidth / canvas.width;
      let heightLeft = imgHeight;
      let position = 0;

      pdf.addImage(imgData, 'PNG', 0, position, imgWidth, imgHeight);
      heightLeft -= pageHeight;

      while (heightLeft >= 0) {
        position = heightLeft - imgHeight;
        pdf.addPage();
        pdf.addImage(imgData, 'PNG', 0, position, imgWidth, imgHeight);
        heightLeft -= pageHeight;
      }

      pdf.save(`reporte-ganancias-${moment().format('YYYYMMDD')}.pdf`);
    });
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
          <div style={{ fontSize: 12, color: '#666' }}>
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
        <div style={{ fontWeight: 600 }}>
          {record.tipo === 'INGRESO' ? '+' : '-'}${monto.toLocaleString()}
        </div>
      )
    },
  ];

  // Inicializar datos al cargar
  useEffect(() => {
    obtenerDatos();
  }, [fechas]);

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
              <RangePicker
                showTime={{
                  format: 'HH:mm',
                  defaultValue: [moment().startOf('day'), moment().endOf('day')]
                }}
                format="YYYY-MM-DD HH:mm"
                value={fechas}
                onChange={cambiarFechas}
                disabledDate={disabledDate}
                allowClear={false}
              />
              <Tag color="blue" className="date-range-tag">
                {fechas[0].format('DD/MM/YYYY HH:mm')} - {fechas[1].format('DD/MM/YYYY HH:mm')}
              </Tag>
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
              <Row gutter={24}>
                <Col xs={24} md={12}>
                  <h3 className="section-title">Ingredientes con Stock Bajo</h3>
                  {ingredientesBajos.length > 0 ? (
                    <List
                      dataSource={ingredientesBajos}
                      renderItem={item => (
                        <List.Item className="ingrediente-item">
                          <div className="ingrediente-info">
                            <div className="ingrediente-header">
                              <span className="ingrediente-nombre">{item.nombre}</span>
                              <Button
                                type="primary"
                                size="small"
                                icon={<PlusOutlined />}
                                onClick={() => agregarIngredienteALista(item)}
                              >
                                Agregar
                              </Button>
                            </div>
                            <div className="stock-info">
                              <Progress
                                percent={Math.min(100, Math.round((item.cantidadActual / item.cantidadMinima) * 100))}
                                status={item.cantidadActual < item.cantidadMinima ? 'exception' : 'normal'}
                                showInfo={false}
                                strokeColor={item.cantidadActual < item.cantidadMinima ? '#ff4d4f' : '#52c41a'}
                              />
                              <div className="stock-details">
                                <span>Stock: {item.cantidadActual} {item.unidadMedida?.simbolo || ''}</span>
                                <span>Mínimo: {item.cantidadMinima} {item.unidadMedida?.simbolo || ''}</span>
                              </div>
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
                    />
                  )}
                </Col>

                <Col xs={24} md={12}>
                  <div className="lista-compras-container">
                    <div className="lista-header">
                      <h3 className="section-title">Mi Lista de Compras</h3>
                      <Tag color="blue">
                        Total: {listaCompras.length} ítems
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
                                  style={{ color: item.completado ? '#52c41a' : '#d9d9d9' }}
                                />
                              </Tooltip>,
                              <Tooltip title="Eliminar">
                                <Button
                                  type="text"
                                  icon={<DeleteOutlined />}
                                  onClick={() => eliminarItem(item.id)}
                                />
                              </Tooltip>
                            ]}
                          >
                            <List.Item.Meta
                              title={<span className={item.completado ? 'completed-text' : ''}>{item.nombre}</span>}
                              description={item.cantidad && <span>Cantidad: {item.cantidad}</span>}
                            />
                          </List.Item>
                        )}
                        className="compras-list"
                      />
                    ) : (
                      <Alert
                        message="Tu lista de compras está vacía"
                        description="Agrega ingredientes desde el panel izquierdo o añade nuevos ítems manualmente"
                        type="info"
                        showIcon
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
                </Col>
              </Row>
            )}
          </Card>
        </TabPane>
      </Tabs>

      <style jsx global>{`
        .reporte-container {
          max-width: 1200px;
          margin: 0 auto;
          padding: 20px;
          background: #f5f7fa;
          min-height: 100vh;
        }
        
        .custom-tabs .ant-tabs-nav {
          margin-bottom: 20px;
          background: #fff;
          padding: 0 20px;
          border-radius: 8px;
          box-shadow: 0 2px 8px rgba(0, 0, 0, 0.05);
        }
        
        .tab-title {
          display: flex;
          align-items: center;
          gap: 8px;
          font-weight: 500;
          font-size: 16px;
        }
        
        .card-reporte, .card-compras {
          border-radius: 10px;
          box-shadow: 0 4px 12px rgba(0, 0, 0, 0.05);
          background: #fff;
          overflow: hidden;
        }
        
        .error-alert {
          margin-bottom: 20px;
        }
        
        .filtros-container {
          display: flex;
          align-items: center;
          gap: 15px;
          margin-bottom: 25px;
          flex-wrap: wrap;
        }
        
        .date-range-tag {
          font-size: 14px;
          padding: 5px 10px;
        }
        
        .stats-row {
          margin-bottom: 25px;
        }
        
        .stat-card {
          border-radius: 8px;
          text-align: center;
          box-shadow: 0 2px 8px rgba(0, 0, 0, 0.05);
          border: none;
        }
        
        .stat-card .ant-statistic-title {
          font-size: 16px;
          color: #595959;
          font-weight: 500;
        }
        
        .stat-card .ant-statistic-content {
          font-size: 28px;
          font-weight: 600;
        }
        
        .stat-comparison {
          margin-top: 8px;
          font-size: 14px;
          color: #8c8c8c;
        }
        
        .transactions-card {
          border-radius: 8px;
          box-shadow: 0 2px 8px rgba(0, 0, 0, 0.05);
          border: none;
        }
        
        .section-title {
          color: #1890ff;
          margin-bottom: 15px;
          font-weight: 500;
          font-size: 18px;
        }
        
        .ingredientes-list .ingrediente-item {
          border: none;
          padding: 12px 0;
          border-bottom: 1px solid #f0f0f0;
        }
        
        .ingrediente-header {
          display: flex;
          justify-content: space-between;
          align-items: center;
          margin-bottom: 8px;
        }
        
        .ingrediente-nombre {
          font-weight: 500;
          font-size: 16px;
        }
        
        .stock-info {
          width: 100%;
        }
        
        .stock-details {
          display: flex;
          justify-content: space-between;
          margin-top: 8px;
          font-size: 14px;
          color: #595959;
        }
        
        .lista-compras-container {
          padding: 16px;
          border-radius: 8px;
          background: #fff;
          box-shadow: 0 2px 8px rgba(0, 0, 0, 0.05);
          height: 100%;
        }
        
        .lista-header {
          display: flex;
          justify-content: space-between;
          align-items: center;
          margin-bottom: 16px;
        }
        
        .compras-list .compra-item {
          padding: 12px;
          border-radius: 6px;
          margin-bottom: 8px;
          background: #f9f9f9;
          border: 1px solid #f0f0f0;
        }
        
        .compra-item.completed {
          background: #f6ffed;
          border-color: #b7eb8f;
        }
        
        .completed-text {
          text-decoration: line-through;
          color: #8c8c8c;
        }
        
        .add-item-container {
          display: flex;
          gap: 10px;
          margin-top: 20px;
        }
        
        .add-item-input {
          flex: 1;
        }
        
        .add-item-button {
          min-width: 40px;
        }
        
        .loading-container {
          text-align: center;
          padding: 40px 0;
        }
        
        @media (max-width: 768px) {
          .stats-row .ant-col {
            margin-bottom: 16px;
          }
          
          .filtros-container {
            flex-direction: column;
            align-items: flex-start;
          }
        }
      `}</style>
    </div>
  );
};

export default Reporte;