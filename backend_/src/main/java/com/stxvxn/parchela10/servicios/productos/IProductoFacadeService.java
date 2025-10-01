package com.stxvxn.parchela10.servicios.productos;

import java.util.Optional;

import com.stxvxn.parchela10.dto.ProductoConIngredienteDTO;
import com.stxvxn.parchela10.dto.ProductoConIngredientesResponse;
import com.stxvxn.parchela10.entidades.Producto;

/**
 * Facade que coordina operaciones complejas entre Producto y ProductoIngrediente.
 * 
 * SOLID:
 * - SRP: Responsabilidad única de coordinar operaciones compuestas
 * - ISP: Interfaz específica para operaciones de alto nivel
 * - DIP: Los clientes dependen de esta abstracción
 * 
 * Patrón: Facade Pattern
 * Objetivo: Simplificar la interacción con múltiples servicios relacionados
 */
public interface IProductoFacadeService {

    /**
     * Crea un producto junto con sus ingredientes en una transacción.
     * 
     * @param dto Datos del producto e ingredientes
     * @return Optional con el producto creado
     */
    Optional<Producto> crearProductoConIngredientes(ProductoConIngredienteDTO dto);

    /**
     * Actualiza un producto y reemplaza sus ingredientes.
     * 
     * @param id ID del producto a actualizar
     * @param dto Nuevos datos del producto e ingredientes
     * @return Optional con el producto actualizado
     */
    Optional<Producto> actualizarProductoConIngredientes(Long id, ProductoConIngredienteDTO dto);

    /**
     * Obtiene un producto con todos sus ingredientes detallados.
     * 
     * @param productoId ID del producto
     * @return Optional con el DTO de respuesta completo
     */
    Optional<ProductoConIngredientesResponse> obtenerProductoConIngredientes(Long productoId);
}