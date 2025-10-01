package com.stxvxn.parchela10.validation;

import java.util.List;

import com.stxvxn.parchela10.dto.ProductoConIngredienteDTO;

/**
 * Interfaz para validación de ingredientes de productos.
 * 
 * SOLID:
 * - SRP: Responsabilidad única de validar datos de ingredientes
 * - ISP: Interfaz específica para validación
 * - OCP: Permite crear diferentes estrategias de validación
 */
public interface IProductoIngredienteValidator {

    /**
     * Valida que la lista de ingredientes sea correcta.
     * 
     * @param ingredientes Lista de ingredientes a validar
     * @return true si todos los ingredientes son válidos
     */
    boolean validarIngredientes(List<ProductoConIngredienteDTO.IngredienteCantidad> ingredientes);

    /**
     * Valida un ingrediente individual.
     * 
     * @param ingrediente Ingrediente a validar
     * @return true si el ingrediente es válido
     */
    boolean validarIngrediente(ProductoConIngredienteDTO.IngredienteCantidad ingrediente);
}