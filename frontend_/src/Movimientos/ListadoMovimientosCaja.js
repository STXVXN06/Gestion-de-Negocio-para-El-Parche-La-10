import React, { useState, useEffect } from 'react';
import { Table, Button, Modal, Form, Input, Select, Tag } from 'antd';
import { PlusOutlined, CloseCircleOutlined } from '@ant-design/icons';
import moment from 'moment';
import axios from 'axios';

const { Column } = Table;
const { Option } = Select;

export default function ListadoMovimientosCaja() {
  const [movimientos, setMovimientos] = useState([]);
  const [modalVisible, setModalVisible] = useState(false);
  const [form] = Form.useForm();
  const [loading, setLoading] = useState(false);
  const [montoCaja, setMontoCaja] = useState(null);

  useEffect(() => {
    cargarMovimientos();
    cargarCaja();
  }, []);




  const cargarMovimientos = async () => {
    try {
      const response = await axios.get('http://localhost:9090/api/movimientosCaja');
      const datosOrdenados = response.data.sort((a, b) =>
        new Date(b.fecha) - new Date(a.fecha)
      );
      setMovimientos(datosOrdenados);
    } catch (error) {
      console.error('Error cargando movimientos:', error);
    }
  };

    const cargarCaja = async () => {
        try {
        const response = await axios.get('http://localhost:9090/api/caja');
        console.log(response.data);
        setMontoCaja(response.data.montoActual);
        } catch (error) {
        console.error('Error cargando la caja:', error);
        }
    };

  const handleAnular = async (id) => {
    if (window.confirm('¿Está seguro de que desea anular este movimiento?')) {
        try {
        
        await axios.put(`http://localhost:9090/api/movimientosCaja/${id}`);
        cargarMovimientos();
        cargarCaja();
        } catch (error) {
        console.error('Error anulando movimiento:', error);
        }

    }
  };

  const handleSubmit = async (values) => {
    setLoading(true);
    try {
      await axios.post('http://localhost:9090/api/movimientosCaja/manual', {
        ...values,
        fecha: moment().format('YYYY-MM-DDTHH:mm:ss')
      });
      setModalVisible(false);
      form.resetFields();
      cargarMovimientos();
      cargarCaja();
    } catch (error) {
      console.error('Error creando movimiento:', error);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="container">
     <div className="header-section" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
        <h2>Movimientos de Caja</h2>
        <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
            <div style={{ fontWeight: 'bold', fontSize: 20 }}>
                <div style={{ color: 'green', fontWeight: 'bold', fontSize: 20 }}>

                {montoCaja !== null ? `$${montoCaja.toLocaleString()}` : 'hola'}
                </div>
                </div>
                <Button
                type="primary"
                icon={<PlusOutlined />}
                onClick={() => setModalVisible(true)}
                >
                Nuevo Movimiento
                </Button>
        </div>
        </div>
     
      <Table
        dataSource={movimientos}
        rowKey="id"
        pagination={{ pageSize: 8 }}
        scroll={{ x: true }}
      >
        <Column
          title="Fecha"
          dataIndex="fecha"
          key="fecha"
          render={(fecha) =>
            fecha ? moment(fecha).format('DD/MM/YYYY hh:mm A') : 'Sin fecha'
          }
          sorter={(a, b) => moment(a.fecha).unix() - moment(b.fecha).unix()}
        />

        <Column
          title="Tipo"
          dataIndex="tipo"
          key="tipo"
          render={(tipo) => (
            <Tag color={tipo === 'INGRESO' ? 'green' : 'volcano'}>
              {tipo}
            </Tag>
          )}
        />

        <Column
          title="Descripción"
          dataIndex="descripcion"
          key="descripcion"
          render={(text, record) => (
            <span
              style={{
                color: record.estado === 'ANULADO' ? 'red' : 'inherit',
                textDecoration:
                  record.estado === 'ANULADO' ? 'line-through' : 'none'
              }}
            >
              {text}
            </span>
          )}
        />

        <Column
          title="Monto"
          dataIndex="monto"
          key="monto"
          render={(monto) => `$${monto.toLocaleString()}`}
          align="right"
        />

        <Column
          title="Estado"
          dataIndex="estado"
          key="estado"
          render={(estado) => (
            <Tag color={estado?.toLowerCase() === 'activo' ? 'blue' : 'red'}>
              {estado ? estado.toUpperCase() : 'DESCONOCIDO'}
            </Tag>
          )}
        />

        <Column
          title="Acciones"
          key="acciones"
          render={(_, record) =>
            record.estado?.toLowerCase() === 'activo' ? (
              <Button
                danger
                icon={<CloseCircleOutlined />}
                onClick={() => handleAnular(record.id)}
              >
                Anular
              </Button>
            ) : (
              <Button disabled>Anulado</Button>
            )
          }
        />
      </Table>

      <Modal
        title="Nuevo Movimiento de Caja"
        visible={modalVisible}
        onCancel={() => setModalVisible(false)}
        footer={null}
        destroyOnClose
      >
        <Form
          form={form}
          layout="vertical"
          onFinish={handleSubmit}
          initialValues={{ cajaId: 1 }}
        >
          <Form.Item
            label="Tipo"
            name="tipo"
            rules={[{ required: true, message: 'Seleccione el tipo' }]}
          >
            <Select>
              <Option value="INGRESO">Ingreso</Option>
              <Option value="EGRESO">Egreso</Option>
            </Select>
          </Form.Item>

          <Form.Item
            label="Descripción"
            name="descripcion"
            rules={[{ required: true, message: 'Ingrese la descripción' }]}
          >
            <Input.TextArea rows={3} />
          </Form.Item>

          <Form.Item
            label="Monto"
            name="monto"
            rules={[
              {
                required: true,
                pattern: new RegExp(/^[1-9]\d*$/),
                message: 'Monto inválido'
              }
            ]}
          >
            <Input type="number" prefix="$" />
          </Form.Item>

          <Form.Item
            label="Caja"
            name="cajaId"
            rules={[{ required: true, message: 'Seleccione la caja' }]}
          >
            <Select disabled>
              <Option value={1}>Caja Principal</Option>
            </Select>
          </Form.Item>

          <Form.Item>
            <Button
              type="primary"
              htmlType="submit"
              loading={loading}
              block
            >
              Registrar Movimiento
            </Button>
          </Form.Item>
        </Form>
      </Modal>
    </div>
  );
}
