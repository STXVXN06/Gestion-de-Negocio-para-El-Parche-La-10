import axios from 'axios';
import React, { useEffect, useState, useMemo } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import {
  Badge,
  Button,
  Card,
  Row,
  Col,
  Statistic,
  Select,
  Spin,
  Empty,
  Tag
} from 'antd';
import {
  FilterOutlined,
  PlusOutlined,
  ReloadOutlined,
  InfoCircleOutlined,
  CheckCircleOutlined,
  CloseCircleOutlined,
  ShoppingOutlined
} from '@ant-design/icons';
import { es } from 'date-fns/locale';
import { format, parseISO, isToday, isThisWeek, isThisMonth } from 'date-fns';
import { NumericFormat } from 'react-number-format';
import './ListadoPedidos.css'; // Archivo CSS personalizado

const { Option } = Select;

export default function ListadoPedidos() {
  const navigate = useNavigate();
  const urlBase = 'http://localhost:9090/api/pedidos';
  const [todosPedidos, setTodosPedidos] = useState([]);
  const [filtroFecha, setFiltroFecha] = useState('todos');
  const [filtroEstado, setFiltroEstado] = useState('todos');
  const [cargando, setCargando] = useState(true);
  const [estadisticas, setEstadisticas] = useState({
    entregados: 0,
    pendientes: 0,
    cancelados: 0,
    total: 0
  });

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

      // Filtro por fecha
      const cumpleFecha =
        filtroFecha === 'todos' ||
        (filtroFecha === 'hoy' && isToday(fechaPedido)) ||
        (filtroFecha === 'semana' && isThisWeek(fechaPedido, { locale: es })) ||
        (filtroFecha === 'mes' && isThisMonth(fechaPedido));

      // Filtro por estado
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
    const total = pedidos.reduce((sum, pedido) => sum + pedido.total, 0);

    setEstadisticas({ entregados, pendientes, cancelados, total });
  };

  const cambiarEstado = async (idPedido, nuevoEstado) => {
    try {
      await axios.put(`${urlBase}/${idPedido}/estado?estado=${nuevoEstado}`);
      // Actualizar estado localmente para mejor rendimiento
      setTodosPedidos(prev => prev.map(pedido =>
        pedido.id === idPedido ? { ...pedido, estado: nuevoEstado } : pedido
      ));
    } catch (error) {
      console.error("Error actualizando estado:", error);
    }
  };

  const getCardColor = (estado) => {
    switch (estado) {
      case 'PENDIENTE': return {
        bg: 'bg-warning-subtle',
        border: 'border-warning',
        icon: <InfoCircleOutlined className="text-warning" />,
        color: 'warning'
      };
      case 'CANCELADO': return {
        bg: 'bg-danger-subtle',
        border: 'border-danger',
        icon: <CloseCircleOutlined className="text-danger" />,
        color: 'error'
      };
      case 'ENTREGADO': return {
        bg: 'bg-success-subtle',
        border: 'border-success',
        icon: <CheckCircleOutlined className="text-success" />,
        color: 'success'
      };
      default: return {
        bg: 'bg-light',
        border: 'border-secondary',
        icon: <InfoCircleOutlined />,
        color: 'default'
      };
    }
  };

  const renderProductos = (productos) => (
    <div className="mt-2">
      <h6 className="text-primary">
        <ShoppingOutlined className="me-2" />
        Productos:
      </h6>
      <ul className="list-unstyled small mb-0">
        {productos.map((producto, index) => (
          <li key={index} className="text-dark d-flex justify-content-between">
            <span>
              {producto.cantidad}x {producto.nombre}
            </span>
            <span className="text-muted">
              <NumericFormat
                value={producto.precio}
                displayType="text"
                thousandSeparator=","
                prefix="$"
              />
            </span>
          </li>
        ))}
      </ul>
    </div>
  );

  const renderCombos = (combos) => (
    combos && combos.length > 0 && (
      <div className="mt-3">
        <h6 className="text-primary">
          <ShoppingOutlined className="me-2" />
          Combos:
        </h6>
        <ul className="list-unstyled small mb-0">
          {combos.map((combo, index) => (
            <li key={index} className="text-dark d-flex justify-content-between">
              <span>
                {combo.cantidad}x {combo.nombre}
              </span>
              <span className="text-muted">
                <NumericFormat
                  value={combo.precio}
                  displayType="text"
                  thousandSeparator=","
                  prefix="$"
                />
              </span>
            </li>
          ))}
        </ul>
      </div>
    )
  );

  const renderFiltros = () => (
    <Card className="mb-4 shadow-sm">
      <div className="d-flex flex-wrap align-items-center gap-3">
        <h5 className="mb-0 d-flex align-items-center">
          <FilterOutlined className="me-2 text-primary" />
          Filtros:
        </h5>

        <div className="d-flex flex-wrap gap-2 flex-grow-1">
          <Select
            className="w-100 w-md-auto"
            value={filtroFecha}
            onChange={setFiltroFecha}
            suffixIcon={<FilterOutlined />}
          >
            <Option value="hoy">Hoy</Option>
            <Option value="semana">Esta semana</Option>
            <Option value="mes">Este mes</Option>
            <Option value="todos">Todas las fechas</Option>
          </Select>

          <Select
            className="w-100 w-md-auto"
            value={filtroEstado}
            onChange={setFiltroEstado}
            suffixIcon={<FilterOutlined />}
          >
            <Option value="todos">Todos los estados</Option>
            <Option value="PENDIENTE">Pendientes</Option>
            <Option value="ENTREGADO">Entregados</Option>
            <Option value="CANCELADO">Cancelados</Option>
          </Select>

          <Button
            type="primary"
            className="ms-md-auto"
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

  const renderEstadisticas = () => (
    <Card className="mb-4 shadow-sm">
      <Row gutter={[16, 16]} justify="space-between" align="middle">
        <Col xs={24} md={12} className="d-flex flex-wrap gap-4">
          <Statistic
            title="Total"
            value={estadisticas.total}
            precision={0}
            valueStyle={{ color: '#1677ff' }}
            prefix="$"
            className="statistic-card"
          />

          <Statistic
            title="Entregados"
            value={estadisticas.entregados}
            valueStyle={{ color: '#52c41a' }}
            className="statistic-card"
          />

          <Statistic
            title="Pendientes"
            value={estadisticas.pendientes}
            valueStyle={{ color: '#faad14' }}
            className="statistic-card"
          />

          <Statistic
            title="Cancelados"
            value={estadisticas.cancelados}
            valueStyle={{ color: '#ff4d4f' }}
            className="statistic-card"
          />
        </Col>

        <Col xs={24} md={12} className="text-md-end">
          <span className="text-muted">
            Mostrando {pedidosFiltrados.length} de {todosPedidos.length} pedidos
          </span>
        </Col>
      </Row>
    </Card>
  );

  const renderPedido = (pedido) => {
    const { bg, border, icon, color } = getCardColor(pedido.estado);

    return (
      <Col xs={24} sm={12} lg={8} key={pedido.id} className="mb-4">
        <Card
          className={`h-100 ${bg}`}
          bordered={false}
          hoverable
          onClick={() => navigate(`/editarPedido/${pedido.id}`)}
          bodyStyle={{ padding: '16px' }}
        >
          <div className="d-flex justify-content-between align-items-start mb-2">
            <div className="d-flex align-items-center">
              {icon}
              <Tag color={color} className="ms-2">
                {pedido.estado}
              </Tag>
            </div>

            <h4 className="text-success fw-bold mb-0">
              <NumericFormat
                value={pedido.total}
                displayType="text"
                thousandSeparator=","
                prefix="$"
              />
            </h4>
          </div>

          <div className="mb-3">
            <small className="text-muted">
              {format(parseISO(pedido.fecha), 'dd MMM yyyy - h:mm a', { locale: es })}
            </small>
          </div>

          {/* Contenido del pedido */}
          <div className="flex-grow-1">
            {pedido.productos && pedido.productos.length > 0 && renderProductos(pedido.productos)}
            {pedido.combos && pedido.combos.length > 0 && renderCombos(pedido.combos)}

            {pedido.detalles && (
              <div className="mt-3">
                <h6 className="text-primary">
                  <InfoCircleOutlined className="me-2" />
                  Detalles:
                </h6>
                <p className="card-text small text-dark mb-0">
                  {pedido.detalles}
                </p>
              </div>
            )}
          </div>

          {/* Botones de acción */}
          <div className="d-flex gap-2 justify-content-end mt-3">
            {pedido.estado === 'PENDIENTE' && (
              <>
                <Button
                  danger
                  size="small"
                  onClick={(e) => {
                    e.stopPropagation();
                    cambiarEstado(pedido.id, 'CANCELADO');
                  }}
                >
                  Cancelar
                </Button>
                <Button
                  type="primary"
                  size="small"
                  onClick={(e) => {
                    e.stopPropagation();
                    cambiarEstado(pedido.id, 'ENTREGADO');
                  }}
                >
                  Entregar
                </Button>
              </>
            )}
          </div>
        </Card>
      </Col>
    );
  };

  return (
    <div className="container py-4">
      <div className="text-center mb-4">
        <h1 className="fw-bold text-primary">Listado de Pedidos</h1>
        <p className="text-muted">Administra todos los pedidos de tu restaurante</p>
      </div>

      {renderFiltros()}
      {renderEstadisticas()}

      {cargando ? (
        <div className="text-center py-5">
          <Spin size="large" tip="Cargando pedidos..." />
        </div>
      ) : pedidosFiltrados.length === 0 ? (
        <Card className="shadow-sm">
          <Empty
            image={Empty.PRESENTED_IMAGE_SIMPLE}
            description={
              <span className="text-muted">No se encontraron pedidos</span>
            }
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
        <Row gutter={[16, 16]}>
          {pedidosFiltrados.map(renderPedido)}
        </Row>
      )}
    </div>
  );
}