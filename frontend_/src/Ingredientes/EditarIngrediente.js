import axios from 'axios';
import React, { useEffect, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
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
  Spin,
  Switch
} from 'antd';
import { SaveOutlined, CloseOutlined, ArrowLeftOutlined } from '@ant-design/icons';

const { Title } = Typography;
const { Option } = Select;

export default function EditarIngrediente() {
  const [form] = Form.useForm();
  const navigate = useNavigate();
  const { id } = useParams();
  const [unidadesMedida, setUnidadesMedida] = useState([]);
  const [loading, setLoading] = useState(false);
  const [cargando, setCargando] = useState(true);

  // Observa cambios en el campo 'adicionable'
  const adicionable = Form.useWatch('adicionable', form);

  const urlBase = 'http://localhost:9090/api/ingredientes';
  const urlUnidades = 'http://localhost:9090/api/unidadesMedida';

  const onFinish = async (values) => {
    setLoading(true);
    try {
      const ingredienteActualizado = {
        ...values,
        unidadMedida: { id: values.unidadMedida },
        cantidadMinima: values.cantidadMinima,
        adicionable: values.adicionable,
        precioAdicion: values.adicionable ? values.precioAdicion : null
      };

      await axios.put(`${urlBase}/${id}`, ingredienteActualizado);
      navigate('/ingredientes');
    } catch (error) {
      console.error('Error al actualizar:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    const cargarDatos = async () => {
      try {
        const [unidadesResponse, ingredienteResponse] = await Promise.all([
          axios.get(urlUnidades),
          axios.get(`${urlBase}/${id}`)
        ]);

        setUnidadesMedida(unidadesResponse.data);
        const ingredienteData = ingredienteResponse.data;
        form.setFieldsValue({
          nombre: ingredienteData.nombre,
          unidadMedida: ingredienteData.unidadMedida?.id,
          cantidadActual: ingredienteData.cantidadActual,
          cantidadMinima: ingredienteData.cantidadMinima,
          adicionable: ingredienteData.adicionable,
          precioAdicion: ingredienteData.precioAdicion
        });
      } catch (error) {
        console.error('Error cargando datos:', error);
      } finally {
        setCargando(false);
      }
    };

    if (id) cargarDatos();
  }, [id, form]);

  return (
    <div style={{ maxWidth: 800, margin: '0 auto', padding: 24 }}>
      <div style={{ marginBottom: 24, display: 'flex', alignItems: 'center', gap: 16 }}>
        <Button
          type="text"
          icon={<ArrowLeftOutlined />}
          onClick={() => navigate(-1)}
          style={{ padding: 0 }}
        />
        <Title level={3} style={{ margin: 0 }}>Editar Ingrediente</Title>
      </div>

      <Card bordered={false} className="shadow-sm">
        <Spin spinning={cargando}>
          <Form
            form={form}
            layout="vertical"
            onFinish={onFinish}
            initialValues={{ cantidadActual: 0 }}
          >
            <Row gutter={24}>
              {/* Campo: Nombre */}
              <Col span={24} md={12}>
                <Form.Item
                  label="Nombre del ingrediente"
                  name="nombre"
                  rules={[{ required: true, message: 'Ingresa el nombre del ingrediente' }]}
                >
                  <Input 
                    placeholder="Ej: Harina de trigo" 
                    size="large"
                  />
                </Form.Item>
              </Col>

              {/* Campo: Unidad de medida */}
              <Col span={24} md={12}>
                <Form.Item
                  label="Unidad de medida"
                  name="unidadMedida"
                  rules={[{ required: true, message: 'Selecciona una unidad de medida' }]}
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

              {/* Campo: Cantidad actual */}
              <Col span={24} md={12}>
                <Form.Item
                  label="Cantidad actual"
                  name="cantidadActual"
                  rules={[{ 
                    required: true, 
                    message: 'Ingresa la cantidad actual',
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

              {/* Campo: Cantidad mínima */}
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

              {/* Campo: ¿Es adicionable? */}
              <Col span={24} md={12}>
                <Form.Item
                  label="¿Es adicionable?"
                  name="adicionable"
                  valuePropName="checked"
                  initialValue={false}
                >
                  <Switch checkedChildren="Sí" unCheckedChildren="No" />
                </Form.Item>
              </Col>

              {/* Campo: Precio de la adición (condicional) */}
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
                    Actualizar Ingrediente
                  </Button>
                </Col>
              </Row>
            </Form.Item>
          </Form>
        </Spin>
      </Card>
    </div>
  );
}