import React, { useEffect, useState } from 'react';
import { Table, Tag, Button, Modal, DatePicker, Select } from 'antd';
import { CloseCircleOutlined } from '@ant-design/icons';
import moment from 'moment';
import ModalCompra from './ModalCompra';
import api from '../api';

const { Column } = Table;
const { RangePicker } = DatePicker;

export default function ListadoCompras() {
  const urlBase = '/api/compras';
  const [compras, setCompras] = useState([]);
  const [totalCompras, setTotalCompras] = useState(0);
  const [loading, setLoading] = useState(false);
  const [page, setPage] = useState(1); // antd usa 1-based
  const [pageSize, setPageSize] = useState(8);
  const [showModal, setShowModal] = useState(false);
  const [tiposCompra] = useState(['INGREDIENTE', 'ASEO', 'MATERIALES', 'UTENSILIOS', 'OTROS']);
  const [ingredientes, setIngredientes] = useState([]);
  const [filtroEstado, setFiltroEstado] = useState('TODAS');
  const [rangoFechas, setRangoFechas] = useState([]);

  useEffect(() => {
    cargarIngredientes();
  }, []);

  useEffect(() => {
    cargarCompras(page, pageSize);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [page, pageSize]);

  // Si cambian filtros, volvemos a la primera página
  useEffect(() => {
    setPage(1);
  }, [filtroEstado, rangoFechas]);

  const cargarCompras = async (nextPage = 1, nextPageSize = pageSize) => {
    setLoading(true);
    try {
      const params = { page: Math.max(0, nextPage - 1), size: nextPageSize };

      // Filtros server-side
      if (filtroEstado && filtroEstado !== 'TODAS') {
        params.estado = filtroEstado;
      }
      const [start, end] = rangoFechas || [];
      if (start) params.fechaInicio = moment(start).startOf('day').format('YYYY-MM-DDTHH:mm:ss');
      if (end) params.fechaFin = moment(end).endOf('day').format('YYYY-MM-DDTHH:mm:ss');

      const resultado = await api.get(`${urlBase}/page`, { params });
      setCompras(resultado.data?.content ?? []);
      setTotalCompras(resultado.data?.totalElements ?? 0);
    } finally {
      setLoading(false);
    }
  };

  const cargarIngredientes = async () => {
    const resultado = await api.get('/api/ingredientes');
    setIngredientes(resultado.data);
  };

  const eliminarCompra = async (id) => {
    if (window.confirm('¿Está seguro de anular esta compra?')) {
      await api.patch(`${urlBase}/${id}`);
      cargarCompras(page, pageSize);
    }
  };

  const handleRangoFechas = (dates) => {
    setRangoFechas(dates || []);
  };

  return (
    <div className="container">
      <div className="header-section" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
        <h2>Registro de Compras</h2>
        <Button
          type="primary"
          onClick={() => setShowModal(true)}
        >
          Nueva Compra
        </Button>
      </div>

      {/* Filtros */}
      <div style={{ marginBottom: 16, display: 'flex', gap: 16 }}>
        <RangePicker
          onChange={handleRangoFechas}
          style={{ width: 300 }}
        />

        <Select
          value={filtroEstado}
          onChange={setFiltroEstado}
          style={{ width: 200 }}
        >
          <Select.Option value="TODAS">Todas las compras</Select.Option>
          <Select.Option value="ACTIVAS">Activas</Select.Option>
          <Select.Option value="ANULADAS">Anuladas</Select.Option>
        </Select>
      </div>

      {/* Tabla de compras */}
      <Table
        dataSource={compras}
        rowKey="id"
        loading={loading}
        pagination={{
          current: page,
          pageSize,
          total: totalCompras,
          showSizeChanger: true,
          onChange: (nextPage, nextPageSize) => {
            setPage(nextPage);
            setPageSize(nextPageSize);
          }
        }}
        scroll={{ x: true }}
      >
        <Column
          title="Tipo"
          dataIndex="tipo"
          key="tipo"
          render={(tipo) => (
            <Tag color={tipo === 'INGREDIENTE' ? 'green' : 'blue'}>
              {tipo}
            </Tag>
          )}
        />

        <Column
          title="Descripción"
          key="descripcion"
          render={(_, record) => (
            <span
              style={{
                color: record.estado === 'ANULADA' ? 'red' : 'inherit',
                textDecoration: record.estado === 'ANULADA' ? 'line-through' : 'none'
              }}
            >
              {record.tipo === 'INGREDIENTE'
                ? `${record.ingrediente?.nombre} (${record.cantidad} ${record.ingrediente?.unidadMedida?.simbolo || ''})`
                : record.descripcion}
            </span>
          )}
        />

        <Column
          title="Monto"
          dataIndex="costoTotal"
          key="costoTotal"
          render={(costo) => `$${costo?.toLocaleString()}`}
          align="right"
        />

        <Column
          title="Fecha"
          dataIndex="fecha"
          key="fecha"
          render={(fecha) => moment(fecha).format('DD/MM/YYYY HH:mm')}
          sorter={(a, b) => moment(a.fecha) - moment(b.fecha)}
        />

        <Column
          title="Estado"
          dataIndex="estado"
          key="estado"
          render={(estado) => (
            <Tag color={estado === 'ANULADA' ? 'red' : 'blue'}>
              {estado || 'ACTIVA'}
            </Tag>
          )}
        />

        <Column
          title="Acciones"
          key="acciones"
          render={(_, record) =>
            record.estado !== 'ANULADA' ? (
              <Button
                danger
                icon={<CloseCircleOutlined />}
                onClick={() => eliminarCompra(record.id)}
              >
                Anular
              </Button>
            ) : (
              <Button disabled>Anulada</Button>
            )
          }
        />
      </Table>

      <ModalCompra
        show={showModal}
        handleClose={() => setShowModal(false)}
        tipos={tiposCompra}
        ingredientes={ingredientes}
        onSave={() => cargarCompras(page, pageSize)}
      />
    </div>
  );
}