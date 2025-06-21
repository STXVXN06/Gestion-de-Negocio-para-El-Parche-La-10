import axios from 'axios';
import React, { useEffect, useState } from 'react';
import { Table, Tag, Button, Input, Space, Modal, Typography } from 'antd';
import { PlusOutlined, EditOutlined, DeleteOutlined } from '@ant-design/icons';

const { Column } = Table;
const { Search } = Input;
const { Text } = Typography;

export default function ListadoIngredientes() {
  const urlBase = 'http://localhost:9090/api/ingredientes';
  const [ingredientes, setIngredientes] = useState([]);
  const [busqueda, setBusqueda] = useState('');
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    cargarIngredientes();
  }, []);

  const cargarIngredientes = async () => {
    setLoading(true);
    try {
      const resultado = await axios.get(urlBase);
      setIngredientes(resultado.data);
    } catch (error) {
      console.error("Error cargando ingredientes:", error);
    } finally {
      setLoading(false);
    }
  };

  const eliminarIngrediente = (id) => {
    Modal.confirm({
      title: 'Confirmar eliminación',
      content: '¿Está seguro de que desea eliminar este ingrediente?',
      okText: 'Eliminar',
      okType: 'danger',
      cancelText: 'Cancelar',
      onOk: async () => {
        try {
          await axios.delete(`${urlBase}/${id}`);
          cargarIngredientes();
        } catch (error) {
          console.error("Error eliminando ingrediente:", error);
        }
      }
    });
  };

  const filteredData = ingredientes.filter(ingrediente =>
    ingrediente.nombre.toLowerCase().includes(busqueda.toLowerCase())
  );

  return (
    <div className="container" style={{ padding: '24px' }}>
      <div style={{ 
        display: 'flex', 
        justifyContent: 'space-between', 
        marginBottom: 24,
        gap: 16,
        flexWrap: 'wrap'
      }}>
        <div>
          <Text strong style={{ fontSize: 24 }}>Inventario de Ingredientes</Text>
        </div>
        
        <Space>
          <Search
            placeholder="Buscar ingredientes..."
            allowClear
            onChange={(e) => setBusqueda(e.target.value)}
            style={{ width: 250 }}
          />
          
          <Button 
            type="primary" 
            icon={<PlusOutlined />}
            href="/agregarIngrediente"
          >
            Nuevo Ingrediente
          </Button>
        </Space>
      </div>

      <Table
        dataSource={filteredData}
        rowKey="id"
        loading={loading}
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
          title="Unidad de Medida"
          key="unidadMedida"
          render={(_, record) => (
            <Tag color="#2db7f5" style={{ fontWeight: 500 }}>
              {record.unidadMedida?.nombre || 'Sin unidad'}
            </Tag>
          )}
        />

        <Column
          title="Cantidad Actual"
          dataIndex="cantidadActual"
          key="cantidadActual"
          align="right"
          render={(cantidad) => (
            <Text strong style={{ fontSize: 16 }}>
              {cantidad.toLocaleString()}
            </Text>
          )}
          sorter={(a, b) => a.cantidadActual - b.cantidadActual}
        />

        <Column
          title="Cantidad Mínima"
          dataIndex="cantidadMinima"
          key="cantidadMinima"
          align="right"
          render={(cantidad) => (
            <Text style={{ fontSize: 15 }}>
              {cantidad?.toLocaleString() ?? '-'}
            </Text>
          )}
          sorter={(a, b) => a.cantidadMinima - b.cantidadMinima}
        />

        <Column
          title="Adicionable"
          dataIndex="adicionable"
          key="adicionable"
          align="center"
          render={(adicionable) => (
            adicionable ? <Tag color="green">Sí</Tag> : <Tag color="red">No</Tag>
          )}
          sorter={(a, b) => (a.adicionable === b.adicionable ? 0 : a.adicionable ? -1 : 1)}
        />

        <Column
          title="Precio de Adición"
          dataIndex="precioAdicion"
          key="precioAdicion"
          align="right"
          render={(precio, record) => (
            record.adicionable && precio != null ? (
              <Text style={{ fontSize: 15 }}>
                ${precio.toLocaleString()}
              </Text>
            ) : (
              <Text type="secondary">-</Text>
            )
          )}
          sorter={(a, b) => (a.precioAdicion || 0) - (b.precioAdicion || 0)}
        />

        <Column
          title="Acciones"
          key="acciones"
          fixed="right"
          width={150}
          render={(_, record) => (
            <Space>
              <Button 
                icon={<EditOutlined />} 
                href={`/editarIngrediente/${record.id}`}
              />

              <Button
                danger
                icon={<DeleteOutlined />}
                onClick={() => eliminarIngrediente(record.id)}
              />
            </Space>
          )}
        />
      </Table>
    </div>
  );
}