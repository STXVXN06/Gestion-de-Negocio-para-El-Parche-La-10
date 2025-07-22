import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { Card, Statistic, Table, Tag, Row, Col, Button, Spin, Alert } from 'antd';
import { ArrowUpOutlined, ArrowDownOutlined, DownloadOutlined } from '@ant-design/icons';
import moment from 'moment';
import jsPDF from 'jspdf';
import DatePicker from 'react-datepicker';
import 'react-datepicker/dist/react-datepicker.css';
import { format, subYears, addYears } from 'date-fns';
import './Reporte.css';

const API_BASE_URL = 'http://localhost:9090/api';

const ReporteGanancias = () => {
  const [fechasTemporales, setFechasTemporales] = useState([null, null]);
  const [fechasActivas, setFechasActivas] = useState({ startDate: null, endDate: null });
  const [ganancias, setGanancias] = useState(0);
  const [ingresos, setIngresos] = useState(0);
  const [gastos, setGastos] = useState(0);
  const [transacciones, setTransacciones] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  const setFixedTimes = (date, isStart) => {
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
      const [gananciasRes, ingresosRes, gastosRes, transaccionesRes] = await Promise.all([
        axios.get(`${API_BASE_URL}/reportes/ganancias`, { params }),
        axios.get(`${API_BASE_URL}/reportes/ingresos`, { params }),
        axios.get(`${API_BASE_URL}/reportes/egresos`, { params }),
        axios.get(`${API_BASE_URL}/movimientosCaja`)
      ]);
      setGanancias(gananciasRes.data);
      setIngresos(ingresosRes.data);
      setGastos(gastosRes.data);
      const transaccionesFiltradas = transaccionesRes.data
        .filter(t => {
          const fechaTrans = new Date(t.fecha);
          return fechaTrans >= fechasActivas.startDate && fechaTrans <= fechasActivas.endDate;
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

  const handleDateChange = (dates) => {
    const [start, end] = dates;
    const adjustedDates = [...dates];
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

  const generarPDFReporteGanancias = () => {
    const pdf = new jsPDF('p', 'mm', 'a4');
    pdf.setFontSize(18);
    pdf.text('Reporte de Ganancias', 105, 15, null, null, 'center');
    pdf.setFontSize(12);
    pdf.text(
      `Período: ${format(fechasActivas.startDate, 'dd/MM/yyyy HH:mm')} - ${format(fechasActivas.endDate, 'dd/MM/yyyy HH:mm')}`,
      105, 25, null, null, 'center'
    );
    pdf.setFontSize(14);
    pdf.text(`Ganancias Netas: $${ganancias.toLocaleString()}`, 20, 40);
    pdf.text(`Ingresos Totales: $${ingresos.toLocaleString()}`, 20, 50);
    pdf.text(`Gastos Totales: $${gastos.toLocaleString()}`, 20, 60);
    pdf.setFontSize(16);
    pdf.text('Transacciones', 20, 75);
    pdf.setFontSize(12);
    const headers = ['Descripción', 'Fecha', 'Tipo', 'Monto', 'Estado'];
    const colWidths = [70, 35, 25, 25, 25];
    const colPositions = [20, 90, 125, 150, 175];
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
      const descLines = pdf.splitTextToSize(trans.descripcion, colWidths[0]);
      pdf.text(descLines, colPositions[0], yPos);
      pdf.text(moment(trans.fecha).format('DD/MM HH:mm'), colPositions[1], yPos);
      pdf.text(trans.tipo, colPositions[2], yPos);
      const montoText = trans.tipo === 'INGRESO' ? `+$${trans.monto.toLocaleString()}` : `-$${trans.monto.toLocaleString()}`;
      pdf.text(montoText, colPositions[3], yPos);
      pdf.text(trans.estado || 'ACTIVO', colPositions[4], yPos);
      yPos += Math.max(10, descLines.length * 7);
    });
    pdf.save(`reporte-ganancias-${moment().format('YYYYMMDD')}.pdf`);
  };

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

  useEffect(() => {
    restablecerFechas();
  }, []);

  useEffect(() => {
    if (fechasActivas.startDate && fechasActivas.endDate) {
      obtenerDatos();
    }
  }, [fechasActivas]);

  return (
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
                <div className="stat-comparison">Hoy</div>
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
  );
};

export default ReporteGanancias;
