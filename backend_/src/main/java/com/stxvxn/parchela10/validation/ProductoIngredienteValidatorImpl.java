package com.stxvxn.parchela10.validation;

import java.util.List;

import org.springframework.stereotype.Component;

import com.stxvxn.parchela10.dto.ProductoConIngredienteDTO;

/**
 * Implementación de validación para ingredientes de productos.
 * 
 * SOLID:
 * - SRP: Solo valida, no modifica ni persiste datos
 * - OCP: Puede extenderse creando nuevos validadores
 */
@Component
public class ProductoIngredienteValidatorImpl implements IProductoIngredienteValidator {

    @Override
    public boolean validarIngredientes(List<ProductoConIngredienteDTO.IngredienteCantidad> ingredientes) {
        if (ingredientes == null || ingredientes.isEmpty()) {
            return false;
        }

        return ingredientes.stream()
                .allMatch(this::validarIngrediente);
    }

    @Override
    public boolean validarIngrediente(ProductoConIngredienteDTO.IngredienteCantidad ingrediente) {
        if (ingrediente == null) {
            return false;
        }

        if (ingrediente.getIngredienteId() == null) {
            return false;
        }

        if (ingrediente.getCantidad() == null || ingrediente.getCantidad() <= 0) {
            return false;
        }

        return true;
    }
}