import axios from 'axios';
import React, { useEffect, useState } from 'react'
import { Link, useNavigate } from 'react-router-dom';
import Badge from 'react-bootstrap/Badge';
import Button from 'react-bootstrap/Button';
import { es } from 'date-fns/locale';
import { format, parseISO } from 'date-fns';
import { NumericFormat } from 'react-number-format';


export default function ListadoPedidos() {

  const navigate = useNavigate();  
  const urlBase = 'http://localhost:9090/api/pedidos';
  const [pedidos, setPedidos] = useState([]);
  const [filtroFecha, setFiltroFecha] = useState('todos');
  const [filtroEstado, setFiltroEstado] = useState('todos');
  const [estadisticas, setEstadisticas] = useState({
    entregados: 0,
    pendientes: 0
  });

  useEffect(() => {
    cargarPedidos();
  }, [filtroFecha]);

  const cargarPedidos = async () => {
    try {
      const resultado = await axios.get(urlBase);
      console.log("Resultado de cargar pedidos");
      console.log(resultado.data);
      const todosPedidos = resultado.data;
      
      // Filtrar por fecha
      const pedidosFiltrados = filtrarPorFecha(todosPedidos, filtroFecha);
      setPedidos(pedidosFiltrados);
      
      // Calcular estadísticas
      calcularEstadisticas(todosPedidos);
    } catch (error) {
      console.error("Error cargando pedidos:", error);
    }
  };

  // Función de filtrado combinada
const filtrarPedidos = (pedidos) => {
    return pedidos.filter(pedido => {
      const cumpleFecha = filtrarPorFecha([pedido], filtroFecha).length > 0;
      const cumpleEstado = filtroEstado === 'todos' || pedido.estado === filtroEstado;
      return cumpleFecha && cumpleEstado;
    });
  };

  const filtrarPorFecha = (pedidos, filtro) => {
    const ahora = new Date();
    return pedidos.slice()
                    .sort((a, b) => new Date(b.fecha) - new Date(a.fecha)) 
                    .filter(pedido => {
      const fechaPedido = parseISO(pedido.fecha);
      
      switch(filtro) {
        case 'hoy':
          return fechaPedido.toDateString() === ahora.toDateString();
        case 'semana':
          const inicioSemana = new Date(ahora.setDate(ahora.getDate() - ahora.getDay()));
          return fechaPedido >= inicioSemana;
        case 'mes':
          return fechaPedido.getMonth() === ahora.getMonth() && 
                 fechaPedido.getFullYear() === ahora.getFullYear();
        case 'todos':
            return pedidos;
        default:
          return true;
      }
    });
  };

  const calcularEstadisticas = (pedidos) => {
    const entregados = pedidos.filter(p => p.estado === 'ENTREGADO').length;
    const pendientes = pedidos.filter(p => p.estado === 'PENDIENTE').length;
    
    setEstadisticas({ entregados, pendientes });
  };

  const cambiarEstado = async (idPedido, nuevoEstado) => {
    try {
      await axios.put(`${urlBase}/${idPedido}/estado?estado=${nuevoEstado}`);
      cargarPedidos();
    } catch (error) {
      console.error("Error actualizando estado:", error);
    }
  };

  const getCardColor = (estado) => {
    switch(estado) {
      case 'PENDIENTE': return '#FFF3CD';
      case 'CANCELADO': return '#F8D7DA';
      case 'ENTREGADO': return '#D4EDDA';
      default: return '#FFFFFF';
    }
  };



  return (
    <div className="container">
    <div className="container text-center" style={{ margin: '30px' }}>
      <h1>Listado de Pedidos</h1>
    </div>

    <div className="d-flex align-items-center mb-4 gap-3">
      <Link className="btn btn-primary" to="/agregarPedido">
        Nuevo Pedido
      </Link>
      
      <select 
        className="form-select w-auto"
        value={filtroFecha}
        onChange={(e) => setFiltroFecha(e.target.value)}
      >
        <option value="hoy">Hoy</option>
        <option value="semana">Esta semana</option>
        <option value="mes">Este mes</option>
        <option value="todos">Todos</option>
      </select>
      <select 
            className="form-select w-auto"
            value={filtroEstado}
            onChange={(e) => setFiltroEstado(e.target.value)}
        >
            <option value="todos">Todos los estados</option>
            <option value="PENDIENTE">Pendientes</option>
            <option value="ENTREGADO">Entregados</option>
            <option value="CANCELADO">Cancelados</option>
        </select>

      <div className="ms-auto d-flex gap-4">
        <div className="text-success">
          <h5>Entregados: {estadisticas.entregados}</h5>
        </div>
        <div className="text-warning">
          <h5>Pendientes: {estadisticas.pendientes}</h5>
        </div>
      </div>
    </div>

    <div className="row row-cols-1 row-cols-md-3 g-4">  {/* Nueva disposición */}
        {filtrarPedidos(pedidos).map(pedido => (
          <div className="col" key={pedido.id}>  
           
            <div className="card h-100" style={{ backgroundColor: getCardColor(pedido.estado) }} 
            onClick={() => navigate(`/editarPedido/${pedido.id}`)}>
              <div className="card-body d-flex flex-column">
                {/* Cabecera */}
                <div className="d-flex justify-content-between align-items-start mb-3">
                  <div>
                    <h6 className="card-subtitle text-muted mb-2">
                      {format(parseISO(pedido.fecha), 'dd MMM yyyy - h:mm a', { locale: es })}
                    </h6>
                    <Badge bg="secondary">{pedido.estado}</Badge>
                  </div>
                  <h4 className="text-success">
                    <NumericFormat 
                      value={pedido.total} 
                      displayType="text" 
                      thousandSeparator="," 
                      prefix="$" 
                    />
                  </h4>
                </div>

                
                
                {/* Lista de productos */}
                <div className="mt-auto">
                  <h6 className="text-primary">Productos:</h6>
                  <ul className="list-unstyled small">
                    {pedido.productos.map((producto, index) => (
                      <li key={index} className="text-dark">
                        {producto.cantidad}x {producto.nombre} 
                        <span className="text-muted ms-2">
                          (<NumericFormat 
                            value={producto.precio} 
                            displayType="text" 
                            thousandSeparator="," 
                            prefix="$" 
                          />)
                        </span>
                      </li>
                    ))}
                  </ul>
                </div>

                {/* Detalles del pedido - Sección mejorada */}
                <div className="mb-3">
                    <h6 className="text-primary">Detalles:</h6>
                    <p className="card-text small text-dark">
                        {pedido.detalles || "Sin detalles"} {/* Maneja null/undefined */}
                    </p>
                </div>

                {/* Botones */}
                <div className="d-flex gap-2 justify-content-end mt-3">
                  {pedido.estado === 'PENDIENTE' && (
                    <>
                      <Button 
                        variant="danger" 
                        size="sm"
                        onClick={(e) => {
                          e.stopPropagation(); // ✅ Detener propagación
                          cambiarEstado(pedido.id, 'CANCELADO');
                        }}
                      >
                        Cancelar
                      </Button>
                      <Button 
                        variant="success" 
                        size="sm"
                        onClick={(e) => {
                          e.stopPropagation(); // ✅ Detener propagación
                          cambiarEstado(pedido.id, 'ENTREGADO');
                        }}
                      >
                        Entregar
                      </Button>
                    </>
                  )}
                </div>
              </div>
            </div>
          </div>
        ))}
      </div>
  </div>
  )
}
