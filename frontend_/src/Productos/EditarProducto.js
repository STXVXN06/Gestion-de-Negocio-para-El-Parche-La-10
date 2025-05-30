import axios from 'axios';
import React, { useEffect, useState } from 'react'
import { Link, useNavigate, useParams } from 'react-router-dom';

export default function EditarProducto() {

    const{id} = useParams();

    let Navegacion = useNavigate();
    
    const [ingredientesDisponibles, setIngredientesDisponibles] = useState([]); 
    const [ingredientesSeleccionados, setIngredientesSeleccionados] = useState([]); 
    
    const [producto, setProducto] = useState({
        nombre: '',
        tipo: '',
        precio: '',
        activo: true,
        ingredientes: []
    })
    
    const{nombre, tipo, precio, activo, ingredientes} = producto

    const onInputChange = (e) => {
        setProducto({ ...producto, [e.target.name]: e.target.value });
    }

    // Al enviar el formulario
const onSubmit = async (e) => {
    e.preventDefault();
    
    const dto = {
        ...producto,
        ingredientes: ingredientesSeleccionados
            .filter(i => i.cantidad > 0)
            .map(i => ({
                ingredienteId: i.ingredienteId,
                cantidad: i.cantidad
            }))
    };

    await axios.put(`http://localhost:9090/api/productos/${id}`, dto);
    Navegacion('/productos');
};

useEffect(() => {
    const cargarDatos = async () => {
        try {
            // 1. Cargar ingredientes disponibles primero
            const ingredientesResponse = await axios.get('http://localhost:9090/api/ingredientes');
            setIngredientesDisponibles(ingredientesResponse.data);

            // 2. Si hay ID, cargar producto e ingredientes
            if (id) {
                const productoResponse = await axios.get(`http://localhost:9090/api/productos/${id}`);
                const ingredientesProductoResponse = await axios.get(`http://localhost:9090/api/productos/${id}/ingredientes`);
                
                // 3. Mapear ingredientes correctamente
                const ingredientesMapeados = ingredientesProductoResponse.data.ingredientes.map(pi => ({
                    ingredienteId: pi.id,
                    cantidad: pi.cantidadNecesaria
                }));

                // 4. Actualizar estados
                setProducto({
                    nombre: productoResponse.data.nombre,
                    tipo: productoResponse.data.tipo,
                    precio: productoResponse.data.precio,
                    activo: productoResponse.data.activo
                });
                
                setIngredientesSeleccionados(ingredientesMapeados);
            }
        } catch (error) {
            console.error("Error cargando datos:", error);
        }
    };
    
    cargarDatos();
}, [id]); // <- Agregar id como dependencia

// Corregir manejo de campo activo
const handleChange = (e) => {
    const { name, value } = e.target;
    setProducto(prev => ({
        ...prev,
        [name]: name === 'activo' ? value === 'true' : value
    }));
};

    

    const actualizarCantidad = (ingredienteId, nuevaCantidad) => {
        const cantidad = Math.max(nuevaCantidad, 0); // No permitir valores negativos
        
        setIngredientesSeleccionados(prev => {
            const existe = prev.find(i => i.ingredienteId === ingredienteId);
            if (existe) {
                return prev.map(i => 
                    i.ingredienteId === ingredienteId ? { ...i, cantidad } : i
                );
            }
            // const ingrediente = ingredientesDisponibles.find(i => i.id === ingredienteId);
            // return [...prev, { id: ingredienteId, nombre: ingrediente.nombre, cantidad }];
            return [...prev, {ingredienteId, cantidad}]
        });
    };

    const manejarCambioCantidad = (ingredienteId, operacion) => {
        const ingrediente = ingredientesSeleccionados.find(i => i.id === ingredienteId);
        const cantidadActual = ingrediente ? ingrediente.cantidad : 0;
        
        if (operacion === 'sumar') {
            actualizarCantidad(ingredienteId, cantidadActual + 1);
        } else if (operacion === 'restar') {
            actualizarCantidad(ingredienteId, cantidadActual - 1);
        }
    };

  return (
    
        
    <div className='container'>
    <div className='container text-center' style={{ margin: '30px' }}>
      <h1>Editar Producto</h1>
    </div>
      <form onSubmit={(e) => onSubmit(e)}>
          <div className='mb-3'>
              <label htmlFor="nombre" className='form-label'>Nombre</label>
              <input type="text" className='form-control' id="nombre" 
              name='nombre' required={true} value={nombre} onChange={(e) => onInputChange(e)}/>
          </div>
          <div className='mb-3'>
              <label htmlFor="tipo" className='form-label'>Tipo</label>
              <select className='form-control' id="tipo" name='tipo' required={true}
              value={tipo || ""} onChange={(e) => onInputChange(e)}>
                  <option value="">Seleccione una categoria</option>
                  <option value="Hamburguesa">Hamburguesa</option>
                  <option value="Arepa">Arepa</option>
                  <option value="Sandwich">Sandwich</option>
                  <option value="Bebida">Bebida</option>
              </select>
          </div>
          <div className='mb-3'>
              <label htmlFor="precio" className='form-label'>Precio</label>
              <input type="number" className='form-control' id="precio" 
              name='precio' required={true} value={precio} onChange={(e) => onInputChange(e)}/>
          </div>
            <div className='mb-3'>
                <label htmlFor="activo" className='form-label'>Activo</label>
                <select 
                    className='form-control' 
                    id="activo" 
                    name='activo' 
                    required
                    value={producto.activo.toString()}
                    onChange={handleChange}
                >
                    <option value="true">Sí</option>
                    <option value="false">No</option>
                </select>
            </div>
          
            <div className='mb-3'>
                <h4>Seleccione los ingredientes necesarios</h4>
                <div className='row'>
                    {
                        ingredientesDisponibles.map((ingrediente) => {
                            const seleccionado = ingredientesSeleccionados.find(i => i.ingredienteId === ingrediente.id);
                            return(
                                <div key={ingrediente.id} className='col-4'>
                                <div className='card mb-3'>
                                    <div className='card-body'>
                                        <div className='d-flex align-items-center justify-content-center'>
                                            <h5 className='card-title' >{ingrediente.nombre}</h5>
                                        </div>
                                        <div className='d-flex align-items-center justify-content-center'>
                                            <button
                                                type='button'
                                                className='btn btn-secondary btn-sm'
                                                onClick={() => manejarCambioCantidad(ingrediente.id, 'restar')}
                                            >
                                                -
                                            </button>
                                            
                                            <input
                                                type="text"
                                                className='form-control mx-2 text-center'
                                                style={{width: '70px'}}
                                                value={seleccionado?.cantidad || 0}
                                                onChange={(e) => actualizarCantidad(
                                                    ingrediente.id, 
                                                    parseInt(e.target.value) || 0
                                                )}
                                            />
                                            
                                            <button
                                                type='button'
                                                className='btn btn-secondary btn-sm'
                                                onClick={() => manejarCambioCantidad(ingrediente.id, 'sumar')}
                                            >
                                                +
                                            </button>
                                        </div>
                                    
                                    </div>
                                </div>
                            </div>
                            );
                        }
                            
                        )
                    }
                </div>
            </div>



          <div className='container text-center'>
              <button type="submit" className='btn btn-warning btn-sm me-3'>Guardar</button>
              <Link className='btn btn-danger btn-sm' to="/productos">Cancelar</Link>
          </div>


      </form>
  </div>
  


  )
}
