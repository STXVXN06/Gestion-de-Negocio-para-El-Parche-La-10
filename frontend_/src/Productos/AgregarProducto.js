import axios from 'axios';
import React, { useEffect, useState } from 'react'
import { Link, useNavigate } from 'react-router-dom';

export default function AgregarProducto() {



    let Navegacion = useNavigate();
    
    const [ingredientesDisponibles, setIngredientesDisponibles] = useState([]); 
    const [ingredientesSeleccionados, setIngredientesSeleccionados] = useState([]); 
    
    const [producto, setProducto] = useState({
        nombre: '',
        tipo: '',
        precio: '',
        activo: true
    })
    
    const{nombre, tipo, precio, activo} = producto

    const onInputChange = (e) => {
        setProducto({ ...producto, [e.target.name]: e.target.value });
    }

    const onSubmit = async (e) => {
        e.preventDefault();
        
        const productoParaEnviar = {
            ...producto,
            ingredientes: ingredientesSeleccionados
                .filter(i => i.cantidad > 0)
                .map(i => ({
                    ingredienteId: i.id,
                    cantidad: i.cantidad
                }))
        };

        try {
            await axios.post('http://localhost:9090/api/productos', productoParaEnviar);
            Navegacion('/productos');
        } catch (error) {
            console.error("Error creando producto:", error);
        }
    };

    useEffect(() => {
      cargarIngredientes();
    }, []);
  
    
    const cargarIngredientes = async () => {
        try {
            const response = await axios.get('http://localhost:9090/api/ingredientes');
            setIngredientesDisponibles(response.data);
            console.log("Resultado de cargar ingredientes");
            console.log(response.data);

        } catch (error) {
            console.error("Error cargando ingredientes:", error);
        }
    };

    const actualizarCantidad = (ingredienteId, nuevaCantidad) => {
        const cantidad = Math.max(nuevaCantidad, 0); // No permitir valores negativos
        
        setIngredientesSeleccionados(prev => {
            const existe = prev.find(i => i.id === ingredienteId);
            if (existe) {
                return prev.map(i => 
                    i.id === ingredienteId ? { ...i, cantidad } : i
                );
            }
            const ingrediente = ingredientesDisponibles.find(i => i.id === ingredienteId);
            return [...prev, { id: ingredienteId, nombre: ingrediente.nombre, cantidad }];
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
      <h1>Agregar Producto</h1>
    </div>
      <form onSubmit={(e) => onSubmit(e)}>
          <div className='mb-3'>
              <label htmlFor="nombre" className='form-label'>Nombre</label>
              <input type="text" className='form-control' id="nombre" placeholder='Nombre del producto' 
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
              <input type="number" className='form-control' id="precio" placeholder='Precio del producto' 
              name='precio' required={true} value={precio} onChange={(e) => onInputChange(e)}/>
          </div>
            <div className='mb-3'>
                <label htmlFor="activo" className='form-label'>Activo</label>
                <select className='form-control' id="activo" name='activo' required={true}
                value={activo || ""} onChange={(e) => onInputChange(e)}>
                    <option value="">Seleccione una opcion</option>
                    <option value="true">Si</option>
                    <option value="false">No</option>
                </select>
            </div>
          
            <div className='mb-3'>
                <h4>Seleccionado los ingredientes necesarios</h4>
                <div className='row'>
                    {
                        ingredientesDisponibles.map((ingrediente) => (
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
                                                value={ingredientesSeleccionados.find(i => i.id === ingrediente.id)?.cantidad || 0}
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
                        ))
                    }
                </div>
            </div>



          <div className='container text-center'>
              <button type="submit" className='btn btn-warning btn-sm me-3'>Guardar</button>
              <Link className='btn btn-danger btn-sm' to="/ingredientes">Cancelar</Link>
          </div>


      </form>
  </div>
  


  )
}
