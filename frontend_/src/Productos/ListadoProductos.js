import axios from 'axios';
import React, { useEffect, useState } from 'react';
import { Table, Tag, Button, Input, Select, Space, Modal } from 'antd';
import { 
  PlusOutlined, 
  EditOutlined, 
  CheckCircleOutlined, 
  CloseCircleOutlined 
} from '@ant-design/icons';
import { NumericFormat } from 'react-number-format';

const { Column } = Table;
const { Search } = Input;

export default function ListadoProductos() {
  const urlBase = 'http://localhost:9090/api/productos';
  const [productos, setProductos] = useState([]);
  const [filtro, setFiltro] = useState('todos');
  const [busqueda, setBusqueda] = useState('');

  useEffect(() => {
    cargarProductos();
  }, []);

  const cargarProductos = async () => {
    const resultado = await axios.get(urlBase);
    setProductos(resultado.data);
  };

  const cambiarEstadoProducto = async (id, accion) => {
    const mensaje = accion === 'habilitar' 
      ? '¿Está seguro de que desea habilitar este producto?'
      : '¿Está seguro de que desea inhabilitar este producto?';

    Modal.confirm({
      title: 'Confirmar acción',
      content: mensaje,
      onOk: async () => {
        try {
          if (accion === 'habilitar') {
            const productoResponse = await axios.get(`${urlBase}/${id}`);
            const ingredientesResponse = await axios.get(`${urlBase}/${id}/ingredientes`);
            
            const dto = {
              nombre: productoResponse.data.nombre,
              tipo: productoResponse.data.tipo,
              precio: productoResponse.data.precio,
              activo: true,
              ingredientes: ingredientesResponse.data.ingredientes.map(i => ({
                ingredienteId: i.id,
                cantidad: i.cantidadNecesaria
              }))
            };
            await axios.put(`${urlBase}/${id}`, dto);
          } else {
            await axios.delete(`${urlBase}/${id}`);
          }
          cargarProductos();
        } catch (error) {
          console.error("Error:", error);
        }
      }
    });
  };

  const productosFiltrados = productos.filter(producto => {
    const coincideBusqueda = producto.nombre.toLowerCase().includes(busqueda.toLowerCase());
    const filtroEstado = 
      filtro === 'activos' ? producto.activo :
      filtro === 'inactivos' ? !producto.activo : true;
    
    return coincideBusqueda && filtroEstado;
  });

  return (
    <div className="container" style={{ padding: '24px' }}>
      <div style={{ 
        display: 'flex', 
        justifyContent: 'space-between', 
        marginBottom: 24,
        gap: 16,
        flexWrap: 'wrap'
      }}>
        <Button 
          type="primary" 
          icon={<PlusOutlined />}
          href="/agregarProducto"
        >
          Nuevo Producto
        </Button>

        <Space>
          <Search
            placeholder="Buscar productos..."
            allowClear
            onSearch={value => setBusqueda(value)}
            style={{ width: 250 }}
          />

          <Select
            value={filtro}
            onChange={setFiltro}
            style={{ width: 150 }}
          >
            <Select.Option value="todos">Todos</Select.Option>
            <Select.Option value="activos">Activos</Select.Option>
            <Select.Option value="inactivos">Inactivos</Select.Option>
          </Select>
        </Space>
      </div>

      <Table
        dataSource={productosFiltrados}
        rowKey="id"
        pagination={{ pageSize: 8 }}
        scroll={{ x: true }}
        bordered
      >
        <Column
          title="ID"
          dataIndex="id"
          key="id"
          width={80}
          sorter={(a, b) => a.id - b.id}
        />

        <Column
          title="Nombre"
          dataIndex="nombre"
          key="nombre"
          sorter={(a, b) => a.nombre.localeCompare(b.nombre)}
        />

        <Column
          title="Tipo"
          dataIndex="tipo"
          key="tipo"
          render={tipo => (
            <Tag color={tipo === 'BEBIDA' ? '#2db7f5' : '#87d068'}>
              {tipo}
            </Tag>
          )}
        />

        <Column
          title="Precio"
          dataIndex="precio"
          key="precio"
          align="right"
          render={precio => (
            <NumericFormat
              value={precio}
              displayType={'text'}
              thousandSeparator=","
              prefix="$"
              fixedDecimalScale
              style={{ fontWeight: 500 }}
            />
          )}
          sorter={(a, b) => a.precio - b.precio}
        />

        <Column
          title="Estado"
          dataIndex="activo"
          key="activo"
          render={activo => (
            <Tag color={activo ? 'green' : 'red'} icon={activo ? <CheckCircleOutlined /> : <CloseCircleOutlined />}>
              {activo ? 'ACTIVO' : 'INACTIVO'}
            </Tag>
          )}
          filters={[
            { text: 'Activos', value: true },
            { text: 'Inactivos', value: false },
          ]}
          onFilter={(value, record) => record.activo === value}
        />

        <Column
          title="Acciones"
          key="acciones"
          fixed="right"
          width={200}
          render={(_, record) => (
            <Space>
              <Button 
                icon={<EditOutlined />} 
                href={`/editarProducto/${record.id}`}
              />

              {record.activo ? (
                <Button
                  danger
                  icon={<CloseCircleOutlined />}
                  onClick={() => cambiarEstadoProducto(record.id, 'inhabilitar')}
                />
              ) : (
                <Button
                  type="primary"
                  icon={<CheckCircleOutlined />}
                  onClick={() => cambiarEstadoProducto(record.id, 'habilitar')}
                />
              )}
            </Space>
          )}
        />
      </Table>
    </div>
  );
}