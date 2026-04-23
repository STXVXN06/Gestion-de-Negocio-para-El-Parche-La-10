import React, { useState, useEffect, useMemo, useCallback } from 'react';
import { Table, Button, Modal, Form, Input, Select, Tag, Space, message } from 'antd';
import { PlusOutlined, CloseCircleOutlined, FilterOutlined, ReloadOutlined } from '@ant-design/icons';
import moment from 'moment';
import DatePicker from 'react-datepicker';
import 'react-datepicker/dist/react-datepicker.css';
import { startOfDay, endOfDay } from 'date-fns';
import api from '../api';

const { Option } = Select;

/** Normaliza respuesta Spring `Page` o lista legacy (array). */
function normalizarPaginaMovimientos(data) {
  if (Array.isArray(data)) {
    return {
      content: data,
      totalElements: data.length,
      number: 0,
    };
  }
  const content = Array.isArray(data?.content) ? data.content : [];
  const totalElements = typeof data?.totalElements === 'number' ? data.totalElements : content.length;
  const number = typeof data?.number === 'number' ? data.number : 0;
  return { content, totalElements, number };
}

export default function ListadoMovimientosCaja() {
  const [movimientos, setMovimientos] = useState([]);
  const [totalElements, setTotalElements] = useState(0);
  const [page, setPage] = useState(0); // 0-based (Spring)
  const [pageSize, setPageSize] = useState(10);
  const [modalVisible, setModalVisible] = useState(false);
  const [form] = Form.useForm();
  const [loading, setLoading] = useState(false);
  const [tableLoading, setTableLoading] = useState(false);
  const [montoCaja, setMontoCaja] = useState(null);

  /** Filtros opcionales: rango con hora (ISO local) y tipo de movimiento. */
  const [fechaInicio, setFechaInicio] = useState(null);
  const [fechaFin, setFechaFin] = useState(null);
  const [filtroTipo, setFiltroTipo] = useState('todos');

  const getFiltrosApi = useCallback(() => {
    const params = {};
    if (fechaInicio && fechaFin) {
      params.fechaInicio = moment(fechaInicio).format('YYYY-MM-DDTHH:mm:ss');
      params.fechaFin = moment(fechaFin).format('YYYY-MM-DDTHH:mm:ss');
    }
    if (filtroTipo && filtroTipo !== 'todos') {
      params.tipo = filtroTipo;
    }
    return params;
  }, [fechaInicio, fechaFin, filtroTipo]);

  const loadMovimientos = useCallback(
    async (nextPage, nextSize, filtrosExtra = undefined) => {
      const filtros = filtrosExtra === undefined ? getFiltrosApi() : filtrosExtra;
      setTableLoading(true);
      try {
        const response = await api.get('/api/movimientosCaja', {
          params: { page: nextPage, size: nextSize, ...filtros },
        });
        const { content, totalElements: total, number } = normalizarPaginaMovimientos(response.data);
        setMovimientos(content);
        setTotalElements(total);
        setPage(number);
      } catch (error) {
        console.error('Error cargando movimientos:', error);
      } finally {
        setTableLoading(false);
      }
    },
    [getFiltrosApi]
  );

  useEffect(() => {
    loadMovimientos(0, pageSize, {});
    cargarCaja();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const cargarCaja = async () => {
    try {
      const response = await api.get('/api/caja');
      setMontoCaja(response.data.montoActual);
    } catch (error) {
      console.error('Error cargando la caja:', error);
    }
  };

  const aplicarFiltros = () => {
    if ((fechaInicio && !fechaFin) || (!fechaInicio && fechaFin)) {
      message.warning('Seleccione fecha y hora de inicio y fin, o deje ambas vacías.');
      return;
    }
    if (fechaInicio && fechaFin && moment(fechaInicio).isAfter(fechaFin)) {
      message.warning('La fecha de inicio no puede ser posterior a la fecha de fin.');
      return;
    }
    setPage(0);
    loadMovimientos(0, pageSize);
  };

  const limpiarFiltros = () => {
    setFechaInicio(null);
    setFechaFin(null);
    setFiltroTipo('todos');
    setPage(0);
    loadMovimientos(0, pageSize, {});
  };

  const filtrarHoy = () => {
    const hoy = new Date();
    const start = startOfDay(hoy);
    const end = endOfDay(hoy);
    setFechaInicio(start);
    setFechaFin(end);
    setPage(0);
    const params = {
      fechaInicio: moment(start).format('YYYY-MM-DDTHH:mm:ss'),
      fechaFin: moment(end).format('YYYY-MM-DDTHH:mm:ss'),
    };
    if (filtroTipo !== 'todos') {
      params.tipo = filtroTipo;
    }
    loadMovimientos(0, pageSize, params);
  };

  const handleAnular = useCallback(
    async (id) => {
      if (!window.confirm('¿Está seguro de que desea anular este movimiento?')) return;
      try {
        await api.put(`/api/movimientosCaja/${id}`);
        setPage(0);
        await loadMovimientos(0, pageSize);
        cargarCaja();
      } catch (error) {
        console.error('Error anulando movimiento:', error);
      }
    },
    [loadMovimientos, pageSize]
  );

  const handleSubmit = async (values) => {
    setLoading(true);
    try {
      await api.post('/api/movimientosCaja/manual', {
        ...values,
      });
      setModalVisible(false);
      form.resetFields();
      setPage(0);
      await loadMovimientos(0, pageSize);
      cargarCaja();
    } catch (error) {
      console.error('Error creando movimiento:', error);
    } finally {
      setLoading(false);
    }
  };

  const columnas = useMemo(
    () => [
      {
        title: 'Fecha',
        dataIndex: 'fecha',
        key: 'fecha',
        width: 170,
        render: (fecha) => (fecha ? moment(fecha).format('DD/MM/YYYY hh:mm A') : 'Sin fecha'),
        sorter: (a, b) => moment(a.fecha).unix() - moment(b.fecha).unix(),
      },
      {
        title: 'Tipo',
        dataIndex: 'tipo',
        key: 'tipo',
        width: 110,
        render: (tipo) => (
          <Tag color={tipo === 'INGRESO' ? 'green' : 'volcano'}>{tipo}</Tag>
        ),
      },
      {
        title: 'Descripción',
        dataIndex: 'descripcion',
        key: 'descripcion',
        ellipsis: true,
        render: (text, record) => (
          <span
            style={{
              color: record.estado === 'ANULADO' ? 'red' : 'inherit',
              textDecoration: record.estado === 'ANULADO' ? 'line-through' : 'none',
            }}
          >
            {text}
          </span>
        ),
      },
      {
        title: 'Monto',
        dataIndex: 'monto',
        key: 'monto',
        width: 130,
        align: 'right',
        render: (monto) => (monto != null ? `$${Number(monto).toLocaleString()}` : '—'),
      },
      {
        title: 'Estado',
        dataIndex: 'estado',
        key: 'estado',
        width: 120,
        render: (estado) => (
          <Tag color={estado?.toLowerCase() === 'activo' ? 'blue' : 'red'}>
            {estado ? estado.toUpperCase() : 'DESCONOCIDO'}
          </Tag>
        ),
      },
      {
        title: 'Acciones',
        key: 'acciones',
        width: 130,
        fixed: 'right',
        render: (_, record) =>
          record.estado?.toLowerCase() === 'activo' ? (
            <Button danger icon={<CloseCircleOutlined />} onClick={() => handleAnular(record.id)}>
              Anular
            </Button>
          ) : (
            <Button disabled>Anulado</Button>
          ),
      },
    ],
    [handleAnular]
  );

  return (
    <div className="container">
      <div
        className="header-section"
        style={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          marginBottom: 16,
          flexWrap: 'wrap',
          gap: 12,
        }}
      >
        <h2 style={{ margin: 0 }}>Movimientos de Caja</h2>
        <div style={{ display: 'flex', alignItems: 'center', gap: '1rem', flexWrap: 'wrap' }}>
          <div style={{ fontWeight: 'bold', fontSize: 20 }}>
            <div style={{ color: 'green', fontWeight: 'bold', fontSize: 20 }}>
              {montoCaja !== null ? `$${montoCaja.toLocaleString()}` : '—'}
            </div>
          </div>
          <Button type="primary" icon={<PlusOutlined />} onClick={() => setModalVisible(true)}>
            Nuevo Movimiento
          </Button>
        </div>
      </div>

      <div
        style={{
          marginBottom: 16,
          padding: 12,
          background: '#fafafa',
          borderRadius: 8,
          border: '1px solid #f0f0f0',
        }}
      >
        <Space wrap align="center" size="middle">
          <span style={{ fontWeight: 600 }}>
            <FilterOutlined /> Filtros
          </span>
          <Select value={filtroTipo} onChange={setFiltroTipo} style={{ minWidth: 160 }}>
            <Option value="todos">Todos los tipos</Option>
            <Option value="INGRESO">Ingreso</Option>
            <Option value="EGRESO">Egreso</Option>
          </Select>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8, flexWrap: 'wrap' }}>
            <span style={{ fontSize: 13 }}>Desde</span>
            <DatePicker
              selected={fechaInicio}
              onChange={(d) => setFechaInicio(d)}
              showTimeSelect
              timeFormat="HH:mm"
              timeIntervals={15}
              timeCaption="Hora"
              dateFormat="dd/MM/yyyy HH:mm"
              isClearable
              placeholderText="Inicio"
            />
            <span style={{ fontSize: 13 }}>Hasta</span>
            <DatePicker
              selected={fechaFin}
              onChange={(d) => setFechaFin(d)}
              showTimeSelect
              timeFormat="HH:mm"
              timeIntervals={15}
              timeCaption="Hora"
              dateFormat="dd/MM/yyyy HH:mm"
              isClearable
              placeholderText="Fin"
              minDate={fechaInicio || undefined}
            />
          </div>
          <Button type="primary" onClick={aplicarFiltros}>
            Aplicar
          </Button>
          <Button icon={<ReloadOutlined />} onClick={filtrarHoy}>
            Hoy
          </Button>
          <Button type="link" onClick={limpiarFiltros}>
            Limpiar filtros
          </Button>
        </Space>
      </div>

      <Table
        dataSource={movimientos}
        rowKey={(r) => (r.id != null ? String(r.id) : `${r.fecha}-${r.descripcion}-${r.monto}`)}
        columns={columnas}
        loading={tableLoading}
        pagination={{
          current: page + 1,
          pageSize,
          total: totalElements,
          showSizeChanger: true,
          showTotal: (t) => `${t} movimientos`,
          pageSizeOptions: ['10', '20', '50', '100'],
          onChange: (nextPage, nextPageSize) => {
            const p = Math.max(0, (nextPage || 1) - 1);
            const s = nextPageSize || pageSize;
            setPage(p);
            setPageSize(s);
            loadMovimientos(p, s);
          },
        }}
        scroll={{ x: 'max-content' }}
      />

      <Modal
        title="Nuevo Movimiento de Caja"
        open={modalVisible}
        onCancel={() => setModalVisible(false)}
        footer={null}
        destroyOnClose
      >
        <Form form={form} layout="vertical" onFinish={handleSubmit} initialValues={{ cajaId: 1 }}>
          <Form.Item label="Tipo" name="tipo" rules={[{ required: true, message: 'Seleccione el tipo' }]}>
            <Select>
              <Option value="INGRESO">Ingreso</Option>
              <Option value="EGRESO">Egreso</Option>
            </Select>
          </Form.Item>

          <Form.Item label="Descripción" name="descripcion" rules={[{ required: true, message: 'Ingrese la descripción' }]}>
            <Input.TextArea rows={3} />
          </Form.Item>

          <Form.Item
            label="Monto"
            name="monto"
            rules={[
              {
                required: true,
                pattern: new RegExp(/^[1-9]\d*$/),
                message: 'Monto inválido',
              },
            ]}
          >
            <Input type="number" prefix="$" />
          </Form.Item>

          <Form.Item label="Caja" name="cajaId" rules={[{ required: true, message: 'Seleccione la caja' }]}>
            <Select disabled>
              <Option value={1}>Caja Principal</Option>
            </Select>
          </Form.Item>

          <Form.Item>
            <Button type="primary" htmlType="submit" loading={loading} block>
              Registrar Movimiento
            </Button>
          </Form.Item>
        </Form>
      </Modal>
    </div>
  );
}
