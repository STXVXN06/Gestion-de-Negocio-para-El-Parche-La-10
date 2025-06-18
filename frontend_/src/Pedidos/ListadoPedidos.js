import React, { useEffect, useState, useMemo } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import axios from 'axios';
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
  Modal,
  Tabs,
} from 'antd';
import {
  FilterOutlined,
  PlusOutlined,
  ReloadOutlined,
  InfoCircleOutlined,
  CheckCircleOutlined,
  CloseCircleOutlined,
  ShoppingOutlined,
  DollarOutlined,
  TransactionOutlined,
  CalendarOutlined,
  ClockCircleOutlined,
  DownOutlined,
  UpOutlined
} from '@ant-design/icons';
import { format, parseISO, isToday, isThisWeek, isThisMonth } from 'date-fns';
import { es } from 'date-fns/locale';
import { NumericFormat } from 'react-number-format';
import './ListadoPedidos.css';

const { Option } = Select;
const { TabPane } = Tabs;

export default function ListadoPedidos() {
  const navigate = useNavigate();
  const urlBase = 'http://localhost:9090/api/pedidos';
  const [todosPedidos, setTodosPedidos] = useState([]);
  const [filtroFecha, setFiltroFecha] = useState('hoy');
  const [filtroEstado, setFiltroEstado] = useState('todos');
  const [cargando, setCargando] = useState(true);
  const [estadisticas, setEstadisticas] = useState({
    entregados: 0,
    pendientes: 0,
    cancelados: 0,
  });
  const [modalVisible, setModalVisible] = useState(false);
  const [pedidoSeleccionado, setPedidoSeleccionado] = useState(null);
  const [activeTab, setActiveTab] = useState('todos');
  const [expandedPedidoId, setExpandedPedidoId] = useState(null);

  useEffect(() => {
    cargarPedidos();
  }, []);

  const cargarPedidos = async () => {
    try {
      setCargando(true);
      const resultado = await axios.get(urlBase);
      setTodosPedidos(resultado.data);
      calcularEstadisticas(resultado.data);
    } catch (error) {
      console.error("Error cargando pedidos:", error);
    } finally {
      setCargando(false);
    }
  };

  const pedidosFiltrados = useMemo(() => {
    return todosPedidos.filter(pedido => {
      const fechaPedido = parseISO(pedido.fecha);

      const cumpleFecha =
        filtroFecha === 'todos' ||
        (filtroFecha === 'hoy' && isToday(fechaPedido)) ||
        (filtroFecha === 'semana' && isThisWeek(fechaPedido, { locale: es })) ||
        (filtroFecha === 'mes' && isThisMonth(fechaPedido));

      const cumpleEstado =
        filtroEstado === 'todos' ||
        pedido.estado === filtroEstado;

      return cumpleFecha && cumpleEstado;
    }).sort((a, b) => new Date(b.fecha) - new Date(a.fecha));
  }, [todosPedidos, filtroFecha, filtroEstado]);

  const calcularEstadisticas = (pedidos) => {
    const entregados = pedidos.filter(p => p.estado === 'ENTREGADO').length;
    const pendientes = pedidos.filter(p => p.estado === 'PENDIENTE').length;
    const cancelados = pedidos.filter(p => p.estado === 'CANCELADO').length;

    setEstadisticas({ entregados, pendientes, cancelados });
  };

  const cambiarEstado = async (idPedido, nuevoEstado, metodoPago = null) => {
    try {
      const url = metodoPago
        ? `${urlBase}/${idPedido}/estado?estado=${nuevoEstado}&metodoPago=${metodoPago}`
        : `${urlBase}/${idPedido}/estado?estado=${nuevoEstado}`;

      await axios.put(url);

      setTodosPedidos(prev => prev.map(pedido =>
        pedido.id === idPedido
          ? { ...pedido, estado: nuevoEstado, metodoPago }
          : pedido
      ));
    } catch (error) {
      console.error("Error actualizando estado:", error);
    } finally {
      setModalVisible(false);
    }
  };

  const abrirModalEntrega = (pedido) => {
    setPedidoSeleccionado(pedido);
    setModalVisible(true);
  };

  const getCardColor = (estado) => {
    switch (estado) {
      case 'PENDIENTE': return {
        bg: 'linear-gradient(to right, #fff9db, #fff3bf)',
        border: '1px solid #ffd43b',
        icon: <ClockCircleOutlined className="text-warning" />,
        color: '#fcc419'
      };
      case 'CANCELADO': return {
        bg: 'linear-gradient(to right, #ffe3e3, #ffc9c9)',
        border: '1px solid #ff6b6b',
        icon: <CloseCircleOutlined className="text-danger" />,
        color: '#ff6b6b'
      };
      case 'ENTREGADO': return {
        bg: 'linear-gradient(to right, #d3f9d8, #b2f2bb)',
        border: '1px solid #40c057',
        icon: <CheckCircleOutlined className="text-success" />,
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
                thousandSeparator=","
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
                  thousandSeparator=","
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
                  thousandSeparator=","
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
                  thousandSeparator=","
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
                thousandSeparator=","
                prefix="$"
              />
              <span className="adicion-precio-unitario">
                ($<NumericFormat value={adicion.precioAdicion} displayType="text" thousandSeparator="," /> c/u)
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

          <Select
            value={filtroFecha}
            onChange={setFiltroFecha}
            suffixIcon={<CalendarOutlined />}
          >
            <Option value="hoy">Hoy</Option>
            <Option value="semana">Esta semana</Option>
            <Option value="mes">Este mes</Option>
            <Option value="todos">Todas las fechas</Option>
          </Select>

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

          <Link to="/agregarPedido">
            <Button type="primary" icon={<PlusOutlined />}>
              Nuevo Pedido
            </Button>
          </Link>
        </div>
      </div>
    </Card>
  );

  const renderPedido = (pedido) => {
    const { bg, border, icon, color } = getCardColor(pedido.estado);
    const fechaFormateada = format(parseISO(pedido.fecha), 'dd MMM yyyy - h:mm a', { locale: es });
    const isExpanded = expandedPedidoId === pedido.id;
    const esPestanaTodos = activeTab === 'todos';

    return (
      <Col
        xs={24}
        sm={12}
        lg={8}
        key={pedido.id}
        className="mb-3"
        style={{ display: 'flex' }}
      >
        <Card
          className={`pedido-card ${isExpanded ? 'expanded-card' : ''}`}
          style={{
            background: bg,
            border: border,
            display: 'flex',
            flexDirection: 'column',
            flex: 1
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

          <div className="pedido-body" style={{ flexGrow: 1 }}>
            <div className="pedido-total">
              <div>Total:</div>
              <div className="total-value">
                <NumericFormat
                  value={pedido.total}
                  displayType="text"
                  thousandSeparator=","
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
                          thousandSeparator=","
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
                        icon={pedido.metodoPago === 'EFECTIVO' ? <DollarOutlined /> : <TransactionOutlined />}
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
                type="text"
                onClick={() => navigate(`/editarPedido/${pedido.id}`)}
                className="action-btn"
              >
                Ver Detalles
              </Button>

              {pedido.estado === 'PENDIENTE' && (
                <>
                  <Button
                    danger
                    onClick={(e) => {
                      e.stopPropagation();
                      cambiarEstado(pedido.id, 'CANCELADO');
                    }}
                    className="action-btn"
                  >
                    Cancelar
                  </Button>
                  <Button
                    type="primary"
                    onClick={(e) => {
                      e.stopPropagation();
                      abrirModalEntrega(pedido);
                    }}
                    className="action-btn"
                  >
                    Entregar
                  </Button>
                </>
              )}
            </div>
          </div>
        </Card>
      </Col>
    );
  };

  return (
    <div className="listado-container">
      <div className="page-header">
        <h1>Listado de Pedidos</h1>
        <p>Administra todos los pedidos de tu restaurante</p>
      </div>

      {renderFiltros()}

      <Tabs
        activeKey={filtroEstado === 'todos' ? 'todos' : filtroEstado}
        onChange={(key) => setFiltroEstado(key === 'todos' ? 'todos' : key)}
        className="estado-tabs"
      >
        <TabPane tab={<span className="tab-all">Todos</span>} key="todos">
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
                <Link to="/agregarPedido">
                  <Button type="primary" icon={<PlusOutlined />}>
                    Crear nuevo pedido
                  </Button>
                </Link>
              </Empty>
            </Card>
          ) : (
            <Row gutter={[16, 16]} style={{ alignItems: 'flex-start' }}>
              {pedidosFiltrados.map(renderPedido)}
            </Row>
          )}
        </TabPane>
        <TabPane
          tab={
            <span className="tab-pending">
              <Badge count={estadisticas.pendientes} overflowCount={99} offset={[10, -5]}>
                Pendientes
              </Badge>
            </span>
          }
          key="PENDIENTE"
        >
          <Row gutter={[16, 16]} style={{ alignItems: 'flex-start' }}>
            {pedidosFiltrados.filter(p => p.estado === 'PENDIENTE').map(renderPedido)}
          </Row>
        </TabPane>
        <TabPane
          tab={
            <span className="tab-delivered">
              <Badge count={estadisticas.entregados} overflowCount={99} offset={[10, -5]}>
                Entregados
              </Badge>
            </span>
          }
          key="ENTREGADO"
        >
          <Row gutter={[16, 16]} style={{ alignItems: 'flex-start' }}>
            {pedidosFiltrados
              .filter(p => p.estado === 'ENTREGADO')
              .map(renderPedido)
            }
          </Row>
        </TabPane>
        <TabPane
          tab={
            <span className="tab-canceled">
              <Badge count={estadisticas.cancelados} overflowCount={99} offset={[10, -5]}>
                Cancelados
              </Badge>
            </span>
          }
          key="CANCELADO"
        >
          <Row gutter={[16, 16]} style={{ alignItems: 'flex-start' }}>
            {pedidosFiltrados
              .filter(p => p.estado === 'CANCELADO')
              .map(renderPedido)
            }
          </Row>
        </TabPane>
      </Tabs>

      {/* Modal para selección de método de pago */}
      <Modal
        title="Confirmar entrega"
        open={modalVisible}
        onCancel={() => setModalVisible(false)}
        footer={null}
        centered
        className="pago-modal"
      >
        {pedidoSeleccionado && (
          <div className="modal-content">
            <div className="modal-header">
              <h4>Pedido #{pedidoSeleccionado.id}</h4>
              <div className="modal-total">
                Total:
                <NumericFormat
                  value={pedidoSeleccionado.total}
                  displayType="text"
                  thousandSeparator=","
                  prefix="$"
                />
              </div>
            </div>

            <p className="modal-text">Seleccione el método de pago utilizado:</p>

            <div className="pago-options">
              <Button
                type="primary"
                icon={<DollarOutlined />}
                className="pago-option"
                onClick={() => cambiarEstado(pedidoSeleccionado.id, 'ENTREGADO', 'EFECTIVO')}
              >
                EFECTIVO
              </Button>

              <Button
                type="primary"
                icon={<TransactionOutlined />}
                className="pago-option"
                onClick={() => cambiarEstado(pedidoSeleccionado.id, 'ENTREGADO', 'TRANSFERENCIA')}
              >
                TRANSFERENCIA
              </Button>
            </div>
          </div>
        )}
      </Modal>
    </div>
  );
}