import React, { useEffect, useState, useMemo, useCallback } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import {
  Badge,
  Button,
  Card,
  Row,
  Col,
  Select,
  Spin,
  Empty,
  Tag,
  Tabs,
  Input,
  notification,
  DatePicker
} from 'antd';
import {
  FilterOutlined,
  PlusOutlined,
  ReloadOutlined,
  InfoCircleOutlined,
  EditOutlined,
  CalendarOutlined,
  DownOutlined,
  UpOutlined,
  ShoppingOutlined
} from '@ant-design/icons';
import moment from 'moment';
import { NumericFormat } from 'react-number-format';
import './PedidosList.css';
import api from '../../api';
import { hayPedidoEnCurso, limpiarPedidoEnCurso } from '../../utils/PedidoStorage';

const { Option } = Select;
const { TabPane } = Tabs;
const { RangePicker } = DatePicker;

export default function PedidosList() {
  const navigate = useNavigate();
  const urlBase = '/api/pedidos';
  const [todosPedidos, setTodosPedidos] = useState([]);
  const [filtroFecha, setFiltroFecha] = useState(null);
  const [filtroEstado, setFiltroEstado] = useState('todos');
  const [cargando, setCargando] = useState(true);
  const [expandedPedidoId, setExpandedPedidoId] = useState(null);

  const cargarPedidos = useCallback(async () => {
    try {
      setCargando(true);
      const resultado = await api.get(urlBase);
      setTodosPedidos(resultado.data);
    } catch (error) {
      console.error("Error cargando pedidos:", error);
      notification.error({
        message: 'Error',
        description: 'No se pudieron cargar los pedidos. Intente nuevamente.',
      });
    } finally {
      setCargando(false);
    }
  }, []);

  useEffect(() => {
    cargarPedidos();
  }, [cargarPedidos]);

  const pedidosFiltrados = useMemo(() => {
    return todosPedidos.filter(pedido => {
      const fechaPedido = moment(pedido.fecha);

      let cumpleFecha = true;
      if (filtroFecha && filtroFecha[0] && filtroFecha[1]) {
        const fechaInicio = filtroFecha[0].startOf('day');
        const fechaFin = filtroFecha[1].endOf('day');
        cumpleFecha = fechaPedido >= fechaInicio && fechaPedido <= fechaFin;
      }
      const cumpleEstado =
        filtroEstado === 'todos' ||
        pedido.estado === filtroEstado;

      return cumpleFecha && cumpleEstado;
    }).sort((a, b) => new Date(b.fecha) - new Date(a.fecha));
  }, [todosPedidos, filtroFecha, filtroEstado]);

  const getCardColor = (estado) => {
    switch (estado) {
      case 'PENDIENTE': return {
        bg: 'linear-gradient(to right, #fff9db, #fff3bf)',
        border: '1px solid #ffd43b',
        icon: <InfoCircleOutlined className="text-warning" />,
        color: '#fcc419'
      };
      case 'CANCELADO': return {
        bg: 'linear-gradient(to right, #ffe3e3, #ffc9c9)',
        border: '1px solid #ff6b6b',
        icon: <InfoCircleOutlined className="text-danger" />,
        color: '#ff6b6b'
      };
      case 'ENTREGADO': return {
        bg: 'linear-gradient(to right, #d3f9d8, #b2f2bb)',
        border: '1px solid #40c057',
        icon: <InfoCircleOutlined className="text-success" />,
        color: '#40c057'
      };
      default: return {
        bg: '#f8f9fa',
        border: '1px solid #dee2e6',
        icon: <InfoCircleOutlined />,
        color: '#868e96'
      };
    }
  };

  const renderProductos = (productos) => (
    <div className="product-list">
      {productos.map((producto, index) => {
        const subtotal = producto.precio * producto.cantidad;
        return (
          <div key={index} className="product-item">
            <div className="product-info">
              <span className="product-quantity">{producto.cantidad}x</span>
              <span className="product-name">{producto.nombre}</span>
            </div>
            <div className="product-subtotal">
              <NumericFormat
                value={subtotal}
                displayType="text"
                thousandSeparator="."
                decimalSeparator=","
                prefix="$"
              />
            </div>
          </div>
        );
      })}
    </div>
  );

  const renderCombos = (combos) => (
    combos && combos.length > 0 && (
      <div className="combo-list">
        <div className="section-title">Combos</div>
        {combos.map((combo, index) => {
          const subtotal = combo.precio * combo.cantidad;
          return (
            <div key={index} className="combo-item">
              <div className="combo-info">
                <span className="combo-quantity">{combo.cantidad}x</span>
                <span className="combo-name">{combo.nombre}</span>
              </div>
              <div className="combo-subtotal">
                <NumericFormat
                  value={subtotal}
                  displayType="text"
                  thousandSeparator="."
                  decimalSeparator=","
                  prefix="$"
                />
              </div>
            </div>
          );
        })}
      </div>
    )
  );

  const renderDesechables = (cantidadP1, cantidadC1) => {
    if (cantidadP1 > 0 || cantidadC1 > 0) {
      const subtotalP1 = 500 * cantidadP1;
      const subtotalC1 = 500 * cantidadC1;

      return (
        <div className="desechables-list">
          <div className="section-title">Desechables</div>
          {cantidadP1 > 0 && (
            <div className="desechable-item">
              <div>
                <span>{cantidadP1}x P1</span>
                <span className="text-muted">($500 c/u)</span>
              </div>
              <div className="desechable-subtotal">
                <NumericFormat
                  value={subtotalP1}
                  displayType="text"
                  thousandSeparator="."
                  decimalSeparator=","
                  prefix="$"
                />
              </div>
            </div>
          )}
          {cantidadC1 > 0 && (
            <div className="desechable-item">
              <div>
                <span>{cantidadC1}x C1</span>
                <span className="text-muted">($500 c/u)</span>
              </div>
              <div className="desechable-subtotal">
                <NumericFormat
                  value={subtotalC1}
                  displayType="text"
                  thousandSeparator="."
                  decimalSeparator=","
                  prefix="$"
                />
              </div>
            </div>
          )}
        </div>
      );
    }
    return null;
  };

  const renderAdiciones = (adiciones) => (
    adiciones && adiciones.length > 0 && (
      <div className="adiciones-list">
        <div className="section-title">Adiciones</div>
        {adiciones.map((adicion, index) => (
          <div key={index} className="adicion-item">
            <div className="adicion-info">
              <span className="adicion-quantity">{adicion.cantidad}x</span>
              <span className="adicion-name">{adicion.nombreIngrediente}</span>
              {adicion.aplicadoA && (
                <span className="adicion-aplicado">({adicion.aplicadoA})</span>
              )}
            </div>
            <div className="adicion-subtotal">
              <NumericFormat
                value={adicion.subtotal}
                displayType="text"
                thousandSeparator="."
                decimalSeparator=","
                prefix="$"
              />
              <span className="adicion-precio-unitario">
                ($<NumericFormat value={adicion.precioAdicion} displayType="text" thousandSeparator="." decimalSeparator="," /> c/u)
              </span>
            </div>
          </div>
        ))}
      </div>
    )
  );

  const renderFiltros = () => (
    <Card className="filter-card">
      <div className="filter-container">
        <div className="filter-section">
          <h5>
            <FilterOutlined className="me-2" />
            Filtros:
          </h5>

          <RangePicker
            showTime={{
              format: 'HH:mm',
              defaultValue: [
                moment().startOf('day'),
                moment().endOf('day')
              ]
            }}
            format="YYYY-MM-DD HH:mm"
            onChange={dates => setFiltroFecha(dates)}
            placeholder={['Fecha inicio', 'Fecha fin']}
            className="date-range-picker"
          />

          <Select
            value={filtroEstado}
            onChange={setFiltroEstado}
            suffixIcon={<InfoCircleOutlined />}
          >
            <Option value="todos">Todos los estados</Option>
            <Option value="PENDIENTE">Pendientes</Option>
            <Option value="ENTREGADO">Entregados</Option>
            <Option value="CANCELADO">Cancelados</Option>
          </Select>
        </div>

        <div className="action-buttons">
          <Button
            type="default"
            onClick={cargarPedidos}
            icon={<ReloadOutlined />}
          >
            Actualizar
          </Button>

          <Link to="/pedidos-mobile/agregarPedido">
            <Button type="primary" icon={<PlusOutlined />}
              onClick={() => {
                limpiarPedidoEnCurso();
                // Navegar con estado que indique que es un nuevo pedido
                navigate('/pedidos-mobile/agregarPedido', {
                  state: { nuevoPedido: true },
                  replace: true  // Esto evita que el usuario vuelva atrás a la lista
                });
              }}>
              Nuevo Pedido
            </Button>
          </Link>
        </div>
      </div>
    </Card>
  );

  const renderPedido = (pedido) => {
    const { bg, border, icon, color } = getCardColor(pedido.estado);
    const fechaFormateada = moment(pedido.fecha).format('DD MMM YYYY - h:mm a');
    const isExpanded = expandedPedidoId === pedido.id;

    return (
      <Col
        xs={24}
        key={pedido.id}
        className="mb-3"
      >
        <Card
          className={`pedido-card ${isExpanded ? 'expanded-card' : ''}`}
          style={{
            background: bg,
            border: border,
          }}
        >
          <div className="pedido-header">
            <div className="tags-row">
              <Tag color={color} className="estado-tag">
                {pedido.estado}
              </Tag>
              {pedido.domicilio && (
                <Tag color="blue" className="domicilio-tag">
                  DOMICILIO
                </Tag>
              )}
            </div>

            <div className="pedido-info">
              <div className="pedido-icon">{icon}</div>
              <div>
                <div className="pedido-id">Pedido #{pedido.id}</div>
                <div className="pedido-fecha">
                  <CalendarOutlined className="me-1" />
                  {fechaFormateada}
                </div>
              </div>
            </div>
          </div>

          <div className="pedido-body">
            <div className="pedido-total">
              <div>Total:</div>
              <div className="total-value">
                <NumericFormat
                  value={pedido.total}
                  displayType="text"
                  thousandSeparator="."
                  decimalSeparator=","
                  prefix="$"
                />
              </div>
            </div>

            <div className="detalles-container">
              <Button
                type="link"
                onClick={() => setExpandedPedidoId(isExpanded ? null : pedido.id)}
                className="detalles-btn"
              >
                {isExpanded ? 'Ocultar detalles' : 'Ver detalles del pedido'}
                {isExpanded ? <UpOutlined /> : <DownOutlined />}
              </Button>

              {isExpanded && (
                <div className="detalles-expandidos">
                  {pedido.productos && pedido.productos.length > 0 && renderProductos(pedido.productos)}
                  {pedido.combos && pedido.combos.length > 0 && renderCombos(pedido.combos)}
                  {pedido.adiciones && pedido.adiciones.length > 0 && renderAdiciones(pedido.adiciones)}
                  {renderDesechables(pedido.cantidadP1, pedido.cantidadC1)}
                  {pedido.domicilio && (
                    <div className="domicilio-info">
                      <div className="section-title">Domicilio</div>
                      <div className="domicilio-cost">
                        <NumericFormat
                          value={pedido.costoDomicilio}
                          displayType="text"
                          thousandSeparator="."
                          decimalSeparator=","
                          prefix="$"
                        />
                      </div>
                    </div>
                  )}

                  {pedido.detalles && pedido.detalles !== "Sin detalles" && (
                    <div className="detalles-adicionales">
                      <div className="section-title">Detalles adicionales</div>
                      <p>{pedido.detalles}</p>
                    </div>
                  )}

                  {pedido.estado === 'ENTREGADO' && pedido.metodoPago && (
                    <div className="metodo-pago">
                      <div className="section-title">Método de pago</div>
                      <Tag
                        color={pedido.metodoPago === 'EFECTIVO' ? 'green' : 'blue'}
                        className="pago-tag"
                      >
                        {pedido.metodoPago}
                      </Tag>
                    </div>
                  )}
                </div>
              )}
            </div>
          </div>

          <div className="pedido-footer">
            <div className="action-buttons-footer">
              <Button
                type="primary"
                onClick={() => navigate(`/pedidos-mobile/editarPedido/${pedido.id}`)}
                className="action-btn"
                icon={<EditOutlined />}
              >
                Editar
              </Button>
            </div>
          </div>
        </Card>
      </Col>
    );
  };

  return (
    <div className="listado-container-empleado">
      <div className="page-header">
        <h1>Listado de Pedidos</h1>
        <p>Gestión de pedidos para empleados</p>
      </div>

      {renderFiltros()}

      <Tabs
        activeKey={filtroEstado === 'todos' ? 'todos' : filtroEstado}
        onChange={(key) => setFiltroEstado(key === 'todos' ? 'todos' : key)}
        className="estado-tabs"
      >
        <TabPane tab="Todos" key="todos">
          {cargando ? (
            <div className="loading-container">
              <Spin size="large" tip="Cargando pedidos..." />
            </div>
          ) : pedidosFiltrados.length === 0 ? (
            <Card className="empty-card">
              <Empty
                image={Empty.PRESENTED_IMAGE_SIMPLE}
                description="No se encontraron pedidos"
              >
                <p className="text-muted mb-3">Intenta cambiar los filtros o crear un nuevo pedido</p>
                <Link to="/pedidos-mobile/agregarPedido">
                  <Button type="primary" icon={<PlusOutlined />}
                    onClick={() => {
                      limpiarPedidoEnCurso();
                      // Navegar con estado que indique que es un nuevo pedido
                      navigate('/pedidos-mobile/agregarPedido', {
                        state: { nuevoPedido: true },
                        replace: true
                      });
                    }}>
                    Nuevo Pedido
                  </Button>
                </Link>
              </Empty>
            </Card>
          ) : (
            <Row gutter={[16, 16]}>
              {pedidosFiltrados.map(renderPedido)}
            </Row>
          )}
        </TabPane>
        <TabPane tab="Pendientes" key="PENDIENTE">
          <Row gutter={[16, 16]}>
            {pedidosFiltrados.filter(p => p.estado === 'PENDIENTE').map(renderPedido)}
          </Row>
        </TabPane>
        <TabPane tab="Entregados" key="ENTREGADO">
          <Row gutter={[16, 16]}>
            {pedidosFiltrados
              .filter(p => p.estado === 'ENTREGADO')
              .map(renderPedido)
            }
          </Row>
        </TabPane>
        <TabPane tab="Cancelados" key="CANCELADO">
          <Row gutter={[16, 16]}>
            {pedidosFiltrados
              .filter(p => p.estado === 'CANCELADO')
              .map(renderPedido)
            }
          </Row>
        </TabPane>
      </Tabs>
    </div>
  );
}