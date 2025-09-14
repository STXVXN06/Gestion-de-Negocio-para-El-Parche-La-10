import React, { useEffect, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import api from '../api';

export default function AgregarProducto() {
    const navigate = useNavigate();

    const [ingredientesDisponibles, setIngredientesDisponibles] = useState([]);
    const [ingredientesSeleccionados, setIngredientesSeleccionados] = useState([]);
    const [busqueda, setBusqueda] = useState('');

    const [producto, setProducto] = useState({
        nombre: '',
        tipo: '',
        precio: '',
        activo: true
    });

    const { nombre, tipo, precio, activo } = producto;

    const onInputChange = (e) => {
        setProducto({ ...producto, [e.target.name]: e.target.value });
    };

    const onSubmit = async (e) => {
        e.preventDefault();

        const productoParaEnviar = {
            ...producto,
            ingredientes: ingredientesSeleccionados
                .map(i => ({
                    ingredienteId: i.id,
                    cantidad: i.cantidad
                }))
        };

        try {
            await api.post('/api/productos', productoParaEnviar);
            navigate('/productos');
        } catch (error) {
            console.error("Error creando producto:", error);
        }
    };

    useEffect(() => {
        cargarIngredientes();
    }, []);

    const cargarIngredientes = async () => {
        try {
            const response = await api.get('/api/ingredientes');
            setIngredientesDisponibles(response.data);
        } catch (error) {
            console.error("Error cargando ingredientes:", error);
        }
    };

    // Filtrar ingredientes según la búsqueda
    const ingredientesFiltrados = busqueda
        ? ingredientesDisponibles.filter(ing =>
            ing.nombre.toLowerCase().includes(busqueda.toLowerCase()))
        : [];

    // Agregar ingrediente a la lista seleccionada
    const agregarIngrediente = (ingrediente) => {
        // Si ya está seleccionado, solo aumentar la cantidad
        const existe = ingredientesSeleccionados.find(i => i.id === ingrediente.id);
        if (existe) {
            setIngredientesSeleccionados(prev =>
                prev.map(i =>
                    i.id === ingrediente.id ? { ...i, cantidad: i.cantidad + 1 } : i
                )
            );
        } else {
            // Si no existe, agregar con cantidad 1
            setIngredientesSeleccionados(prev => [
                ...prev,
                { ...ingrediente, cantidad: 1 }
            ]);
        }
        setBusqueda(''); // Limpiar búsqueda
    };

    // Actualizar cantidad de un ingrediente seleccionado
    const actualizarCantidad = (id, nuevaCantidad) => {
        if (nuevaCantidad <= 0) {
            // Si la cantidad es 0 o menor, remover el ingrediente
            setIngredientesSeleccionados(prev =>
                prev.filter(i => i.id !== id)
            );
        } else {
            setIngredientesSeleccionados(prev =>
                prev.map(i => i.id === id ? { ...i, cantidad: nuevaCantidad } : i)
            );
        }
    };

    // Remover ingrediente completamente
    const removerIngrediente = (id) => {
        setIngredientesSeleccionados(prev =>
            prev.filter(i => i.id !== id)
        );
    };

    return (
        <div className="container py-4">
            <div className="card shadow-sm border-0">
                <div className="card-header bg-white py-3">
                    <div className="d-flex justify-content-between align-items-center">
                        <h1 className="h5 mb-0">Agregar Nuevo Producto</h1>
                        <Link to="/productos" className="btn btn-outline-secondary btn-sm">
                            <i className="bi bi-arrow-left me-1"></i> Volver
                        </Link>
                    </div>
                </div>

                <div className="card-body">
                    <form onSubmit={onSubmit}>
                        <div className="row">
                            <div className="col-md-6">
                                <div className="mb-3">
                                    <label htmlFor="nombre" className="form-label fw-medium">Nombre del Producto</label>
                                    <input
                                        type="text"
                                        className="form-control"
                                        id="nombre"
                                        placeholder="Ej: Hamburguesa Clásica"
                                        name="nombre"
                                        required
                                        value={nombre}
                                        onChange={onInputChange}
                                    />
                                </div>

                                <div className="mb-3">
                                    <label htmlFor="tipo" className="form-label fw-medium">Categoría</label>
                                    <select
                                        className="form-select"
                                        id="tipo"
                                        name="tipo"
                                        required
                                        value={tipo || ""}
                                        onChange={onInputChange}
                                    >
                                        <option value="">Seleccione una categoría</option>
                                        <option value="Hamburguesa">Hamburguesa</option>
                                        <option value="Arepa">Arepa</option>
                                        <option value="Sandwich">Sandwich</option>
                                        <option value="Bebida">Bebida</option>
                                        <option value="Otro">Otro</option>
                                    </select>
                                </div>

                                <div className="row">
                                    <div className="col-md-6 mb-3">
                                        <label htmlFor="precio" className="form-label fw-medium">Precio ($)</label>
                                        <div className="input-group">
                                            <span className="input-group-text">$</span>
                                            <input
                                                type="number"
                                                className="form-control"
                                                id="precio"
                                                placeholder="0.00"
                                                min="0"
                                                step="0.01"
                                                name="precio"
                                                required
                                                value={precio}
                                                onChange={onInputChange}
                                            />
                                        </div>
                                    </div>

                                    <div className="col-md-6 mb-3">
                                        <label htmlFor="activo" className="form-label fw-medium">Estado</label>
                                        <select
                                            className="form-select"
                                            id="activo"
                                            name="activo"
                                            required
                                            value={activo || ""}
                                            onChange={onInputChange}
                                        >
                                            <option value="">Seleccione estado</option>
                                            <option value="true">Activo</option>
                                            <option value="false">Inactivo</option>
                                        </select>
                                    </div>
                                </div>
                            </div>

                            <div className="col-md-6">
                                <div className="mb-3">
                                    <label className="form-label fw-medium">Ingredientes</label>

                                    <div className="input-group mb-2">
                                        <input
                                            type="text"
                                            className="form-control"
                                            placeholder="Buscar ingrediente..."
                                            value={busqueda}
                                            onChange={(e) => setBusqueda(e.target.value)}
                                        />
                                        <button
                                            className="btn btn-outline-secondary"
                                            type="button"
                                            disabled={!busqueda}
                                            onClick={() => {
                                                if (ingredientesFiltrados.length > 0) {
                                                    agregarIngrediente(ingredientesFiltrados[0]);
                                                }
                                            }}
                                        >
                                            <i className="bi bi-search"></i>
                                        </button>
                                    </div>

                                    {busqueda && ingredientesFiltrados.length > 0 && (
                                        <div className="card border mb-3">
                                            <div className="card-body p-2">
                                                <div className="list-group">
                                                    {ingredientesFiltrados.map(ingrediente => (
                                                        <button
                                                            key={ingrediente.id}
                                                            type="button"
                                                            className="list-group-item list-group-item-action d-flex justify-content-between align-items-center"
                                                            onClick={() => agregarIngrediente(ingrediente)}
                                                        >
                                                            <span>{ingrediente.nombre}</span>
                                                            <span className="badge bg-primary rounded-pill">
                                                                <i className="bi bi-plus"></i> Agregar
                                                            </span>
                                                        </button>
                                                    ))}
                                                </div>
                                            </div>
                                        </div>
                                    )}

                                    {ingredientesSeleccionados.length > 0 ? (
                                        <div className="card border">
                                            <div className="card-header bg-light py-2">
                                                <div className="d-flex justify-content-between align-items-center">
                                                    <span className="small fw-medium">Ingredientes seleccionados</span>
                                                    <span className="badge bg-primary">
                                                        {ingredientesSeleccionados.reduce((sum, i) => sum + i.cantidad, 0)} total
                                                    </span>
                                                </div>
                                            </div>
                                            <div className="card-body p-0">
                                                <ul className="list-group list-group-flush">
                                                    {ingredientesSeleccionados.map(ingrediente => (
                                                        <li
                                                            key={ingrediente.id}
                                                            className="list-group-item"
                                                        >
                                                            <div className="d-flex align-items-center justify-content-between">
                                                                <div>
                                                                    <span className="fw-medium">{ingrediente.nombre}</span>
                                                                </div>

                                                                <div className="d-flex align-items-center">
                                                                    <div className="btn-group me-2">
                                                                        <button
                                                                            type="button"
                                                                            className="btn btn-sm btn-outline-secondary"
                                                                            onClick={() => actualizarCantidad(ingrediente.id, ingrediente.cantidad - 1)}
                                                                        >
                                                                            <i className="bi bi-dash"></i>
                                                                        </button>
                                                                        <button
                                                                            type="button"
                                                                            className="btn btn-sm btn-light border"
                                                                            style={{ minWidth: '40px' }}
                                                                        >
                                                                            {ingrediente.cantidad}
                                                                        </button>
                                                                        <button
                                                                            type="button"
                                                                            className="btn btn-sm btn-outline-secondary"
                                                                            onClick={() => actualizarCantidad(ingrediente.id, ingrediente.cantidad + 1)}
                                                                        >
                                                                            <i className="bi bi-plus"></i>
                                                                        </button>
                                                                    </div>

                                                                    <button
                                                                        type="button"
                                                                        className="btn btn-sm btn-outline-danger"
                                                                        onClick={() => removerIngrediente(ingrediente.id)}
                                                                    >
                                                                        <i className="bi bi-trash"></i>
                                                                    </button>
                                                                </div>
                                                            </div>
                                                        </li>
                                                    ))}
                                                </ul>
                                            </div>
                                        </div>
                                    ) : (
                                        <div className="alert alert-info text-center mb-0">
                                            <i className="bi bi-info-circle me-2"></i>
                                            No se han agregado ingredientes
                                        </div>
                                    )}
                                </div>
                            </div>
                        </div>

                        <div className="d-flex justify-content-end gap-2 mt-4 pt-3 border-top">
                            <button type="submit" className="btn btn-primary">
                                <i className="bi bi-check-circle me-2"></i> Guardar Producto
                            </button>
                            <Link to="/productos" className="btn btn-outline-secondary">
                                Cancelar
                            </Link>
                        </div>
                    </form>
                </div>
            </div>
        </div>
    );
}