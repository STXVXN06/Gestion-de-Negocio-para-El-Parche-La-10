import React, { useState, useEffect } from 'react';
import { Card, Statistic, Table, Tag, Row, Col, Button, Spin, Alert } from 'antd';
import { ArrowUpOutlined, ArrowDownOutlined, DownloadOutlined } from '@ant-design/icons';
import moment from 'moment';
import jsPDF from 'jspdf';
import DatePicker from 'react-datepicker';
import 'react-datepicker/dist/react-datepicker.css';
import { format, startOfDay, endOfDay } from 'date-fns';
import './Reporte.css';
import api from '../api';

const API_BASE_URL = '/api';

const ReporteGanancias = () => {
  const [ganancias, setGanancias] = useState(0);
  const [ingresos, setIngresos] = useState(0);
  const [gastos, setGastos] = useState(0);
  const [transacciones, setTransacciones] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  const getTodayRange = () => {
    const hoy = new Date();
    const start = startOfDay(hoy);
    const end = endOfDay(hoy);
    return { start, end };
  };

  const [fechaInicio, setFechaInicio] = useState(getTodayRange().start);
  const [fechaFin, setFechaFin] = useState(getTodayRange().end);

  const restablecerFechas = () => {
    const { start, end } = getTodayRange();
    setFechaInicio(start);
    setFechaFin(end);
  };

  // Función para obtener descripción según el tipo de movimiento
  const getDescripcionMovimiento = (movimiento) => {
    if (movimiento.pedido && movimiento.pedido.id) {
      return `Pedido #${movimiento.pedido.id} - ${movimiento.pedido.estado}`;
    } else if (movimiento.compra && movimiento.compra.id) {
      return movimiento.descripcion || `Compra #${movimiento.compra.id}`;
    } else {
      return movimiento.descripcion || 'Movimiento manual';
    }
  };

  // Función para obtener el origen del movimiento
  const getOrigenMovimiento = (movimiento) => {
    if (movimiento.pedido && movimiento.pedido.id) {
      return 'PEDIDO';
    } else if (movimiento.compra && movimiento.compra.id) {
      return 'COMPRA';
    } else {
      return 'MANUAL';
    }
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

      const [gananciasRes, ingresosRes, gastosRes, transaccionesRes] = await Promise.all([
        api.get(`${API_BASE_URL}/reportes/ganancias`, { params }),
        api.get(`${API_BASE_URL}/reportes/ingresos`, { params }),
        api.get(`${API_BASE_URL}/reportes/egresos`, { params }),
        api.get(`${API_BASE_URL}/movimientosCaja`)
      ]);

      setGanancias(gananciasRes.data);
      setIngresos(ingresosRes.data);
      setGastos(gastosRes.data);

      // Procesar transacciones y limpiar referencias circulares
      const transaccionesFiltradas = transaccionesRes.data
        .map(t => ({
          id: t.id,
          tipo: t.tipo,
          descripcion: getDescripcionMovimiento(t),
          monto: t.monto,
          estado: t.estado,
          fecha: t.fecha,
          origen: getOrigenMovimiento(t),
          pedidoId: t.pedido?.id || null,
          compraId: t.compra?.id || null
        }))
        .filter(t => {
          const fechaTrans = new Date(t.fecha);
          return fechaTrans >= fechaInicio && fechaTrans <= fechaFin;
        })
        .sort((a, b) => new Date(b.fecha) - new Date(a.fecha));

      setTransacciones(transaccionesFiltradas);
    } catch (err) {
      setError('Error al obtener los datos. Verifica la conexión con el servidor.');
      console.error('Error fetching data:', err);
    } finally {
      setLoading(false);
    }
  };

  const generarPDFReporteGanancias = () => {
    const pdf = new jsPDF('p', 'mm', 'a4');
    pdf.setFontSize(18);
    pdf.text('Reporte de Ganancias', 105, 15, null, null, 'center');
    pdf.setFontSize(12);
    pdf.text(
      `Período: ${format(fechaInicio, 'dd/MM/yyyy HH:mm')} - ${format(fechaFin, 'dd/MM/yyyy HH:mm')}`,
      105, 25, null, null, 'center'
    );
    pdf.setFontSize(14);
    pdf.text(`Ganancias Netas: $${ganancias.toLocaleString()}`, 20, 40);
    pdf.text(`Ingresos Totales: $${ingresos.toLocaleString()}`, 20, 50);
    pdf.text(`Gastos Totales: $${gastos.toLocaleString()}`, 20, 60);
    pdf.setFontSize(16);
    pdf.text('Transacciones', 20, 75);
    pdf.setFontSize(12);
    const headers = ['Descripción', 'Origen', 'Tipo', 'Monto', 'Estado'];
    const colPositions = [20, 80, 110, 135, 165];
    headers.forEach((header, i) => {
      pdf.text(header, colPositions[i], 85);
    });
    pdf.line(20, 87, 190, 87);
    let yPos = 95;
    transacciones.forEach(trans => {
      if (yPos > 280) {
        pdf.addPage();
        yPos = 20;
        headers.forEach((header, i) => {
          pdf.text(header, colPositions[i], yPos);
        });
        pdf.line(20, yPos + 2, 190, yPos + 2);
        yPos += 15;
      }
      const descLines = pdf.splitTextToSize(trans.descripcion, 55);
      pdf.text(descLines, colPositions[0], yPos);
      pdf.text(trans.origen, colPositions[1], yPos);
      pdf.text(trans.tipo, colPositions[2], yPos);
      const montoText = trans.tipo === 'INGRESO' ? `+$${trans.monto.toLocaleString()}` : `-$${trans.monto.toLocaleString()}`;
      pdf.text(montoText, colPositions[3], yPos);
      pdf.text(trans.estado || 'activo', colPositions[4], yPos);
      yPos += Math.max(10, descLines.length * 7);
    });
    pdf.save(`reporte-ganancias-${moment().format('YYYYMMDD')}.pdf`);
  };

  const columnasTransacciones = [
    {
      title: 'Descripción',
      key: 'descripcion',
      render: (_, record) => (
        <div>
          <div><strong>{record.descripcion}</strong></div>
          <div className="fecha-transaccion">
            {moment(record.fecha).format('DD/MM/YYYY HH:mm')}
          </div>
          <Tag 
            color={
              record.origen === 'PEDIDO' ? 'blue' : 
              record.origen === 'COMPRA' ? 'orange' : 
              'purple'
            }
            style={{ marginTop: 4 }}
          >
            {record.origen}
          </Tag>
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
      render: (monto, record) => {
        const color = record.tipo === 'INGRESO' ? '#3f8600' : '#cf1322';
        const signo = record.tipo === 'INGRESO' ? '+' : '-';
        return (
          <div style={{ color, fontWeight: 'bold', fontSize: '16px' }}>
            {signo}${monto?.toLocaleString()}
          </div>
        );
      },
      align: 'right'
    },
    {
      title: 'Estado',
      dataIndex: 'estado',
      key: 'estado',
      render: (estado) => (
        <Tag color={estado === 'ANULADO' ? 'red' : 'green'}>
          {estado || 'activo'}
        </Tag>
      )
    },
  ];

  useEffect(() => {
    restablecerFechas();
  }, []);

  useEffect(() => {
    if (fechaInicio && fechaFin) {
      obtenerDatos();
    }
  }, [fechaInicio, fechaFin]);

  return (
    <Card className="card-reporte" id="reporte-ganancias">
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
          onClick={generarPDFReporteGanancias}
          className="download-pdf-btn"
        >
          Descargar PDF
        </Button>
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
                <div className="stat-comparison">Período seleccionado</div>
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
                  {transacciones.filter(t => t.tipo === 'INGRESO' && t.estado !== 'ANULADO').length} transacciones
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
                  {transacciones.filter(t => t.tipo === 'EGRESO' && t.estado !== 'ANULADO').length} transacciones
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
  );
};

export default ReporteGanancias;