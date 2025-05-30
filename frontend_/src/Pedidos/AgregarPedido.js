import axios from 'axios';
import React, { useEffect, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { NumericFormat } from 'react-number-format';

export default function AgregarPedido() {
  const navigate = useNavigate();
  const [productosDisponibles, setProductosDisponibles] = useState([]);
  const [productosSeleccionados, setProductosSeleccionados] = useState([]);
  const [detalles, setDetalles] = useState('');

  // Obtener productos activos del backend
  useEffect(() => {
    const cargarProductos = async () => {
      try {
        const response = await axios.get('http://localhost:9090/api/productos');
        setProductosDisponibles(response.data.filter(p => p.activo));
      } catch (error) {
        console.error("Error cargando productos:", error);
      }
    };
    cargarProductos();
  }, []);

  // Manejar cambios en las cantidades
  const actualizarCantidad = (productoId, nuevaCantidad) => {
    const cantidad = Math.max(nuevaCantidad, 0); // No permitir negativos
    
    setProductosSeleccionados(prev => {
      const existe = prev.find(p => p.productoId === productoId);
      if (existe) {
        return prev.map(p => 
          p.productoId === productoId ? { ...p, cantidad } : p
        );
      }
      return [...prev, { productoId, cantidad }];
    });
  };

  // Enviar pedido al backend
  const onSubmit = async (e) => {
    e.preventDefault();
    
    const pedidoDTO = {
      productos: productosSeleccionados
        .filter(p => p.cantidad > 0)
        .map(p => ({
          productoId: p.productoId,
          cantidad: p.cantidad
        })),
      detalles// Si tu backend lo requiere
    };

    try {
      await axios.post('http://localhost:9090/api/pedidos', pedidoDTO);
      navigate('/pedidos');
    } catch (error) {
      console.error("Error creando pedido:", error.response?.data);
      alert(`Error: ${error.response?.data.mensaje || "Revise los datos"}`);
    }
  };

  return (
    <div className='container'>
      <div className='container text-center' style={{ margin: '30px' }}>
        <h1>Nuevo Pedido</h1>
      </div>
      
      <form onSubmit={onSubmit}>
        {/* Campo para detalles (opcional) */}
        <div className='mb-3'>
          <label htmlFor="detalles" className='form-label'>Detalles adicionales</label>
          <textarea 
            className='form-control' 
            id="detalles" 
            value={detalles}
            onChange={(e) => setDetalles(e.target.value)}
          />
        </div>

        {/* Listado de productos */}
        <div className='mb-4'>
          <h4>Seleccione productos</h4>
          <div className='row'>
            {productosDisponibles.map((producto) => {
              const seleccionado = productosSeleccionados.find(p => p.productoId === producto.id);
              
              return (
                <div key={producto.id} className='col-4 mb-3'>
                  <div className='card h-100'>
                    <div className='card-body'>
                      <h5 className='card-title'>{producto.nombre}</h5>
                      <p className='card-text'>
                        <small className='text-muted'>{producto.tipo}</small><br/>
                        <NumericFormat 
                          value={producto.precio} 
                          displayType="text" 
                          thousandSeparator="," 
                          prefix="$" 
                        />
                      </p>
                      
                      <div className='d-flex align-items-center justify-content-center'>
                        <button
                          type='button'
                          className='btn btn-secondary btn-sm'
                          onClick={() => actualizarCantidad(producto.id, (seleccionado?.cantidad || 0) - 1)}
                        >
                          -
                        </button>
                        
                        <input
                          type="number"
                          className='form-control mx-2 text-center'
                          style={{ width: '70px' }}
                          value={seleccionado?.cantidad || 0}
                          onChange={(e) => actualizarCantidad(producto.id, parseInt(e.target.value) || 0)}
                          min="0"
                        />
                        
                        <button
                          type='button'
                          className='btn btn-secondary btn-sm'
                          onClick={() => actualizarCantidad(producto.id, (seleccionado?.cantidad || 0) + 1)}
                        >
                          +
                        </button>
                      </div>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        <div className='container text-center'>
          <button 
            type="submit" 
            className='btn btn-warning btn-sm me-3'
            disabled={productosSeleccionados.length === 0}
          >
            Crear Pedido
          </button>
          <Link className='btn btn-danger btn-sm' to="/pedidos">Cancelar</Link>
        </div>
      </form>
    </div>
  );
}