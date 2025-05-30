import axios from 'axios';
import React, { useEffect, useState } from 'react';
import { Table, Tag, Button, Modal, DatePicker, Select } from 'antd';
import { CloseCircleOutlined } from '@ant-design/icons';
import moment from 'moment';
import ModalCompra from './ModalCompra';

const { Column } = Table;
const { RangePicker } = DatePicker;

export default function ListadoCompras() {
  const urlBase = 'http://localhost:9090/api/compras';
  const [compras, setCompras] = useState([]);
  const [showModal, setShowModal] = useState(false);
  const [tiposCompra] = useState(['INGREDIENTE', 'ASEO', 'MATERIALES', 'UTENSILIOS', 'OTROS']);
  const [ingredientes, setIngredientes] = useState([]);
  const [filtroEstado, setFiltroEstado] = useState('TODAS');
  const [rangoFechas, setRangoFechas] = useState([]);

  useEffect(() => {
    cargarCompras();
    cargarIngredientes();
  }, []);

  const cargarCompras = async () => {
    const resultado = await axios.get(urlBase);
    setCompras(resultado.data);
  };

  const cargarIngredientes = async () => {
    const resultado = await axios.get('http://localhost:9090/api/ingredientes');
    setIngredientes(resultado.data);
  };

  const eliminarCompra = async (id) => {
    if (window.confirm('¿Está seguro de anular esta compra?')) {
      await axios.patch(`${urlBase}/${id}`);
      cargarCompras();
    }
  };

  const handleRangoFechas = (dates) => {
    setRangoFechas(dates || []);
  };

  const filteredCompras = compras
    .filter(compra => {
      const [start, end] = rangoFechas;
      const fechaCompra = moment(compra.fecha);

      const cumpleFecha = (!start || fechaCompra.isSameOrAfter(start, 'day')) &&
        (!end || fechaCompra.isSameOrBefore(end, 'day'));

      const cumpleEstado = filtroEstado === 'TODAS' ||
        (filtroEstado === 'ACTIVAS' && compra.estado !== 'ANULADA') ||
        (filtroEstado === 'ANULADAS' && compra.estado === 'ANULADA');

      return cumpleFecha && cumpleEstado;
    })
    .sort((a, b) => moment(b.fecha) - moment(a.fecha));

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
        dataSource={filteredCompras}
        rowKey="id"
        pagination={{ pageSize: 8 }}
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
        onSave={cargarCompras}
      />
    </div>
  );
}