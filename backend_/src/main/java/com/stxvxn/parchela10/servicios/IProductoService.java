package com.stxvxn.parchela10.servicios;

import java.util.List;
import java.util.Optional;
import com.stxvxn.parchela10.entidades.Producto;

/**
 * Interfaz que define los métodos del servicio para la entidad Producto.
 * Proporciona operaciones CRUD y búsqueda de productos.
 */
public interface IProductoService {

    List<Producto> findAll();

    Optional<Producto> findById(Long id);
    
    Producto save(Producto producto);

    Optional<Producto> update(Long id, Producto producto);

    Optional<Producto> delete(Long id);

}
