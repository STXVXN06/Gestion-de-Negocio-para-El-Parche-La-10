import React, { useEffect, useState } from 'react';
import { Table, Tag, Button, DatePicker, Select } from 'antd';
import { CloseCircleOutlined } from '@ant-design/icons';
import moment from 'moment';
import ModalCompra from './ModalCompra';
import api from '../api';

const { Column } = Table;
const { RangePicker } = DatePicker;

export default function ListadoCompras() {
  const urlBase = '/api/compras';
  const [compras, setCompras] = useState([]);
  const [showModal, setShowModal] = useState(false);
  const [tiposCompra] = useState(['INGREDIENTE', 'ASEO', 'MATERIALES', 'UTENSILIOS', 'SERVICIO', 'EQUIPO', 'OTROS']);
  const [ingredientes, setIngredientes] = useState([]);
  const [filtroEstado, setFiltroEstado] = useState('TODAS');
  const [rangoFechas, setRangoFechas] = useState([]);

  useEffect(() => {
    cargarCompras();
    cargarIngredientes();
  }, []);

  const cargarCompras = async () => {
    try {
      console.log('Iniciando carga de compras...');
      const resultado = await api.get(urlBase);
      console.log('Compras recibidas:', resultado.data);
      setCompras(resultado.data);
      console.log('Estado actualizado correctamente');
    } catch (error) {
      console.error('Error cargando compras:', error);
    }
  };

  const cargarIngredientes = async () => {
    try {
      const resultado = await api.get('/api/ingredientes');
      setIngredientes(resultado.data);
    } catch (error) {
      console.error('Error cargando ingredientes:', error);
    }
  };

  const eliminarCompra = async (id) => {
    if (window.confirm('¿Está seguro de anular esta compra?')) {
      try {
        await api.delete(`${urlBase}/${id}`);
        cargarCompras();
      } catch (error) {
        console.error('Error anulando compra:', error);
      }
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

  // Función helper para renderizar la descripción de forma segura
  const renderDescripcion = (record) => {
    const baseStyle = {
      color: record.estado === 'ANULADA' ? 'red' : 'inherit',
      textDecoration: record.estado === 'ANULADA' ? 'line-through' : 'none'
    };

    // Si es compra de ingrediente
    if (record.tipo === 'INGREDIENTE' && record.ingrediente) {
      const nombreIngrediente = record.ingrediente?.nombre || 'N/A';
      const cantidad = record.cantidad || 0;
      const unidad = record.ingrediente?.unidadMedida?.simbolo || '';
      
      return (
        <span style={baseStyle}>
          {`${nombreIngrediente} (${cantidad} ${unidad})`}
        </span>
      );
    }
    
    // Para otros tipos de compra
    return (
      <span style={baseStyle}>
        {record.descripcion || 'Sin descripción'}
      </span>
    );
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
      <div style={{ marginBottom: 16, display: 'flex', gap: 16, flexWrap: 'wrap' }}>
        <RangePicker
          onChange={handleRangoFechas}
          style={{ width: 300 }}
          placeholder={['Fecha inicio', 'Fecha fin']}
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
          render={(_, record) => renderDescripcion(record)}
        />

        <Column
          title="Monto"
          dataIndex="costoTotal"
          key="costoTotal"
          render={(costo) => `$${(costo || 0).toLocaleString()}`}
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
            <Tag color={estado === 'ANULADA' ? 'red' : 'green'}>
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