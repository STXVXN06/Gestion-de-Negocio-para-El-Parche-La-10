package com.stxvxn.parchela10.servicios;

import java.util.List;
import java.util.Optional;

import com.stxvxn.parchela10.entidades.ProductoIngrediente;

/*
 * Interfaz que define los métodos del servicio para la entidad ProductoIngrediente.
 */

public interface IProductoIngredienteService {

    Optional<ProductoIngrediente> agregarIngredienteAProducto(Long productoId, Long ingredienteId, Double cantidad);
   
    Optional<ProductoIngrediente> eliminarIngredienteDeProducto(Long productoId, Long ingredienteId);
   
    List<ProductoIngrediente> obtenerIngredientesDeProducto(Long productoId);

    void eliminarIngredientesDeProducto(Long productoId);

    
}
