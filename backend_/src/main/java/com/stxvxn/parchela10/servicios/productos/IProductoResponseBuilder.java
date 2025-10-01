package com.stxvxn.parchela10.servicios.productos;

import java.util.List;

import com.stxvxn.parchela10.dto.ProductoConIngredientesResponse;
import com.stxvxn.parchela10.entidades.ProductoIngrediente;

/**
 * Interfaz para construcción de respuestas DTO de productos.
 * 
 * SOLID:
 * - SRP: Responsabilidad única de construir DTOs de respuesta
 * - ISP: Interfaz específica para construcción de respuestas
 * - OCP: Permite diferentes estrategias de construcción
 * 
 * Patrón: Builder Pattern
 */
public interface IProductoResponseBuilder {

    /**
     * Construye un DTO de respuesta completo desde una lista de ProductoIngrediente.
     * 
     * @param ingredientes Lista de ingredientes del producto
     * @return DTO con toda la información del producto e ingredientes
     */
    ProductoConIngredientesResponse buildResponse(List<ProductoIngrediente> ingredientes);
}