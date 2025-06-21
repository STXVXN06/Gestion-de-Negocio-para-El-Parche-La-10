import axios from 'axios';
import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { 
  Form, 
  Input, 
  Select, 
  Button, 
  Card, 
  Row, 
  Col, 
  Typography, 
  InputNumber,
  Switch
} from 'antd';
import { SaveOutlined, CloseOutlined, ArrowLeftOutlined } from '@ant-design/icons';

const { Title } = Typography;
const { Option } = Select;

export default function AgregarIngrediente() {
  const [form] = Form.useForm();
  const navigate = useNavigate();
  const [unidadesMedida, setUnidadesMedida] = useState([]);
  const [loading, setLoading] = useState(false);

  const urlUnidades = 'http://localhost:9090/api/unidadesMedida';

  const onFinish = async (values) => {
    setLoading(true);
    try {
      const ingredienteParaEnviar = {
        ...values,
        unidadMedida: { id: values.unidadMedida },
        precioAdicion: values.adicionable ? values.precioAdicion : null
      };
      
      await axios.post('http://localhost:9090/api/ingredientes', ingredienteParaEnviar);
      form.resetFields();
      navigate('/ingredientes');
    } catch (error) {
      console.error('Error al guardar:', error);
    } finally {
      setLoading(false);
    }
  };

  // Mostrar/ocultar input de precio según el switch
  const [adicionable, setAdicionable] = useState(false);
  useEffect(() => {
    setAdicionable(form.getFieldValue('adicionable'));
    const unsubscribe = form.subscribe && form.subscribe(({ values }) => {
      setAdicionable(values.adicionable);
    });
    return () => unsubscribe && unsubscribe();
  }, [form]);

  useEffect(() => {
    const cargarUnidades = async () => {
      const resultado = await axios.get(urlUnidades);
      setUnidadesMedida(resultado.data);
    };
    cargarUnidades();
  }, []);

  return (
    <div style={{ maxWidth: 800, margin: '0 auto', padding: 24 }}>
      <div style={{ marginBottom: 24, display: 'flex', alignItems: 'center', gap: 16 }}>
        <Button
          type="text"
          icon={<ArrowLeftOutlined />}
          onClick={() => navigate(-1)}
          style={{ padding: 0 }}
        />
        <Title level={3} style={{ margin: 0 }}>Nuevo Ingrediente</Title>
      </div>

      <Card bordered={false} className="shadow-sm">
        <Form
          form={form}
          layout="vertical"
          onFinish={onFinish}
          initialValues={{ cantidadActual: 0 }}
        >
          <Row gutter={24}>
            <Col span={24} md={12}>
              <Form.Item
                label="Nombre del ingrediente"
                name="nombre"
                rules={[{ required: true, message: 'Por favor ingresa el nombre' }]}
              >
                <Input 
                  placeholder="Ej: Harina de trigo" 
                  autoFocus
                  size="large"
                />
              </Form.Item>
            </Col>

            <Col span={24} md={12}>
              <Form.Item
                label="Unidad de medida"
                name="unidadMedida"
                rules={[{ required: true, message: 'Selecciona una unidad' }]}
              >
                <Select
                  placeholder="Selecciona unidad"
                  size="large"
                  showSearch
                  optionFilterProp="children"
                >
                  {unidadesMedida.map((unidad) => (
                    <Option 
                      key={unidad.id} 
                      value={unidad.id}
                    >
                      {`${unidad.simbolo} - ${unidad.nombre}`}
                    </Option>
                  ))}
                </Select>
              </Form.Item>
            </Col>

            <Col span={24} md={12}>
              <Form.Item
                label="Cantidad inicial"
                name="cantidadActual"
                rules={[{ 
                  required: true, 
                  message: 'Ingresa la cantidad inicial',
                  type: 'number',
                  min: 0
                }]}
              >
                <InputNumber
                  min={0}
                  step={0.5}
                  style={{ width: '100%' }}
                  size="large"
                  placeholder="Ej: 50"
                />
              </Form.Item>
            </Col>

            <Col span={24} md={12}>
              <Form.Item
                label="Cantidad mínima en stock"
                name="cantidadMinima"
                rules={[{ 
                  required: true, 
                  message: 'Ingresa la cantidad mínima',
                  type: 'number',
                  min: 0
                }]}
              >
                <InputNumber
                  min={0}
                  step={0.5}
                  style={{ width: '100%' }}
                  size="large"
                  placeholder="Ej: 10"
                />
              </Form.Item>
            </Col>

            <Col span={24} md={12}>
              <Form.Item
                label="¿Es adicionable?"
                name="adicionable"
                valuePropName="checked"
                initialValue={false}
              >
                <Switch checkedChildren="Sí" unCheckedChildren="No" onChange={checked => setAdicionable(checked)} />
              </Form.Item>
            </Col>
            {adicionable && (
              <Col span={24} md={12}>
                <Form.Item
                  label="Precio de la adición"
                  name="precioAdicion"
                  rules={[{ required: true, message: 'Ingresa el precio de la adición', type: 'number', min: 0 }]}
                >
                  <InputNumber
                    min={0}
                    step={100}
                    style={{ width: '100%' }}
                    size="large"
                    placeholder="Ej: 1000"
                  />
                </Form.Item>
              </Col>
            )}
          </Row>

          <Form.Item style={{ marginTop: 32 }}>
            <Row justify="end" gutter={16}>
              <Col>
                <Button
                  type="default"
                  size="large"
                  icon={<CloseOutlined />}
                  onClick={() => navigate('/ingredientes')}
                >
                  Cancelar
                </Button>
              </Col>
              <Col>
                <Button
                  type="primary"
                  htmlType="submit"
                  size="large"
                  icon={<SaveOutlined />}
                  loading={loading}
                >
                  Guardar Ingrediente
                </Button>
              </Col>
            </Row>
          </Form.Item>
        </Form>
      </Card>
    </div>
  );
}