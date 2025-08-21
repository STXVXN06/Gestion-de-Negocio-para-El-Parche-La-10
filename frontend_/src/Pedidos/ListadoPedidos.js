import React, { useEffect, useState, useMemo, useCallback } from 'react'; // Añadido useCallback
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
  Modal,
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
  CheckCircleOutlined,
  CloseCircleOutlined,
  ShoppingOutlined,
  DollarOutlined,
  TransactionOutlined,
  CalendarOutlined,
  ClockCircleOutlined,
  DownOutlined,
  UpOutlined,
  MailOutlined,
  CheckCircleFilled,
  CloseCircleFilled,
  ExclamationCircleOutlined,
  ArrowLeftOutlined
} from '@ant-design/icons';
import { parseISO } from 'date-fns'; // Eliminada importación innecesaria de 'es'
import { NumericFormat } from 'react-number-format';
import './ListadoPedidos.css';
import api from '../api';
import moment from 'moment';

const { Option } = Select;
const { TabPane } = Tabs;
const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

export default function ListadoPedidos() {
  const navigate = useNavigate();
  const urlBase = 'http://localhost:9090/api/pedidos';
  const [todosPedidos, setTodosPedidos] = useState([]);
  const [filtroFecha, setFiltroFecha] = useState(null);
  const [filtroEstado, setFiltroEstado] = useState('todos');
  const [cargando, setCargando] = useState(true);
  const [estadisticas, setEstadisticas] = useState({
    entregados: 0,
    pendientes: 0,
    cancelados: 0,
  });
  const [modalVisible, setModalVisible] = useState(false);
  const [modalFacturaVisible, setModalFacturaVisible] = useState(false);
  const [pedidoSeleccionado, setPedidoSeleccionado] = useState(null);
  const [expandedPedidoId, setExpandedPedidoId] = useState(null);
  const [emailCliente, setEmailCliente] = useState('');
  const [enviandoFactura, setEnviandoFactura] = useState(false);
  const [metodoPagoSeleccionado, setMetodoPagoSeleccionado] = useState(null);
  const [mensajeEnvio, setMensajeEnvio] = useState(null);
  const [tipoMensaje, setTipoMensaje] = useState(null);
  const [modalCancelarVisible, setModalCancelarVisible] = useState(false);
  const [ingredientesCancelacion, setIngredientesCancelacion] = useState([]);
  const [cargandoIngredientes, setCargandoIngredientes] = useState(false);
  const [modalEfectivoVisible, setModalEfectivoVisible] = useState(false);
  const [montoRecibido, setMontoRecibido] = useState('');
  const { RangePicker } = DatePicker;

  // CORRECCIÓN: Estado para pedido a cancelar
  const [pedidoACancelar, setPedidoACancelar] = useState(null);

  // CORRECCIÓN: Usar useCallback para resolver dependencia de useEffect
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

  const vuelto = useMemo(() => {
    if (!pedidoSeleccionado || !montoRecibido) return 0;
    return parseFloat(montoRecibido) - pedidoSeleccionado.total;
  }, [pedidoSeleccionado, montoRecibido]);

  useEffect(() => {
    cargarPedidos();

  }, [cargarPedidos]); // CORRECCIÓN: Añadida dependencia

  useEffect(() => {
    if (todosPedidos.length > 0) {
      const entregados = todosPedidos.filter(p => p.estado === 'ENTREGADO').length;
      const pendientes = todosPedidos.filter(p => p.estado === 'PENDIENTE').length;
      const cancelados = todosPedidos.filter(p => p.estado === 'CANCELADO').length;

      setEstadisticas({ entregados, pendientes, cancelados });
    }
  }, [todosPedidos]);

  const pedidosFiltrados = useMemo(() => {
    return todosPedidos.filter(pedido => {
      const fechaPedido = parseISO(pedido.fecha);

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

      await api.put(url);

      setTodosPedidos(prev => prev.map(pedido =>
        pedido.id === idPedido
          ? { ...pedido, estado: nuevoEstado, metodoPago }
          : pedido
      ));

      if (nuevoEstado === 'ENTREGADO') {
        setMetodoPagoSeleccionado(metodoPago);
        if (metodoPago === 'EFECTIVO') {
          setModalFacturaVisible(false);
        } else {
          setModalFacturaVisible(true);
        }
      } else {
        notification.success({
          message: 'Estado actualizado',
          description: `El pedido ha sido ${nuevoEstado.toLowerCase()} correctamente.`,
        });
      }
    } catch (error) {
      console.error("Error actualizando estado:", error);
      notification.error({
        message: 'Error',
        description: 'No se pudo actualizar el estado del pedido.',
      });
    } finally {
      setModalVisible(false);
    }
  };

  const abrirModalEntrega = (pedido) => {
    setPedidoSeleccionado(pedido);
    setModalVisible(true);
  };

  const manejarPagoEfectivo = () => {
    setModalVisible(false);
    setMontoRecibido('');
    setModalEfectivoVisible(true);
  };

  // Nuevo: Confirmar pago en efectivo
  const confirmarPagoEfectivo = async () => {
    if (vuelto < 0) {
      notification.error({
        message: 'Monto insuficiente',
        description: 'El monto recibido es menor que el total a pagar.',
      });
      return;
    }

    await cambiarEstado(pedidoSeleccionado.id, 'ENTREGADO', 'EFECTIVO');
    setModalEfectivoVisible(false);

    setModalFacturaVisible(true);
  };

  const enviarFactura = async () => {
    setMensajeEnvio(null);
    setTipoMensaje(null);

    if (!emailCliente) {
      setTipoMensaje('error');
      setMensajeEnvio('Por favor ingrese un correo electrónico');
      return;
    }

    if (!emailRegex.test(emailCliente)) {
      setTipoMensaje('error');
      setMensajeEnvio('Por favor ingrese un correo electrónico válido');
      return;
    }

    try {
      setEnviandoFactura(true);
      await api.post(`${urlBase}/${pedidoSeleccionado.id}/enviarFactura?email=${emailCliente}`);

      setTipoMensaje('exito');
      setMensajeEnvio(`¡Factura enviada correctamente a ${emailCliente}!`);

      setTimeout(() => {
        setModalFacturaVisible(false);
        setEmailCliente('');
        setMensajeEnvio(null);
        setTipoMensaje(null);
      }, 2000);

    } catch (error) {
      console.error("Error enviando factura:", error);
      setTipoMensaje('error');
      setMensajeEnvio('Error al enviar la factura. Por favor intente nuevamente.');
    } finally {
      setEnviandoFactura(false);
    }
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

  const obtenerIngredientesCancelacion = async (idPedido) => {
    try {
      setCargandoIngredientes(true);
      const response = await api.get(`${urlBase}/${idPedido}/ingredientes-cancelacion`);
      setIngredientesCancelacion(response.data.ingredientes || []);
    } catch (error) {
      console.error("Error obteniendo ingredientes:", error);
      notification.error({
        message: 'Error',
        description: 'No se pudieron obtener los ingredientes para cancelación',
      });
      setIngredientesCancelacion([]);
    } finally {
      setCargandoIngredientes(false);
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
    const fechaFormateada = moment(pedido.fecha).format('DD MMM YYYY - h:mm a');
    const isExpanded = expandedPedidoId === pedido.id;

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
                Editar Pedido
              </Button>

              {pedido.estado === 'PENDIENTE' && (
                <>
                  <Button
                    danger
                    onClick={(e) => {
                      e.stopPropagation();
                      setPedidoACancelar(pedido); // CORRECCIÓN: Usa el estado definido
                      obtenerIngredientesCancelacion(pedido.id);
                      setModalCancelarVisible(true);
                    }}
                    className="action-btn"
                  >
                    Cancelar
                  </Button>

                  {/* Modal para cancelación */}
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

              {pedido.estado === 'ENTREGADO' && (
                <Button
                  type="default"
                  onClick={(e) => {
                    e.stopPropagation();
                    setPedidoSeleccionado(pedido);
                    setModalFacturaVisible(true);
                    setMensajeEnvio(null);
                    setTipoMensaje(null);
                  }}
                  className="action-btn"
                >
                  Enviar Factura
                </Button>
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
                onClick={manejarPagoEfectivo}
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

      {/* Nuevo Modal para pago en efectivo */}
      <Modal
        title="Pago en Efectivo"
        open={modalEfectivoVisible}
        onCancel={() => setModalEfectivoVisible(false)}
        footer={[
          <Button
            key="back"
            onClick={() => {
              setModalEfectivoVisible(false);
              setModalVisible(true); // Volver a selección de método
            }}
            icon={<ArrowLeftOutlined />}
          >
            Volver
          </Button>,
          <Button
            key="submit"
            type="primary"
            onClick={confirmarPagoEfectivo}
            disabled={vuelto < 0}
          >
            Confirmar Pago
          </Button>
        ]}
        centered
        className="efectivo-modal"
      >
        {pedidoSeleccionado && (
          <div className="modal-content">
            <div className="modal-header">
              <h4>Pedido #{pedidoSeleccionado.id}</h4>
              <div className="modal-total">
                Total a pagar:
                <NumericFormat
                  value={pedidoSeleccionado.total}
                  displayType="text"
                  thousandSeparator=","
                  prefix="$"
                  className="total-value"
                />
              </div>
            </div>

            <div className="monto-recibido">
              <label>Monto recibido:</label>
              <NumericFormat
                value={montoRecibido}
                onValueChange={(values) => {
                  setMontoRecibido(values.floatValue);
                }}
                thousandSeparator=","
                prefix="$"
                allowNegative={false}
                decimalScale={0}
                inputMode="numeric"
                className="ant-input"
                style={{ width: '100%' }}
              />
            </div>

            {montoRecibido && (
              <div className="vuelto-section">
                <span>Vuelto:</span>
                <NumericFormat
                  value={vuelto}
                  displayType="text"
                  thousandSeparator=","
                  prefix="$"
                  className="vuelto-value"
                  style={{ color: vuelto < 0 ? 'red' : 'green' }}
                />
              </div>
            )}

            {vuelto < 0 && (
              <p className="text-danger">
                El monto recibido es insuficiente. Faltan: $
                <NumericFormat
                  value={Math.abs(vuelto)}
                  displayType="text"
                  thousandSeparator=","
                />
              </p>
            )}
          </div>
        )}
      </Modal>

      {/* Modal para enviar factura */}
      <Modal
        title={`Enviar factura del pedido #${pedidoSeleccionado?.id}`}
        open={modalFacturaVisible}
        onCancel={() => {
          setModalFacturaVisible(false);
          setEmailCliente('');
          setMensajeEnvio(null);
          setTipoMensaje(null);
        }}
        footer={[
          <Button
            key="cancelar"
            onClick={() => {
              setModalFacturaVisible(false);
              setEmailCliente('');
              setMensajeEnvio(null);
              setTipoMensaje(null);
            }}
          >
            Cancelar
          </Button>,
          <Button
            key="enviar"
            type="primary"
            onClick={enviarFactura}
            loading={enviandoFactura}
            disabled={!!mensajeEnvio}
          >
            Enviar Factura
          </Button>
        ]}
        centered
        className="factura-modal"
      >
        <div className="modal-content">
          <div className="modal-header">
            <h4>Pedido #{pedidoSeleccionado?.id}</h4>
            <div className="modal-total">
              Total:
              <NumericFormat
                value={pedidoSeleccionado?.total}
                displayType="text"
                thousandSeparator=","
                prefix="$"
              />
            </div>
          </div>

          <p className="modal-text">Ingrese el correo electrónico del cliente:</p>

          <Input
            type="email"
            value={emailCliente}
            onChange={(e) => setEmailCliente(e.target.value)}
            placeholder="correo@ejemplo.com"
            className="email-input"
            status={emailCliente && !emailRegex.test(emailCliente) ? "error" : ""}
            disabled={!!mensajeEnvio}
          />

          {mensajeEnvio && (
            <div className={`mensaje-envio ${tipoMensaje}`}>
              {tipoMensaje === 'exito'
                ? <CheckCircleFilled className="icono-mensaje" />
                : <CloseCircleFilled className="icono-mensaje" />}
              <span>{mensajeEnvio}</span>
            </div>
          )}

          {metodoPagoSeleccionado && (
            <p className="modal-info">
              Método de pago: <Tag color={metodoPagoSeleccionado === 'EFECTIVO' ? 'green' : 'blue'}>
                {metodoPagoSeleccionado}
              </Tag>
            </p>
          )}
        </div>
      </Modal>

      {/* Modal para cancelar pedido */}
      <Modal
        title={`Cancelar pedido #${pedidoACancelar?.id}`}
        open={modalCancelarVisible}
        onCancel={() => setModalCancelarVisible(false)}
        footer={[
          <Button key="back" onClick={() => setModalCancelarVisible(false)}>
            Volver
          </Button>,
          <Button
            key="submit"
            type="primary"
            danger
            onClick={() => {
              cambiarEstado(pedidoACancelar.id, 'CANCELADO');
              setModalCancelarVisible(false);
            }}
            disabled={cargandoIngredientes}
          >
            Confirmar Cancelación
          </Button>
        ]}
        centered
        className="cancelacion-modal"
      >
        {pedidoACancelar && (
          <div className="modal-content">
            <div className="modal-header">
              <h4>Pedido #{pedidoACancelar.id}</h4>
              <div className="modal-total">
                <NumericFormat
                  value={pedidoACancelar.total}
                  displayType="text"
                  thousandSeparator=","
                  prefix="Total: $"
                />
              </div>
            </div>

            <p className="modal-text">
              ¿Está seguro que desea cancelar este pedido?
              Al cancelar, se devolverán los siguientes ingredientes al stock:
            </p>

            {cargandoIngredientes ? (
              <div className="loading-ingredientes">
                <Spin size="small" />
                <span>Calculando ingredientes a devolver...</span>
              </div>
            ) : ingredientesCancelacion.length > 0 ? (
              <div className="ingredientes-list">
                <div className="section-title">Ingredientes a devolver:</div>
                {ingredientesCancelacion.map((ingrediente, index) => (
                  <div key={index} className="ingrediente-item">
                    <span className="ingrediente-nombre">{ingrediente.nombre}: </span>
                    <span className="ingrediente-cantidad">
                      {ingrediente.cantidad} {ingrediente.unidad}
                    </span>
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-warning">No se encontraron ingredientes para devolver</p>
            )}

            <p className="modal-warning">
              <ExclamationCircleOutlined className="text-danger me-2" />
              Esta acción no se puede deshacer
            </p>
          </div>
        )}
      </Modal>
    </div>
  );
}